import { describe, it, expect } from "vitest"
import { rohZuAnzeigeTermine, type KalenderQuelle } from "@/lib/calendar/icalLaden"
import type { TerminRoh } from "@/lib/verfuegbarkeit/eventCache"

const Q: KalenderQuelle = { id: "q1", name: "Uni", farbe: "#3b82f6", defaultStatus: "LOCKED" }

function mk(overrides: Partial<TerminRoh> & Pick<TerminRoh, "beginn" | "ende">): TerminRoh {
  return { uid: "u1", titel: "Test", ganztaegig: false, ...overrides }
}

describe("rohZuAnzeigeTermine", () => {
  it("zeitgebunden: correct Berlin date and minutes (CET = UTC+1)", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      beginn: "2026-11-19T07:00:00.000Z",  // 08:00 CET
      ende:   "2026-11-19T09:00:00.000Z",  // 10:00 CET
    })], Q)
    expect(r.datum).toBe("2026-11-19")
    expect(r.datumBis).toBe("2026-11-19")
    expect(r.startMin).toBe(8 * 60)
    expect(r.endMin).toBe(10 * 60)
    expect(r.ganztaegig).toBe(false)
  })

  it("midnight-crossing: endMin exceeds 1440", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      beginn: "2026-11-19T21:00:00.000Z",  // 22:00 CET
      ende:   "2026-11-20T05:00:00.000Z",  // 06:00 CET next day
    })], Q)
    expect(r.datum).toBe("2026-11-19")
    expect(r.startMin).toBe(22 * 60)
    expect(r.endMin).toBe(30 * 60)  // 22*60 + 8*60
  })

  it("ganztägig single-day: datum === datumBis", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      beginn: "2026-12-25T00:00:00.000Z",  // DATE stored as UTC midnight
      ende:   "2026-12-26T00:00:00.000Z",  // iCal exclusive end → single day
      ganztaegig: true,
    })], Q)
    expect(r.ganztaegig).toBe(true)
    expect(r.datum).toBe("2026-12-25")
    expect(r.datumBis).toBe("2026-12-25")
    expect(r.startMin).toBe(0)
    expect(r.endMin).toBe(0)
  })

  it("ganztägig multi-day: datumBis is last inclusive day", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      beginn: "2026-12-26T00:00:00.000Z",
      ende:   "2026-12-29T00:00:00.000Z",  // exclusive → last day is Dec 28
      ganztaegig: true,
    })], Q)
    expect(r.datum).toBe("2026-12-26")
    expect(r.datumBis).toBe("2026-12-28")
  })

  it("uid is namespaced with quelleId to avoid collisions across calendars", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      uid: "event-abc",
      beginn: "2026-11-19T08:00:00.000Z",
      ende:   "2026-11-19T09:00:00.000Z",
    })], Q)
    expect(r.uid).toBe("q1::event-abc")
  })

  it("quelle metadata is attached to each termin", () => {
    const [r] = rohZuAnzeigeTermine([mk({
      beginn: "2026-11-19T08:00:00.000Z",
      ende:   "2026-11-19T09:00:00.000Z",
    })], Q)
    expect(r.quelleId).toBe("q1")
    expect(r.quelleName).toBe("Uni")
    expect(r.quelleFarbe).toBe("#3b82f6")
  })

  it("empty input returns empty array", () => {
    expect(rohZuAnzeigeTermine([], Q)).toHaveLength(0)
  })

  it("merges and sorts: multiple termine sorted by returned order (not by function)", () => {
    // rohZuAnzeigeTermine preserves input order; caller sorts if needed
    const roh = [
      mk({ uid: "a", beginn: "2026-11-19T10:00:00.000Z", ende: "2026-11-19T11:00:00.000Z" }),
      mk({ uid: "b", beginn: "2026-11-19T08:00:00.000Z", ende: "2026-11-19T09:00:00.000Z" }),
    ]
    const result = rohZuAnzeigeTermine(roh, Q)
    expect(result).toHaveLength(2)
    expect(result[0].uid).toBe("q1::a")
    expect(result[1].uid).toBe("q1::b")
  })
})
