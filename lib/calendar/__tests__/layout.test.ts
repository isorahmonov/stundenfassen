import { describe, expect, it } from "vitest"
import { nowLinePercent, ueberlappungsSpalten, wochenstundenMinuten } from "../layout"
import type { Shift } from "@/lib/types"

function makeShift(datum: string, start: string, ende: string): Shift {
  return { id: "t", employerId: "e", datum, start, ende }
}

describe("ueberlappungsSpalten", () => {
  it("gives overlapping pair spaltenanzahl=2 and isolated event spaltenanzahl=1", () => {
    // A and B overlap; C is later and isolated
    const events = [
      { startMin: 60, endMin: 120 },  // A
      { startMin: 90, endMin: 150 },  // B overlaps A
      { startMin: 200, endMin: 240 }, // C isolated
    ]
    const result = ueberlappungsSpalten(events)
    expect(result[0].spaltenanzahl).toBe(2)
    expect(result[1].spaltenanzahl).toBe(2)
    expect(result[2].spaltenanzahl).toBe(1)
    expect(result[2].spalte).toBe(0)
  })

  it("assigns distinct lanes within a cluster", () => {
    const events = [
      { startMin: 0, endMin: 60 },
      { startMin: 30, endMin: 90 },
    ]
    const [a, b] = ueberlappungsSpalten(events)
    expect(a.spalte).not.toBe(b.spalte)
  })

  it("reuses a lane after it ends", () => {
    const events = [
      { startMin: 0, endMin: 60 },   // lane 0
      { startMin: 0, endMin: 60 },   // lane 1 (overlaps)
      { startMin: 60, endMin: 120 }, // lane 0 reused (sequential, new cluster)
    ]
    const result = ueberlappungsSpalten(events)
    // first two overlap → cluster with spaltenanzahl=2; third is separate → spaltenanzahl=1
    expect(result[0].spaltenanzahl).toBe(2)
    expect(result[1].spaltenanzahl).toBe(2)
    expect(result[2].spaltenanzahl).toBe(1)
  })

  it("handles empty input", () => {
    expect(ueberlappungsSpalten([])).toEqual([])
  })

  it("handles single event", () => {
    const [r] = ueberlappungsSpalten([{ startMin: 0, endMin: 60 }])
    expect(r).toEqual({ spalte: 0, spaltenanzahl: 1 })
  })
})

describe("nowLinePercent", () => {
  it("returns null when now is before view", () => {
    expect(nowLinePercent(480, 1200, 400)).toBeNull()
  })

  it("returns null when now is after view", () => {
    expect(nowLinePercent(480, 1200, 1300)).toBeNull()
  })

  it("returns 0 at view start", () => {
    expect(nowLinePercent(480, 1200, 480)).toBe(0)
  })

  it("returns 100 at view end", () => {
    expect(nowLinePercent(480, 1200, 1200)).toBe(100)
  })

  it("returns 50 at midpoint", () => {
    expect(nowLinePercent(0, 1440, 720)).toBe(50)
  })
})

describe("wochenstundenMinuten", () => {
  it("sums netto-minutes for shifts in the given ISO week", () => {
    // 2026-01-05 is a Monday (ISO week 2026-W02)
    const shifts: Shift[] = [
      makeShift("2026-01-05", "09:00", "17:00"), // 480 min
      makeShift("2026-01-06", "09:00", "12:00"), // 180 min
      makeShift("2026-01-12", "10:00", "14:00"), // next week – excluded
    ]
    expect(wochenstundenMinuten(shifts, "2026-01-05")).toBe(660)
  })

  it("returns 0 when no shifts in the week", () => {
    const shifts: Shift[] = [makeShift("2026-01-12", "10:00", "14:00")]
    expect(wochenstundenMinuten(shifts, "2026-01-05")).toBe(0)
  })

  it("excludes pause from minutes", () => {
    const shift: Shift = {
      id: "p",
      employerId: "e",
      datum: "2026-01-05",
      start: "09:00",
      pauseVon: "12:00",
      pauseBis: "12:30",
      ende: "17:00",
    }
    // 480 brutto - 30 pause = 450 netto
    expect(wochenstundenMinuten([shift], "2026-01-05")).toBe(450)
  })
})
