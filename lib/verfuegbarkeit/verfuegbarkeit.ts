import type { KalenderTermin } from "./icalParser"

export type TerminStatus = "LOCKED" | "FLEXIBLE" | "RELEASED"

export interface TerminMitStatus extends KalenderTermin {
  status: TerminStatus
}

export interface PufferEinstellung {
  /** Substring im LOCATION-Feld (case-insensitive), z.B. "Berliner Tor" */
  suchtext: string
  pufferVorMin: number
  pufferNachMin: number
}

export interface VerfuegbarkeitsEinstellungen {
  /** Minuten seit Mitternacht, z.B. 360 für 06:00 */
  fensterStartMin: number
  /** Minuten seit Mitternacht, z.B. 1230 für 20:30 */
  fensterEndeMin: number
  mindestdauerMin: number
  puffer: PufferEinstellung[]
  /** Puffer wenn kein Standort erkannt wird */
  pufferFallbackMin: number
}

export interface VerfuegbarkeitsBlock {
  datum: string    // "YYYY-MM-DD"
  start: string    // "HH:mm" (auf halbe Stunde gerundet)
  ende: string     // "HH:mm"
  dauerMin: number
}

// ─── Zeitzone-Hilfsfunktionen ────────────────────────────────────────────────

const BERLIN = "Europe/Berlin"

/** ISO-Datum "YYYY-MM-DD" in Europe/Berlin für ein UTC-Date */
function berlinDatum(date: Date): string {
  return date.toLocaleDateString("sv", { timeZone: BERLIN })
}

/** Minuten seit Mitternacht (0–1439) in Europe/Berlin für ein UTC-Date */
function berlinMin(date: Date): number {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const h = parseInt(teile.find((t) => t.type === "hour")!.value, 10)
  const m = parseInt(teile.find((t) => t.type === "minute")!.value, 10)
  return h * 60 + m
}

/** Minuten → "HH:mm" */
function minZuUhrzeit(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

// ─── Runden ──────────────────────────────────────────────────────────────────

/** Start: auf nächste halbe Stunde aufrunden (:00 oder :30) */
export function rundeAuf(min: number): number {
  return Math.ceil(min / 30) * 30
}

/** Ende: auf vorherige halbe Stunde abrunden (:00 oder :30) */
export function rundeAb(min: number): number {
  return Math.floor(min / 30) * 30
}

// ─── Puffer-Erkennung ────────────────────────────────────────────────────────

function ermittlePuffer(
  ort: string | undefined,
  einstellungen: VerfuegbarkeitsEinstellungen,
): { vor: number; nach: number } {
  if (ort) {
    const lower = ort.toLowerCase()
    for (const p of einstellungen.puffer) {
      if (lower.includes(p.suchtext.toLowerCase())) {
        return { vor: p.pufferVorMin, nach: p.pufferNachMin }
      }
    }
  }
  return { vor: einstellungen.pufferFallbackMin, nach: einstellungen.pufferFallbackMin }
}

// ─── Intervall-Logik ─────────────────────────────────────────────────────────

type Intervall = [number, number]

function mergeIntervalle(intervalle: Intervall[]): Intervall[] {
  if (intervalle.length === 0) return []
  const sorted = [...intervalle].sort((a, b) => a[0] - b[0])
  const result: Intervall[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1]
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      result.push(sorted[i])
    }
  }
  return result
}

// ─── Kernberechnung ──────────────────────────────────────────────────────────

function berechneBlocksFuerTag(
  datum: string,
  termine: TerminMitStatus[],
  einstellungen: VerfuegbarkeitsEinstellungen,
): VerfuegbarkeitsBlock[] {
  const { fensterStartMin, fensterEndeMin, mindestdauerMin } = einstellungen
  const blockiert: Intervall[] = []

  for (const termin of termine) {
    if (termin.status === "RELEASED") continue

    if (termin.ganztaegig) {
      // iCal: DTEND bei ganztägigen Terminen ist exklusiv (Tag danach)
      const beginDatum = berlinDatum(termin.beginn)
      const endDatum = berlinDatum(termin.ende)
      if (datum >= beginDatum && datum < endDatum) {
        blockiert.push([fensterStartMin, fensterEndeMin])
      }
      continue
    }

    if (berlinDatum(termin.beginn) !== datum) continue

    const vonMin = berlinMin(termin.beginn)
    let bisMin = berlinMin(termin.ende)
    if (bisMin < vonMin) bisMin = 1440  // Mitternachtsübergang

    const puffer = ermittlePuffer(termin.ort, einstellungen)
    const gepufferteVon = Math.max(0, vonMin - puffer.vor)
    const gepufferteBis = Math.min(1440, bisMin + puffer.nach)

    const clippedVon = Math.max(fensterStartMin, gepufferteVon)
    const clippedBis = Math.min(fensterEndeMin, gepufferteBis)

    if (clippedVon < clippedBis) blockiert.push([clippedVon, clippedBis])
  }

  // Lücken berechnen
  const gemergt = mergeIntervalle(blockiert)
  const luecken: Intervall[] = []
  let cursor = fensterStartMin
  for (const [von, bis] of gemergt) {
    if (von > cursor) luecken.push([cursor, von])
    cursor = Math.max(cursor, bis)
  }
  if (cursor < fensterEndeMin) luecken.push([cursor, fensterEndeMin])

  // Mindestdauer (vor Runden), runden, Mindestdauer nochmals prüfen
  const bloecke: VerfuegbarkeitsBlock[] = []
  for (const [von, bis] of luecken) {
    if (bis - von < mindestdauerMin) continue

    const start = rundeAuf(von)
    const ende = rundeAb(bis)
    const dauer = ende - start

    if (dauer >= mindestdauerMin) {
      bloecke.push({ datum, start: minZuUhrzeit(start), ende: minZuUhrzeit(ende), dauerMin: dauer })
    }
  }

  return bloecke
}

/**
 * Berechnet die freien Zeitblöcke für eine Liste von Tagen (typischerweise Mo–Sa).
 * RELEASED-Termine blockieren nichts; LOCKED und FLEXIBLE blockieren.
 */
export function berechneVerfuegbarkeit(
  termine: TerminMitStatus[],
  tage: string[],
  einstellungen: VerfuegbarkeitsEinstellungen,
): VerfuegbarkeitsBlock[] {
  return tage.flatMap((tag) => berechneBlocksFuerTag(tag, termine, einstellungen))
}
