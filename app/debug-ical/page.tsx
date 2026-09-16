"use client"

// DEBUG-SEITE — vor dem Launch entfernen
// Testet den iCal-Abruf und die Verfügbarkeitsberechnung mit echten Kalendern.

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase/client"
import {
  berechneVerfuegbarkeit,
  type TerminMitStatus,
  type VerfuegbarkeitsBlock,
  type VerfuegbarkeitsEinstellungen,
} from "@/lib/verfuegbarkeit/verfuegbarkeit"

// ─── Typen ───────────────────────────────────────────────────────────────────

interface KalenderInfo {
  id: string
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
}

interface TerminRoh {
  uid: string
  titel: string
  beginn: string
  ende: string
  ganztaegig: boolean
  ort?: string
}

// ─── Einstellungen für Debug ─────────────────────────────────────────────────

const DEBUG_EINSTELLUNGEN: VerfuegbarkeitsEinstellungen = {
  fensterStartMin: 360,   // 06:00
  fensterEndeMin: 1230,   // 20:30
  mindestdauerMin: 180,   // 3 Stunden
  puffer: [
    { suchtext: "Berliner Tor", pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Stiftstraße",  pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Steindamm",    pufferVorMin: 30, pufferNachMin: 30 },
  ],
  pufferFallbackMin: 30,
}

// Titel-Matching für LOCKED — Fallback wenn kein manueller Override vorhanden
const LOCKED_KEYWORDS = [
  "praktikum", "labor", "übung", "uebung",
  "klausur", "prüfung", "pruefung",
]

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const BERLIN = "Europe/Berlin"

function formatZeit(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: BERLIN, weekday: "short", day: "2-digit",
    month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    timeZone: BERLIN, weekday: "short", day: "2-digit",
    month: "2-digit", year: "numeric",
  })
}

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    timeZone: BERLIN, hour: "2-digit", minute: "2-digit",
  })
}

function formatTagLang(datum: string): string {
  return new Date(datum + "T12:00:00Z").toLocaleDateString("de-DE", {
    timeZone: BERLIN, weekday: "long", day: "2-digit", month: "2-digit",
  })
}

function formatDauerStunden(min: number): string {
  return (min / 60).toFixed(1).replace(".", ",") + " Std"
}

/** Gibt die 6 Daten Mo–Sa zurück, ausgehend vom gewählten Montag */
function monBisSam(montagStr: string): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(montagStr + "T12:00:00Z")
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function resolveStatus(
  termin: TerminRoh,
  defaultStatus: "LOCKED" | "FLEXIBLE",
): TerminMitStatus["status"] {
  const lower = termin.titel.toLowerCase()
  if (LOCKED_KEYWORDS.some((k) => lower.includes(k))) return "LOCKED"
  return defaultStatus
}

// ─── API-Helfer ───────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error("Nicht angemeldet")
  return token
}

async function apiGet(path: string): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${(body as Record<string, string>).fehler ?? res.statusText}`)
  }
  return res.json()
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${(b as Record<string, string>).fehler ?? res.statusText}`)
  }
  return res.json()
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function DebugIcal() {
  const [kalender, setKalender] = useState<KalenderInfo[]>([])
  const [termine, setTermine] = useState<TerminRoh[]>([])
  const [aktivId, setAktivId] = useState<string | null>(null)
  const [letzterAbruf, setLetzterAbruf] = useState<number | null>(null)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  // Formular
  const [neuerName, setNeuerName] = useState("")
  const [neueFarbe, setNeueFarbe] = useState("#3b82f6")
  const [neueUrl, setNeueUrl] = useState("")
  const [neuerDefaultStatus, setNeuerDefaultStatus] = useState<"LOCKED" | "FLEXIBLE">("FLEXIBLE")
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false)

  // Verfügbarkeitsberechnung
  const [vonMontag, setVonMontag] = useState("2026-10-19")
  const [verfuegbarkeit, setVerfuegbarkeit] = useState<VerfuegbarkeitsBlock[]>([])
  const [verfLaden, setVerfLaden] = useState(false)
  const [verfTermine, setVerfTermine] = useState<TerminMitStatus[]>([])

  useEffect(() => { ladeListe() }, [])

  async function ladeListe() {
    try {
      const data = await apiGet("/api/ical") as { kalender: KalenderInfo[] }
      setKalender(data.kalender)
    } catch (e) { setFehler(String(e)) }
  }

  async function ladeTermine(id: string, refresh = false) {
    setFehler("")
    setLaden(true)
    setAktivId(id)
    try {
      const url = `/api/ical?id=${id}${refresh ? "&refresh=true" : ""}`
      const data = await apiGet(url) as { termine: TerminRoh[]; letzterAbruf: number }
      setTermine(data.termine)
      setLetzterAbruf(data.letzterAbruf)
    } catch (e) { setFehler(String(e)) }
    finally { setLaden(false) }
  }

  async function kalenderSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler("")
    setSpeichernLaeuft(true)
    try {
      const result = await apiPost("/api/ical", {
        name: neuerName, farbe: neueFarbe,
        url: neueUrl, defaultStatus: neuerDefaultStatus,
      }) as KalenderInfo
      setKalender((prev) => [...prev, result])
      setNeuerName("")
      setNeueUrl("")
    } catch (err) { setFehler(String(err)) }
    finally { setSpeichernLaeuft(false) }
  }

  async function berechneWoche() {
    if (kalender.length === 0) { setFehler("Keine Kalender gespeichert."); return }
    setFehler("")
    setVerfLaden(true)
    setVerfuegbarkeit([])
    setVerfTermine([])
    try {
      const tage = monBisSam(vonMontag)
      const von = tage[0]
      const bis = tage[tage.length - 1]

      // Alle Kalender parallel abrufen
      const alleTermine: TerminMitStatus[] = []
      await Promise.all(
        kalender.map(async (k) => {
          const data = await apiGet(
            `/api/ical?id=${k.id}&von=${von}&bis=${bis}`,
          ) as { termine: TerminRoh[] }
          for (const t of data.termine) {
            alleTermine.push({
              uid: t.uid,
              titel: t.titel,
              beginn: new Date(t.beginn),
              ende: new Date(t.ende),
              ganztaegig: t.ganztaegig,
              ort: t.ort,
              status: resolveStatus(t, k.defaultStatus),
            })
          }
        }),
      )

      setVerfTermine(alleTermine)
      setVerfuegbarkeit(berechneVerfuegbarkeit(alleTermine, tage, DEBUG_EINSTELLUNGEN))
    } catch (e) { setFehler(String(e)) }
    finally { setVerfLaden(false) }
  }

  // Verfügbarkeit nach Tag gruppieren
  const verfNachTag = verfuegbarkeit.reduce<Record<string, VerfuegbarkeitsBlock[]>>(
    (acc, b) => { (acc[b.datum] ??= []).push(b); return acc },
    {},
  )
  const gesamtMin = verfuegbarkeit.reduce((s, b) => s + b.dauerMin, 0)

  return (
    <div className="min-h-screen sf-page px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            DEBUG-SEITE — vor dem Launch entfernen (/app/debug-ical/page.tsx)
          </p>
        </div>

        {/* ── Kalender hinzufügen ───────────────────────────────────────── */}
        <section className="sf-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold sf-text mb-4">Neuen Kalender hinzufügen</h2>
          <form onSubmit={kalenderSpeichern} className="space-y-3">
            <div className="flex gap-2">
              <input
                value={neuerName} onChange={(e) => setNeuerName(e.target.value)}
                placeholder="Name (z.B. Uni HAW)" required
                className="flex-1 rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
              />
              <input
                type="color" value={neueFarbe} onChange={(e) => setNeueFarbe(e.target.value)}
                className="w-10 h-10 rounded-lg border border-stone-200 dark:border-neutral-700 cursor-pointer"
              />
            </div>
            <input
              value={neueUrl} onChange={(e) => setNeueUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/…" required
              className="w-full rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text font-mono"
            />
            <div className="flex gap-3 items-center flex-wrap">
              <span className="text-xs sf-text-2">Standard-Status:</span>
              {(["FLEXIBLE", "LOCKED"] as const).map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="defaultStatus" value={s}
                    checked={neuerDefaultStatus === s}
                    onChange={() => setNeuerDefaultStatus(s)} />
                  <span className={`text-xs font-medium ${s === "LOCKED" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
            <button type="submit" disabled={speichernLaeuft}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {speichernLaeuft ? "Speichern…" : "Speichern"}
            </button>
          </form>
        </section>

        {/* ── Gespeicherte Kalender ─────────────────────────────────────── */}
        {kalender.length > 0 && (
          <section className="sf-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold sf-text mb-4">Gespeicherte Kalender</h2>
            <div className="space-y-2">
              {kalender.map((k) => (
                <div key={k.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-stone-100 dark:border-neutral-800 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: k.farbe }} />
                    <span className="text-sm sf-text truncate">{k.name}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${k.defaultStatus === "LOCKED" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"}`}>
                      {k.defaultStatus}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => ladeTermine(k.id)} disabled={laden && aktivId === k.id}
                      className="text-xs rounded-md bg-stone-100 dark:bg-neutral-800 px-3 py-1.5 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700 disabled:opacity-50">
                      {laden && aktivId === k.id ? "Laden…" : "Laden"}
                    </button>
                    <button onClick={() => ladeTermine(k.id, true)} disabled={laden && aktivId === k.id}
                      className="text-xs rounded-md bg-stone-100 dark:bg-neutral-800 px-3 py-1.5 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700 disabled:opacity-50"
                      title="Cache ignorieren">
                      Neu laden
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Verfügbarkeitsberechnung ──────────────────────────────────── */}
        <section className="sf-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold sf-text mb-4">Verfügbarkeitsberechnung</h2>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs sf-text-2 mb-1">Woche ab Montag</label>
              <input
                type="date" value={vonMontag} onChange={(e) => setVonMontag(e.target.value)}
                className="rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text"
              />
            </div>
            <button
              onClick={berechneWoche} disabled={verfLaden || kalender.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {verfLaden ? "Berechne…" : "Berechnen"}
            </button>
          </div>

          {verfuegbarkeit.length > 0 && (
            <div className="mt-6 space-y-1">
              {/* Einstellungen-Hinweis */}
              <p className="text-xs sf-text-3 mb-3">
                Fenster 06:00–20:30 · Puffer 30 Min · Mindestdauer 3 Std · {verfTermine.length} Termine geladen
              </p>

              {/* Ergebnis je Tag */}
              {monBisSam(vonMontag).map((datum) => {
                const bloecke = verfNachTag[datum] ?? []
                const tagesMin = bloecke.reduce((s, b) => s + b.dauerMin, 0)
                return (
                  <div key={datum} className="py-2 border-b border-stone-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-semibold sf-text">{formatTagLang(datum)}</span>
                      {tagesMin > 0 && (
                        <span className="text-xs sf-text-2">{formatDauerStunden(tagesMin)}</span>
                      )}
                    </div>
                    {bloecke.length === 0 ? (
                      <p className="text-xs sf-text-3 pl-2">—  nicht verfügbar</p>
                    ) : (
                      <ul className="space-y-0.5 pl-2">
                        {bloecke.map((b, i) => (
                          <li key={i} className="text-xs font-mono sf-text-2">
                            {b.start}–{b.ende}
                            <span className="ml-2 sf-text-3">({formatDauerStunden(b.dauerMin)})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}

              {/* Wochensumme */}
              <div className="pt-3 flex justify-between items-baseline">
                <span className="text-xs font-semibold sf-text">Wochensumme</span>
                <span className="text-sm font-semibold sf-text">{formatDauerStunden(gesamtMin)}</span>
              </div>

              {/* Termine dieser Woche mit Status (zur Überprüfung) */}
              <details className="mt-4">
                <summary className="text-xs sf-text-3 cursor-pointer select-none">
                  {verfTermine.length} Termine dieser Woche (Status-Überprüfung)
                </summary>
                <div className="mt-2 space-y-0.5">
                  {[...verfTermine]
                    .sort((a, b) => a.beginn.getTime() - b.beginn.getTime())
                    .map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                        <span className={`w-14 flex-shrink-0 font-medium ${
                          t.status === "LOCKED" ? "text-red-500" :
                          t.status === "RELEASED" ? "text-emerald-500" : "text-amber-500"
                        }`}>{t.status}</span>
                        <span className="sf-text-3 whitespace-nowrap font-mono">
                          {formatUhrzeit(t.beginn.toISOString())}–{formatUhrzeit(t.ende.toISOString())}
                        </span>
                        <span className="sf-text truncate">{t.titel}</span>
                        {t.ort && <span className="sf-text-3 truncate hidden sm:block">{t.ort}</span>}
                      </div>
                    ))}
                </div>
              </details>
            </div>
          )}

          {verfuegbarkeit.length === 0 && !verfLaden && verfTermine.length > 0 && (
            <p className="mt-4 text-xs sf-text-3">
              Keine freien Blöcke ≥ 3 Stunden in dieser Woche.
            </p>
          )}
        </section>

        {/* ── Fehler ────────────────────────────────────────────────────── */}
        {fehler && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        {/* ── Rohe Termine (letzter Kalender-Abruf) ────────────────────── */}
        {termine.length > 0 && (
          <section className="sf-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold sf-text">{termine.length} Termine (letzter Abruf)</h2>
              {letzterAbruf && (
                <span className="text-xs sf-text-3">
                  {new Date(letzterAbruf).toLocaleTimeString("de-DE")}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-stone-100 dark:border-neutral-800">
                    <th className="pb-2 pr-3 sf-text-2 font-medium whitespace-nowrap">Datum</th>
                    <th className="pb-2 pr-3 sf-text-2 font-medium whitespace-nowrap">Beginn</th>
                    <th className="pb-2 pr-3 sf-text-2 font-medium whitespace-nowrap">Ende</th>
                    <th className="pb-2 pr-3 sf-text-2 font-medium">Titel</th>
                    <th className="pb-2 pr-3 sf-text-2 font-medium">Ort</th>
                    <th className="pb-2 sf-text-2 font-medium">Ganztag</th>
                  </tr>
                </thead>
                <tbody>
                  {termine.map((t, i) => (
                    <tr key={`${t.uid}-${t.beginn}-${i}`}
                      className="border-b border-stone-50 dark:border-neutral-900 hover:bg-stone-50 dark:hover:bg-neutral-900/50">
                      <td className="py-1.5 pr-3 sf-text whitespace-nowrap">
                        {t.ganztaegig ? formatDatum(t.beginn) : formatZeit(t.beginn).split(",").slice(0, 2).join(",")}
                      </td>
                      <td className="py-1.5 pr-3 sf-text-2 whitespace-nowrap font-mono">
                        {t.ganztaegig ? "—" : formatUhrzeit(t.beginn)}
                      </td>
                      <td className="py-1.5 pr-3 sf-text-2 whitespace-nowrap font-mono">
                        {t.ganztaegig ? "—" : formatUhrzeit(t.ende)}
                      </td>
                      <td className="py-1.5 pr-3 sf-text max-w-[200px] truncate" title={t.titel}>{t.titel}</td>
                      <td className="py-1.5 pr-3 sf-text-3 max-w-[120px] truncate" title={t.ort}>{t.ort ?? "—"}</td>
                      <td className="py-1.5 sf-text-2">{t.ganztaegig ? "✓" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
