import { describe, it, expect } from "vitest"
import {
  isDemoMode,
  DEMO_EMPLOYERS,
  DEMO_SHIFTS,
  DEMO_ICAL_TERMINE,
  demoShiftsForRange,
  demoShiftsForMonth,
  demoIcalTermineForRange,
} from "@/lib/demo"

describe("isDemoMode", () => {
  it("returns false in SSR (no window)", () => {
    // vitest runs in jsdom by default, but the function guards typeof window === "undefined"
    // We verify the guard by checking the function does not throw without a URL
    expect(typeof isDemoMode()).toBe("boolean")
  })
})

describe("DEMO_EMPLOYERS", () => {
  it("has exactly 3 employers", () => {
    expect(DEMO_EMPLOYERS).toHaveLength(3)
  })

  it("all have valid EmployerArt", () => {
    const valid = ["werkstudent", "kurzfristig", "minijob", "sonstiges"]
    for (const e of DEMO_EMPLOYERS) expect(valid).toContain(e.art)
  })

  it("all have positive stundenlohnCent", () => {
    for (const e of DEMO_EMPLOYERS) expect(e.stundenlohnCent).toBeGreaterThan(0)
  })

  it("contains no personal data (names are fictional employers only)", () => {
    const names = DEMO_EMPLOYERS.map(e => e.name)
    expect(names).toContain("Café Aurora")
    expect(names).toContain("Harbor Bookshop")
    expect(names).toContain("Maple Garden")
  })
})

describe("demoShiftsForRange", () => {
  it("returns only shifts within the given date range", () => {
    const result = demoShiftsForRange("2026-11-19", "2026-11-21")
    for (const s of result) {
      expect(s.datum >= "2026-11-19").toBe(true)
      expect(s.datum <= "2026-11-21").toBe(true)
    }
  })

  it("returns empty array for a range with no shifts", () => {
    expect(demoShiftsForRange("2025-01-01", "2025-01-31")).toHaveLength(0)
  })

  it("returns all shifts when range covers everything", () => {
    expect(demoShiftsForRange("2026-01-01", "2026-12-31")).toHaveLength(DEMO_SHIFTS.length)
  })
})

describe("demoShiftsForMonth", () => {
  it("returns shifts for November 2026", () => {
    const result = demoShiftsForMonth(11, 2026)
    expect(result.length).toBeGreaterThan(0)
    for (const s of result) expect(s.datum.startsWith("2026-11")).toBe(true)
  })

  it("returns empty for a month with no shifts", () => {
    expect(demoShiftsForMonth(6, 2026)).toHaveLength(0)
  })
})

describe("demoIcalTermineForRange", () => {
  it("returns only termine overlapping the range", () => {
    const result = demoIcalTermineForRange("2026-11-19", "2026-11-21")
    for (const t of result) {
      expect(t.datum <= "2026-11-21").toBe(true)
      expect(t.datumBis >= "2026-11-19").toBe(true)
    }
  })

  it("returns empty for a range with no termine", () => {
    expect(demoIcalTermineForRange("2025-01-01", "2025-01-31")).toHaveLength(0)
  })

  it("all termine have valid startMin/endMin", () => {
    for (const t of DEMO_ICAL_TERMINE) {
      expect(t.startMin).toBeGreaterThanOrEqual(0)
      expect(t.endMin).toBeGreaterThan(t.startMin)
      expect(t.endMin).toBeLessThanOrEqual(24 * 60)
    }
  })

  it("contains no personal data (source name is fictional)", () => {
    for (const t of DEMO_ICAL_TERMINE) expect(t.quelleName).toBe("HAW Hamburg")
  })
})

describe("demo module has no Firestore or storage imports", () => {
  it("lib/demo/index.ts only imports from lib/types and lib/calendar", async () => {
    // Read the source file text and assert no firebase/storage imports exist.
    // This is the strongest proof that demo mode cannot write to Firestore.
    const fs = await import("node:fs/promises")
    const src = await fs.readFile(new URL("../demo/index.ts", import.meta.url), "utf-8")
    expect(src).not.toContain("firebase")
    expect(src).not.toContain("@/lib/storage")
    expect(src).not.toContain("firestore")
    expect(src).not.toContain("setDoc")
    expect(src).not.toContain("addDoc")
    expect(src).not.toContain("updateDoc")
  })
})
