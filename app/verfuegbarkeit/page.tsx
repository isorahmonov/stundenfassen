"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { auth, db } from "@/lib/firebase/client"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { uid } from "@/lib/storage/firestore/shared"
import {
  berechneVerfuegbarkeit,
  einstellungenVonArbeitgeber,
  NEUTRALE_EINSTELLUNGEN,
  type TerminMitStatus,
  type VerfuegbarkeitsBlock,
} from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { aktuellerSonntagStr, snapZuSonntag, toISODatum, wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"
import { PDFVerfuegbarkeitButton } from "@/app/components/PDFVerfuegbarkeitButton"
import { EmailVerfuegbarkeitButton } from "@/app/components/EmailVerfuegbarkeitButton"
import type { Bundesland, Employer, GeplanteSchicht, VerfuegbarkeitsEinstellungenArbeitgeber } from "@/lib/types"
import { feiertagName, istFeiertag } from "@/lib/calc/holidays"
import {
  type TerminRoh,
  getCachedTermine,
  setCachedTermine,
  getStaleTermine,
  loadSavedSelection,
  saveSelection,
} from "@/lib/verfuegbarkeit/eventCache"
import { resolveStatus } from "@/lib/verfuegbarkeit/status"
import { employers as employersRepo, geplanteSchichten as geplanteRepo, shifts as shiftsRepo } from "@/lib/storage"
import { EinrichtungsDialog, sollDialogOeffnen } from "../components/EinrichtungsDialog"

// ─── Typen ───────────────────────────────────────────────────────────────────

interface KalenderInfo { id: string; name: string; farbe: string; defaultStatus: "LOCKED" | "FLEXIBLE" }

interface ArchivEintrag {
  id: string
  erstelltAm: Date
  datumVon: string
  datumBis: string
  kalenderwochen: number[]
  gesamtMinuten: number
  employerId?: string
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const BERLIN = "Europe/Berlin"

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

function uhrzeitZuMin(s: string): number {
  const [h, m] = s.split(":").map(Number)
  return h * 60 + m
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

// ─── Termine aus Einstellungen ────────────────────────────────────────────────

function festeSperrzeitenTermine(
  einst: VerfuegbarkeitsEinstellungenArbeitgeber,
  tage: string[],
): TerminMitStatus[] {
  return tage.flatMap((datum) => {
    const wochentag = parseDatum(datum).getDay()  // 0=So…6=Sa
    return einst.festeSperrzeiten
      .filter((s) => s.wochentag === wochentag)
      .map((s) => ({
        uid: `fest-${datum}-${s.von}`,
        titel: s.bezeichnung,
        beginn: new Date(`${datum}T${s.von}:00`),
        ende:   new Date(`${datum}T${s.bis}:00`),
        ganztaegig: false,
        status: "LOCKED" as const,
      }))
  })
}

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

function geplanteTermine(schichten: GeplanteSchicht[], alleTage: string[]): TerminMitStatus[] {
  const tageSet = new Set(alleTage)
  return schichten
    .filter((s) => tageSet.has(s.datum))
    .map((s) => ({
      uid: `geplant-${s.id}`,
      titel: "Schicht",
      beginn: new Date(`${s.datum}T${s.start}:00`),
      ende:   new Date(`${s.datum}T${s.ende}:00`),
      ganztaegig: false,
      status: "LOCKED" as const,
    }))
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function VerfuegbarkeitPage() {
  const [startSonntagStr, setStartSonntagStr] = useState(aktuellerSonntagStr)
  const [anzahlWochen, setAnzahlWochen] = useState(2)

  const [alleAktiveArbeitgeber, setAlleAktiveArbeitgeber] = useState<Employer[]>([])
  const [selectedEmployerId, setSelectedEmployerId] = useState<string>("")

  const [kalender, setKalender] = useState<KalenderInfo[]>([])
  const [termine, setTermine] = useState<TerminMitStatus[]>([])
  const [verfBlöcke, setVerfBlöcke] = useState<VerfuegbarkeitsBlock[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())
  const [archivListe, setArchivListe] = useState<ArchivEintrag[]>([])
  const [geplanteSchichtenListe, setGeplanteSchichtenListe] = useState<GeplanteSchicht[]>([])

  const [einrichtungsId, setEinrichtungsId] = useState<string | null>(null)
  const einrichtungsEmployer = einrichtungsId ? alleAktiveArbeitgeber.find((e) => e.id === einrichtungsId) : undefined

  const [zuletztAktualisiert, setZuletztAktualisiert] = useState<Date | null>(null)
  const letzterRefreshRef = useRef(0)
  const berechneFetchRef = useRef<(opts?: { force?: boolean }) => Promise<void>>(async () => {})

  // Ausgewählter Arbeitgeber
  const selectedEmployer = alleAktiveArbeitgeber.find((e) => e.id === selectedEmployerId) ?? null
  const einst: VerfuegbarkeitsEinstellungenArbeitgeber = selectedEmployer?.verfuegbarkeit ?? NEUTRALE_EINSTELLUNGEN
  const bundesland = (selectedEmployer?.bundesland ?? "HH") as Bundesland

  // Beim Start: Arbeitgeber, Kalender und geplante Schichten laden
  useEffect(() => {
    employersRepo.findAktive().then((emps) => {
      setAlleAktiveArbeitgeber(emps)
      if (emps.length > 0) {
        setSelectedEmployerId(emps[0].id)
        if (sollDialogOeffnen(emps[0])) setEinrichtungsId(emps[0].id)
      }
    }).catch(() => {})

    apiGet("/api/ical")
      .then((d) => setKalender((d as { kalender: KalenderInfo[] }).kalender))
      .catch((e) => setFehler(String(e)))

    geplanteRepo.findAlle().then(setGeplanteSchichtenListe).catch(() => {})
  }, [])

  useEffect(() => { ladeArchiv() }, [])

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
            employerId: data.employerId as string | undefined,
          }
        }),
      )
    } catch { /* Archiv-Fehler sind nicht kritisch */ }
  }

  const berechneFetch = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (kalender.length === 0) return
    setFehler("")

    const wochen = wochenDaten(startSonntagStr, anzahlWochen)
    const von = wochen[0][0]
    const bis = wochen[wochen.length - 1][6]
    const alleTage = wochen.flat()

    // Erlaubte Tage aus Einstellungen (wochentage: 0=So…6=Sa, entspricht Index in der Woche)
    const erlaubteTage = alleTage.filter((_, i) => einst.wochentage.includes(i % 7))

    function verarbeiteRohdaten(rohdaten: { roh: TerminRoh[]; k: KalenderInfo }[]) {
      const alleTermine: TerminMitStatus[] = []
      for (const { roh, k } of rohdaten) {
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
      const festeSperrzeiten = festeSperrzeitenTermine(einst, alleTage)
      const geplant = geplanteTermine(geplanteSchichtenListe, alleTage)
      const mitAllem = [...alleTermine, ...feiertage, ...festeSperrzeiten, ...geplant]
      setTermine(mitAllem)
      setVerfBlöcke(
        berechneVerfuegbarkeit(mitAllem, erlaubteTage, einstellungenVonArbeitgeber(einst)),
      )
    }

    // Stale-while-revalidate
    if (!force) {
      const staleEintraege = kalender.map((k) => ({
        k, roh: getStaleTermine(`${k.id}_${von}_${bis}`),
      }))
      if (staleEintraege.every(({ roh }) => roh !== null)) {
        verarbeiteRohdaten(staleEintraege.map(({ k, roh }) => ({ k, roh: roh! })))
        if (kalender.every((k) => getCachedTermine(`${k.id}_${von}_${bis}`) !== null)) {
          letzterRefreshRef.current = Date.now()
          return
        }
      }
    }

    const hatStaleDaten = !force && kalender.every(
      (k) => getStaleTermine(`${k.id}_${von}_${bis}`) !== null,
    )
    if (!hatStaleDaten) setLaden(true)

    try {
      // Bestätigte Shifts anderer Arbeitgeber im Datumsbereich (Cross-Employer-Blocking)
      let confirmedTermine: TerminMitStatus[] = []
      try {
        const confirmedShifts = await shiftsRepo.findByDatumsbereich(von, bis)
        confirmedTermine = confirmedShifts.map((s) => ({
          uid: `shift-${s.id}`,
          titel: "Schicht",
          beginn: new Date(`${s.datum}T${s.start}:00`),
          ende:   new Date(`${s.datum}T${s.ende}:00`),
          ganztaegig: false,
          status: "LOCKED" as const,
        }))
      } catch {
        setFehler("Schichten anderer Arbeitgeber konnten nicht geladen werden — Verfügbarkeit wird ohne diese Sperre berechnet.")
      }

      const ergebnisse = await Promise.all(
        kalender.map(async (k) => {
          const cacheKey = `${k.id}_${von}_${bis}`
          const url = `/api/ical?id=${k.id}&von=${von}&bis=${bis}${force ? "&refresh=true" : ""}`
          const data = await apiGet(url) as { termine: TerminRoh[] }
          setCachedTermine(cacheKey, data.termine)
          return { k, roh: data.termine }
        }),
      )

      const alleKalTermine: TerminMitStatus[] = []
      for (const { roh, k } of ergebnisse) {
        for (const t of roh) {
          alleKalTermine.push({
            uid: t.uid, titel: t.titel,
            beginn: new Date(t.beginn), ende: new Date(t.ende),
            ganztaegig: t.ganztaegig, ort: t.ort,
            status: resolveStatus(t.titel, k.defaultStatus),
          })
        }
      }

      const feiertage = feiertagsTermine(alleTage, bundesland)
      const festeSperrzeiten = festeSperrzeitenTermine(einst, alleTage)
      const geplant = geplanteTermine(geplanteSchichtenListe, alleTage)
      const mitAllem = [...alleKalTermine, ...feiertage, ...festeSperrzeiten, ...geplant, ...confirmedTermine]
      setTermine(mitAllem)
      setVerfBlöcke(
        berechneVerfuegbarkeit(mitAllem, erlaubteTage, einstellungenVonArbeitgeber(einst)),
      )
      letzterRefreshRef.current = Date.now()
      setZuletztAktualisiert(new Date())
    } catch (e) {
      setFehler(String(e))
    } finally {
      setLaden(false)
    }
  }, [kalender, startSonntagStr, anzahlWochen, bundesland, geplanteSchichtenListe, einst, selectedEmployerId])

  useEffect(() => { berechneFetchRef.current = berechneFetch })

  useEffect(() => { berechneFetch() }, [berechneFetch])

  // Tab-Fokus: automatisch neu laden (max. alle 60 Sekunden)
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== "visible") return
      if (Date.now() - letzterRefreshRef.current < 60_000) return
      berechneFetchRef.current()
    }
    document.addEventListener("visibilitychange", handleVisible)
    window.addEventListener("focus", handleVisible)
    return () => {
      document.removeEventListener("visibilitychange", handleVisible)
      window.removeEventListener("focus", handleVisible)
    }
  }, [])

  useEffect(() => {
    setAusgewaehlt(loadSavedSelection(startSonntagStr))
  }, [startSonntagStr])

  function toggleBlock(b: VerfuegbarkeitsBlock) {
    const key = blockKey(b)
    setAusgewaehlt((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveSelection(startSonntagStr, next)
      return next
    })
  }

  async function nachExport() {
    const ausgewaehlteBlöcke = verfBlöcke.filter((b) => ausgewaehlt.has(blockKey(b)))
    const wochen = wochenDaten(startSonntagStr, anzahlWochen)

    // KW-Nummern je nach kwSystem
    let kwNummern: number[] = []
    if (einst.kwSystem === "tkmaxx" && einst.kwAnker) {
      const { tkWoche } = await import("@/lib/verfuegbarkeit/kwBerechnung")
      kwNummern = wochen.map((w) => tkWoche(w[0], einst.kwAnker!))
    }

    await addDoc(collection(db, "users", uid(), "verfuegbarkeit_archiv"), {
      erstelltAm: serverTimestamp(),
      datumVon: wochen[0][0],
      datumBis: wochen[wochen.length - 1][6],
      kalenderwochen: kwNummern,
      gesamtMinuten: ausgewaehlteBlöcke.reduce((s, b) => s + b.dauerMin, 0),
      bloecke: ausgewaehlteBlöcke.map((b) => ({ datum: b.datum, start: b.start, ende: b.ende })),
      ...(selectedEmployerId ? { employerId: selectedEmployerId } : {}),
    })
    ladeArchiv()
  }

  // Abgeleitete Werte
  const ausgewaehlteBlöcke = verfBlöcke.filter((b) => ausgewaehlt.has(blockKey(b)))
  const gesamtMin = ausgewaehlteBlöcke.reduce((s, b) => s + b.dauerMin, 0)
  const wochen = wochenDaten(startSonntagStr, anzahlWochen)
  const mindestStdText = `${(einst.mindestdauerMin / 60).toFixed(0).replace(".0", "")} Std`

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

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-2xl px-4 pt-6">

        {/* ── Kopfzeile ─────────────────────────────────────────────────── */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold sf-text">Verfügbarkeit</h1>
            <div className="flex items-center gap-2">
              {zuletztAktualisiert && (
                <span className="text-xs sf-text-3 tabular-nums">
                  {zuletztAktualisiert.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button
                onClick={() => berechneFetch({ force: true })}
                disabled={laden}
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800 active:scale-90 transition-all disabled:opacity-40"
                aria-label="Kalender aktualisieren"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2 8a6 6 0 0 1 11.3-2.8"/>
                  <path d="M14 8a6 6 0 0 1-11.3 2.8"/>
                  <polyline points="13.5 2 13.5 5.2 10.3 5.2"/>
                  <polyline points="2.5 14 2.5 10.8 5.7 10.8"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">

            {/* Arbeitgeber-Auswahl */}
            {alleAktiveArbeitgeber.length > 1 && (
              <div>
                <label className="block text-xs sf-text-2 mb-1">Arbeitgeber</label>
                <select
                  value={selectedEmployerId}
                  onChange={(e) => setSelectedEmployerId(e.target.value)}
                  className="rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
                >
                  {alleAktiveArbeitgeber.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                onChange={() => {/* wird aus Arbeitgeber gelesen */}}
                disabled
                className="rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text opacity-60"
              >
                {BUNDESLAENDER.map((bl) => (
                  <option key={bl.value} value={bl.value}>{bl.label} ({bl.value})</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <p className="text-xs sf-text-3 -mt-2 mb-4">
          Hinweis: Google aktualisiert Kalender-Feeds teilweise erst nach einigen Stunden.
        </p>

        {fehler && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        {kalender.length === 0 && !laden && (
          <div className="sf-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm sf-text-2">Noch keine Kalender eingerichtet.</p>
            <p className="text-xs sf-text-3 mt-1">
              Kalender unter <a href="/profil" className="underline">Profil → Kalender</a> hinterlegen.
            </p>
          </div>
        )}

        {verfBlöcke.length > 0 && (
          <div className="sf-card rounded-2xl px-4 py-3 mb-4 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sf-text-2">Ausgewählt</p>
              <p className="text-lg font-semibold sf-text nums">{formatDauerMin(gesamtMin)}</p>
            </div>
            <div className="flex items-center gap-2">
              <PDFVerfuegbarkeitButton
                startSonntagStr={startSonntagStr}
                anzahlWochen={anzahlWochen}
                ausgewaehlt={ausgewaehlteBlöcke}
                bundesland={bundesland}
                employer={selectedEmployer}
                onNachExport={nachExport}
              />
              <EmailVerfuegbarkeitButton
                startSonntagStr={startSonntagStr}
                anzahlWochen={anzahlWochen}
                ausgewaehlt={ausgewaehlteBlöcke}
                bundesland={bundesland}
                employer={selectedEmployer}
                onNachExport={nachExport}
              />
            </div>
          </div>
        )}

        {laden ? (
          <WochenSkeleton anzahlWochen={anzahlWochen} />
        ) : (
          <div className="space-y-6 pb-4">
            {wochen.map((wocheDaten, wi) => (
              <section key={wocheDaten[0]}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold sf-text-2 uppercase tracking-wide">
                    Woche {wi + 1}
                  </span>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-neutral-800" />
                </div>

                <div className="space-y-2">
                  {wocheDaten.map((datum, tagIdx) => {
                    const wochentagNr = tagIdx % 7   // 0=So, 1=Mo…6=Sa
                    const istErlaubt = einst.wochentage.includes(wochentagNr)
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
                        <div className="flex items-baseline justify-between mb-2">
                          <h3 className={`text-sm font-medium ${feiertag ? "text-red-600 dark:text-red-400" : "sf-text"}`}>
                            {formatTagKopf(datum)}
                          </h3>
                          {feiertag && (
                            <span className="text-xs text-red-500 dark:text-red-400">{feiertag}</span>
                          )}
                        </div>

                        {(!istErlaubt || feiertag) ? (
                          <p className="text-xs sf-text-3">— nicht verfügbar</p>
                        ) : blöcke.length === 0 ? (
                          <>
                            <p className="text-xs sf-text-3">— keine freien Blöcke ≥ {mindestStdText}</p>
                            {termineHeute.length > 0 && <EreignisListe termine={termineHeute} />}
                          </>
                        ) : (
                          <>
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
                                      {formatDauerMin(b.dauerMin)}{aktiv ? " ✓" : ""}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            {termineHeute.length > 0 && <EreignisListe termine={termineHeute} />}
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

        {archivListe.length > 0 && (
          <section className="mt-8 mb-4">
            <h2 className="text-xs font-semibold sf-text-2 uppercase tracking-wide mb-3">
              Zuletzt exportiert
            </h2>
            <div className="space-y-2">
              {archivListe.slice(0, 5).map((e) => (
                <div key={e.id} className="sf-card rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium sf-text">
                      {e.kalenderwochen.length > 0 ? `KW ${e.kalenderwochen.join(" + ")}` : e.datumVon}
                    </p>
                    <p className="text-xs sf-text-3">
                      {e.erstelltAm.toLocaleDateString("de-DE")} · {formatDauerMin(e.gesamtMinuten)}
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

      {einrichtungsId && einrichtungsEmployer && (
        <EinrichtungsDialog
          employer={einrichtungsEmployer}
          onBestaetigt={() => {
            setEinrichtungsId(null)
            employersRepo.findAktive().then((emps) => setAlleAktiveArbeitgeber(emps)).catch(() => {})
          }}
          onSchliessen={() => setEinrichtungsId(null)}
        />
      )}
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

// ─── Termineiste ─────────────────────────────────────────────────────────────

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
                <span className={t.status === "LOCKED" ? "text-red-400" : "text-amber-400"}>●</span>
                {" "}{t.titel}
              </span>
            )}
          </p>
        ))}
    </div>
  )
}
