"use client"

import { useCallback, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase/client"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { uid } from "@/lib/storage/firestore/shared"
import {
  berechneVerfuegbarkeit,
  type TerminMitStatus,
  type VerfuegbarkeitsBlock,
  type VerfuegbarkeitsEinstellungen,
} from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { aktuellerSonntagStr, snapZuSonntag, toISODatum, wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"
import Link from "next/link"
import { PDFVerfuegbarkeitButton } from "@/app/components/PDFVerfuegbarkeitButton"
import type { Bundesland } from "@/lib/types"
import { feiertagName, istFeiertag } from "@/lib/calc/holidays"
import {
  type TerminRoh,
  getCachedTermine,
  setCachedTermine,
  loadSavedSelection,
  saveSelection,
} from "@/lib/verfuegbarkeit/eventCache"
import { resolveStatus } from "@/lib/verfuegbarkeit/status"

// ─── Typen ───────────────────────────────────────────────────────────────────

interface KalenderInfo { id: string; name: string; farbe: string; defaultStatus: "LOCKED" | "FLEXIBLE" }

interface ArchivEintrag {
  id: string
  erstelltAm: Date
  datumVon: string
  datumBis: string
  kalenderwochen: number[]
  gesamtMinuten: number
}

// ─── Einstellungen (später aus Firestore) ────────────────────────────────────

const VERF_EINSTELLUNGEN: VerfuegbarkeitsEinstellungen = {
  fensterStartMin: 360,
  fensterEndeMin: 1230,
  mindestdauerMin: 180,
  puffer: [
    { suchtext: "Berliner Tor", pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Stiftstraße",  pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Steindamm",    pufferVorMin: 30, pufferNachMin: 30 },
  ],
  pufferFallbackMin: 30,
}

const KW_ANKER_DEFAULT = "2026-02-01"
const BERLIN = "Europe/Berlin"

const BUNDESLAENDER: { value: Bundesland; label: string }[] = [
  { value: "BB", label: "Brandenburg" }, { value: "BE", label: "Berlin" },
  { value: "BW", label: "Baden-Württemberg" }, { value: "BY", label: "Bayern" },
  { value: "HB", label: "Bremen" }, { value: "HE", label: "Hessen" },
  { value: "HH", label: "Hamburg" }, { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" }, { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" }, { value: "SH", label: "Schleswig-Holstein" },
  { value: "SL", label: "Saarland" }, { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" }, { value: "TH", label: "Thüringen" },
]

/**
 * Erzeugt ganztägige LOCKED-Termine für jeden gesetzlichen Feiertag im Zeitraum.
 * Feiertag = LOCKED-Termin, kein Sonderfall im Berechnungscode.
 */
function feiertagsTermine(tage: string[], bundesland: Bundesland): TerminMitStatus[] {
  return tage.flatMap((datum) => {
    const date = new Date(datum + "T12:00:00")
    if (!istFeiertag(date, bundesland)) return []
    return [{
      uid: `feiertag-${datum}`,
      titel: feiertagName(date, bundesland)!,
      beginn: new Date(datum + "T00:00:00Z"),
      ende: new Date(new Date(datum + "T00:00:00Z").getTime() + 86_400_000),
      ganztaegig: true,
      status: "LOCKED" as const,
    }]
  })
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function berlinDatumStr(date: Date): string {
  return date.toLocaleDateString("sv", { timeZone: BERLIN })
}

function berlinUhrzeit(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("de-DE", {
    timeZone: BERLIN, hour: "2-digit", minute: "2-digit",
  })
}

function formatTagKopf(datum: string): string {
  return new Date(datum + "T12:00:00Z").toLocaleDateString("de-DE", {
    timeZone: BERLIN, weekday: "long", day: "2-digit", month: "2-digit",
  })
}


function blockKey(b: VerfuegbarkeitsBlock): string {
  return `${b.datum}|${b.start}|${b.ende}`
}

function parseDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 12)
}

function formatDauerMin(min: number): string {
  return (min / 60).toFixed(1).replace(".", ",") + " Std"
}

async function getToken(): Promise<string> {
  const t = await auth.currentUser?.getIdToken()
  if (!t) throw new Error("Nicht angemeldet")
  return t
}

async function apiGet(path: string): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${(b as Record<string, string>).fehler ?? res.statusText}`)
  }
  return res.json()
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function VerfuegbarkeitPage() {
  // Zeitraum
  const [startSonntagStr, setStartSonntagStr] = useState(aktuellerSonntagStr)
  const [anzahlWochen, setAnzahlWochen] = useState(2)

  // Daten
  const [kalender, setKalender] = useState<KalenderInfo[]>([])
  const [termine, setTermine] = useState<TerminMitStatus[]>([])
  const [verfBlöcke, setVerfBlöcke] = useState<VerfuegbarkeitsBlock[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  // Auswahl
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())

  // Settings
  const [bundesland, setBundesland] = useState<Bundesland>("HH")
  const [kwAnker] = useState(KW_ANKER_DEFAULT)

  // Archiv
  const [archivListe, setArchivListe] = useState<ArchivEintrag[]>([])

  // Kalender + Arbeitgeber-Bundesland beim Start laden
  useEffect(() => {
    apiGet("/api/ical")
      .then((d) => setKalender((d as { kalender: KalenderInfo[] }).kalender))
      .catch((e) => setFehler(String(e)))
    // Bundesland vom ersten aktiven Arbeitgeber als Default übernehmen
    import("@/lib/storage").then(({ employers }) =>
      employers.findAktive().then((emps) => {
        if (emps[0]?.bundesland) setBundesland(emps[0].bundesland)
      }),
    ).catch(() => { /* Fallback bleibt HH */ })
  }, [])

  // Archiv beim Start laden
  useEffect(() => {
    ladeArchiv()
  }, [])

  async function ladeArchiv() {
    try {
      const snap = await getDocs(
        query(collection(db, "users", uid(), "verfuegbarkeit_archiv"), orderBy("erstelltAm", "desc")),
      )
      setArchivListe(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            erstelltAm: (data.erstelltAm as { toDate(): Date }).toDate(),
            datumVon: data.datumVon as string,
            datumBis: data.datumBis as string,
            kalenderwochen: data.kalenderwochen as number[],
            gesamtMinuten: data.gesamtMinuten as number,
          }
        }),
      )
    } catch { /* Archiv-Fehler sind nicht kritisch */ }
  }

  // Neu berechnen wenn Zeitraum oder Kalender sich ändern
  const berechneFetch = useCallback(async () => {
    if (kalender.length === 0) return
    setFehler("")

    const wochen = wochenDaten(startSonntagStr, anzahlWochen)
    const von = wochen[0][0]
    const bis = wochen[wochen.length - 1][6]
    const alleTage = wochen.flat()
    const moSaTage = alleTage.filter((_, i) => i % 7 !== 0)
    const kalenderKey = `${kalender.map((k) => k.id).sort().join(",")}_${von}_${bis}`

    function verarbeiteRohdaten(rohdatenProKalender: { roh: TerminRoh[]; k: KalenderInfo }[]) {
      const alleTermine: TerminMitStatus[] = []
      for (const { roh, k } of rohdatenProKalender) {
        for (const t of roh) {
          alleTermine.push({
            uid: t.uid, titel: t.titel,
            beginn: new Date(t.beginn), ende: new Date(t.ende),
            ganztaegig: t.ganztaegig, ort: t.ort,
            status: resolveStatus(t.titel, k.defaultStatus),
          })
        }
      }
      const feiertage = feiertagsTermine(alleTage, bundesland)
      const mitFeiertagen = [...alleTermine, ...feiertage]
      setTermine(mitFeiertagen)
      setVerfBlöcke(berechneVerfuegbarkeit(mitFeiertagen, moSaTage, VERF_EINSTELLUNGEN))
    }

    // Cache-Check: gecachte Daten sofort anzeigen, kein Ladezustand
    const allCached = kalender.map((k) => ({
      k,
      roh: getCachedTermine(`${k.id}_${von}_${bis}`) ?? [],
    }))
    const isCacheHit = allCached.every(({ roh }) => roh.length > 0 || true) &&
      allCached.some(({ roh }) => roh.length > 0)

    if (isCacheHit) {
      // Sofort rendern — kein Skeleton nötig
      verarbeiteRohdaten(allCached)
      setLaden(false)
      return
    }

    // Kein Cache: Skeleton zeigen und von der API laden
    setLaden(true)
    try {
      const ergebnisse = await Promise.all(
        kalender.map(async (k) => {
          const cacheKey = `${k.id}_${von}_${bis}`
          const cached = getCachedTermine(cacheKey)
          if (cached) return { k, roh: cached }
          const data = await apiGet(`/api/ical?id=${k.id}&von=${von}&bis=${bis}`) as { termine: TerminRoh[] }
          setCachedTermine(cacheKey, data.termine)
          return { k, roh: data.termine }
        }),
      )
      // Alle Rohdaten auch gebündelt cachen (für Tab-Switch-Check)
      void kalenderKey
      verarbeiteRohdaten(ergebnisse)
    } catch (e) {
      setFehler(String(e))
    } finally {
      setLaden(false)
    }
  }, [kalender, startSonntagStr, anzahlWochen, bundesland])

  useEffect(() => {
    berechneFetch()
  }, [berechneFetch])

  // Gespeicherte Auswahl laden wenn Woche wechselt
  useEffect(() => {
    setAusgewaehlt(loadSavedSelection(startSonntagStr))
  }, [startSonntagStr])

  function toggleBlock(b: VerfuegbarkeitsBlock) {
    const key = blockKey(b)
    setAusgewaehlt((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      // Optimistic: sofort in UI + asynchron in localStorage (kein await nötig)
      saveSelection(startSonntagStr, next)
      return next
    })
  }

  async function nachExport() {
    const ausgewaehlteBlöcke = verfBlöcke.filter((b) => ausgewaehlt.has(blockKey(b)))
    const wochen = wochenDaten(startSonntagStr, anzahlWochen)
    const { tkWoche } = await import("@/lib/verfuegbarkeit/kwBerechnung")
    const kwNummern = wochen.map((w) => tkWoche(w[0], kwAnker))
    await addDoc(collection(db, "users", uid(), "verfuegbarkeit_archiv"), {
      erstelltAm: serverTimestamp(),
      datumVon: wochen[0][0],
      datumBis: wochen[wochen.length - 1][6],
      kalenderwochen: kwNummern,
      gesamtMinuten: ausgewaehlteBlöcke.reduce((s, b) => s + b.dauerMin, 0),
      bloecke: ausgewaehlteBlöcke.map((b) => ({ datum: b.datum, start: b.start, ende: b.ende })),
    })
    ladeArchiv()
  }

  // Abgeleitete Werte
  const ausgewaehlteBlöcke = verfBlöcke.filter((b) => ausgewaehlt.has(blockKey(b)))
  const gesamtMin = ausgewaehlteBlöcke.reduce((s, b) => s + b.dauerMin, 0)
  const wochen = wochenDaten(startSonntagStr, anzahlWochen)

  // Lookup-Maps
  const verfBlöckeNachDatum = verfBlöcke.reduce<Record<string, VerfuegbarkeitsBlock[]>>(
    (acc, b) => { (acc[b.datum] ??= []).push(b); return acc },
    {},
  )
  const termineNachDatum = termine.reduce<Record<string, TerminMitStatus[]>>(
    (acc, t) => {
      const datum = berlinDatumStr(t.beginn)
      ;(acc[datum] ??= []).push(t)
      return acc
    },
    {},
  )

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-2xl px-4 pt-6">

        {/* ── Zeitraum-Steuerung ──────────────────────────────────────── */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold sf-text">Verfügbarkeit</h1>
            <Link href="/einstellungen"
              className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Kalender verwalten">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="2.5"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.42M11.54 4.46l1.41-1.41"/>
              </svg>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs sf-text-2 mb-1">Ab (wird auf Sonntag eingerastet)</label>
              <input
                type="date"
                value={startSonntagStr}
                onChange={(e) => {
                  if (!e.target.value) return
                  setStartSonntagStr(toISODatum(snapZuSonntag(new Date(e.target.value + "T12:00:00Z"))))
                }}
                className="rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
              />
            </div>
            <div>
              <label className="block text-xs sf-text-2 mb-1">Wochen</label>
              <select
                value={anzahlWochen}
                onChange={(e) => setAnzahlWochen(Number(e.target.value))}
                className="rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sf-text-2 mb-1">Bundesland (Feiertage)</label>
              <select
                value={bundesland}
                onChange={(e) => setBundesland(e.target.value as Bundesland)}
                className="rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
              >
                {BUNDESLAENDER.map((bl) => (
                  <option key={bl.value} value={bl.value}>{bl.label} ({bl.value})</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* ── Fehler ─────────────────────────────────────────────────── */}
        {fehler && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        {/* ── Keine Kalender ─────────────────────────────────────────── */}
        {kalender.length === 0 && !laden && (
          <div className="sf-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm sf-text-2">Noch keine Kalender eingerichtet.</p>
            <p className="text-xs sf-text-3 mt-1">
              Kalender-URLs im <a href="/debug-ical" className="underline">Debug-Bereich</a> hinterlegen.
            </p>
          </div>
        )}

        {/* ── Wochensumme + PDF (sticky oben auf mobile) ─────────────── */}
        {verfBlöcke.length > 0 && (
          <div className="sf-card rounded-2xl px-4 py-3 mb-4 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sf-text-2">Ausgewählt</p>
              <p className="text-lg font-semibold sf-text nums">
                {formatDauerMin(gesamtMin)}
              </p>
            </div>
            <PDFVerfuegbarkeitButton
              startSonntagStr={startSonntagStr}
              anzahlWochen={anzahlWochen}
              ausgewaehlt={ausgewaehlteBlöcke}
              bundesland={bundesland}
              kwAnker={kwAnker}
              onNachExport={nachExport}
            />
          </div>
        )}

        {/* ── Wochenansicht ───────────────────────────────────────────── */}
        {laden ? (
          <WochenSkeleton anzahlWochen={anzahlWochen} />
        ) : (
          <div className="space-y-6 pb-4">
            {wochen.map((wocheDaten, wi) => (
              <section key={wocheDaten[0]}>
                {/* Wochen-Trenner */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold sf-text-2 uppercase tracking-wide">
                    Woche {wi + 1}
                  </span>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-neutral-800" />
                </div>

                <div className="space-y-2">
                  {wocheDaten.map((datum, tagIdx) => {
                    const istSo = tagIdx === 0
                    const date = parseDatum(datum)
                    const feiertag = feiertagName(date, bundesland)
                    const blöcke = verfBlöckeNachDatum[datum] ?? []
                    const termineHeute = (termineNachDatum[datum] ?? []).filter(
                      (t) => t.status !== "RELEASED",
                    )

                    return (
                      <div
                        key={datum}
                        className={`sf-card rounded-2xl p-4 shadow-sm ${
                          feiertag ? "border border-red-100 dark:border-red-900/40" : ""
                        }`}
                      >
                        {/* Tag-Kopf */}
                        <div className="flex items-baseline justify-between mb-2">
                          <h3 className={`text-sm font-medium ${feiertag ? "text-red-600 dark:text-red-400" : "sf-text"}`}>
                            {formatTagKopf(datum)}
                          </h3>
                          {feiertag && (
                            <span className="text-xs text-red-500 dark:text-red-400">{feiertag}</span>
                          )}
                        </div>

                        {/* Sonntag oder Feiertag */}
                        {(istSo || feiertag) ? (
                          <p className="text-xs sf-text-3">— nicht verfügbar</p>
                        ) : blöcke.length === 0 ? (
                          <>
                            <p className="text-xs sf-text-3">— keine freien Blöcke ≥ 3 Std</p>
                            {/* Blocking-Termine trotzdem anzeigen */}
                            {termineHeute.length > 0 && (
                              <EreignisListe termine={termineHeute} />
                            )}
                          </>
                        ) : (
                          <>
                            {/* Freie Blöcke — antippbar */}
                            <div className="space-y-2 mb-3">
                              {blöcke.map((b) => {
                                const key = blockKey(b)
                                const aktiv = ausgewaehlt.has(key)
                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleBlock(b)}
                                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-100 active:scale-[.98] ${
                                      aktiv
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
                                    }`}
                                  >
                                    <span className="text-sm font-medium font-mono">
                                      {b.start}–{b.ende}
                                    </span>
                                    <span className={`text-xs ${aktiv ? "text-blue-100" : "sf-text-3"}`}>
                                      {formatDauerMin(b.dauerMin)}
                                      {aktiv ? " ✓" : ""}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>

                            {/* Blockierende Termine (grau, informativ) */}
                            {termineHeute.length > 0 && (
                              <EreignisListe termine={termineHeute} />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Archiv ─────────────────────────────────────────────────── */}
        {archivListe.length > 0 && (
          <section className="mt-8 mb-4">
            <h2 className="text-xs font-semibold sf-text-2 uppercase tracking-wide mb-3">
              Zuletzt exportiert
            </h2>
            <div className="space-y-2">
              {archivListe.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  className="sf-card rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium sf-text">
                      KW {e.kalenderwochen.join(" + ")}
                    </p>
                    <p className="text-xs sf-text-3">
                      {e.erstelltAm.toLocaleDateString("de-DE")} ·{" "}
                      {formatDauerMin(e.gesamtMinuten)}
                    </p>
                  </div>
                  <span className="text-xs sf-text-3 whitespace-nowrap">
                    {e.datumVon} – {e.datumBis}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function WochenSkeleton({ anzahlWochen }: { anzahlWochen: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: anzahlWochen }, (_, wi) => (
        <section key={wi}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-14 rounded bg-stone-200 dark:bg-neutral-800 animate-pulse" />
            <div className="flex-1 h-px bg-stone-200 dark:bg-neutral-800" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, di) => (
              <div key={di} className="sf-card rounded-2xl p-4 shadow-sm">
                <div className="h-4 w-36 rounded bg-stone-200 dark:bg-neutral-800 animate-pulse mb-3" />
                {di > 0 && di < 6 && (
                  <div className="h-11 rounded-xl bg-stone-100 dark:bg-neutral-800 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Unterkomponente: Termineist im Tag ──────────────────────────────────────

function EreignisListe({ termine }: { termine: TerminMitStatus[] }) {
  return (
    <div className="mt-1 space-y-0.5">
      {termine
        .sort((a, b) => a.beginn.getTime() - b.beginn.getTime())
        .map((t, i) => (
          <p key={i} className="text-xs sf-text-3 truncate">
            {t.ganztaegig ? (
              <span>◼ {t.titel}</span>
            ) : (
              <span>
                {berlinUhrzeit(t.beginn.toISOString())}–{berlinUhrzeit(t.ende.toISOString())}
                {" "}
                <span className={t.status === "LOCKED" ? "text-red-400" : "text-amber-400"}>
                  {"●"}
                </span>
                {" "}{t.titel}
              </span>
            )}
          </p>
        ))}
    </div>
  )
}
