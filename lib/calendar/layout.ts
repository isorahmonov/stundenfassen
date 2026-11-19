import { getISOWeek, getISOWeekYear, parseISO } from "date-fns"
import { nettoMinuten, schichtIntervall } from "@/lib/calc/time"
import type { Shift } from "@/lib/types"

export type KalenderEvent = { startMin: number; endMin: number }
export type LaneResult = { spalte: number; spaltenanzahl: number }

export function ueberlappungsSpalten(events: KalenderEvent[]): LaneResult[] {
  if (events.length === 0) return []

  const indexed = events.map((e, i) => ({ ...e, origIdx: i }))
  const sorted = [...indexed].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const result: LaneResult[] = new Array(events.length)

  let clusterStart = 0
  while (clusterStart < sorted.length) {
    let clusterMaxEnd = sorted[clusterStart].endMin
    let clusterEnd = clusterStart + 1
    while (clusterEnd < sorted.length && sorted[clusterEnd].startMin < clusterMaxEnd) {
      clusterMaxEnd = Math.max(clusterMaxEnd, sorted[clusterEnd].endMin)
      clusterEnd++
    }

    const laneEnds: number[] = []
    for (let i = clusterStart; i < clusterEnd; i++) {
      const ev = sorted[i]
      let lane = laneEnds.findIndex((end) => end <= ev.startMin)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(ev.endMin)
      } else {
        laneEnds[lane] = ev.endMin
      }
      result[ev.origIdx] = { spalte: lane, spaltenanzahl: 0 }
    }

    const spaltenanzahl = laneEnds.length
    for (let i = clusterStart; i < clusterEnd; i++) {
      result[sorted[i].origIdx].spaltenanzahl = spaltenanzahl
    }

    clusterStart = clusterEnd
  }

  return result
}

export function nowLinePercent(
  viewStartMin: number,
  viewEndMin: number,
  nowMin: number,
): number | null {
  if (nowMin < viewStartMin || nowMin > viewEndMin) return null
  return ((nowMin - viewStartMin) / (viewEndMin - viewStartMin)) * 100
}

export function wochenstundenMinuten(shifts: Shift[], wochenStartDatum: string): number {
  const start = parseISO(wochenStartDatum)
  const zielKW = `${getISOWeekYear(start)}-W${String(getISOWeek(start)).padStart(2, "0")}`

  let total = 0
  for (const shift of shifts) {
    const d = parseISO(shift.datum)
    const kw = `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`
    if (kw === zielKW) {
      total += nettoMinuten(schichtIntervall(shift))
    }
  }
  return total
}
