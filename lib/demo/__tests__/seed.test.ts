import { describe, it, expect } from "vitest"
import { parseISO, getISOWeek, getISOWeekYear, eachDayOfInterval, format } from "date-fns"
import { schichtIntervall, nettoMinuten, bruttoMinuten, minutesSinceMidnight } from "@/lib/calc/time"
import { parseIcal } from "@/lib/verfuegbarkeit/icalParser"
import {
  SEED_VON, SEED_BIS, LEERE_WOCHE, FREIER_TAG, MINIJOB_GRENZE_CENT,
  pauseFuer, seedEmployers, seedShifts, seedIcs, UEBERSCHNEIDUNGS_TERMINE,
  shiftDoc, shiftId, nettoMinutenSeed,
} from "@/lib/demo/seed"

const shifts = seedShifts()
const employers = seedEmployers()
const ZEIT = /^([01]\d|2[0-3]):[0-5]\d$/

function isoWoche(datum: string): string {
  const d = parseISO(datum)
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`
}

describe("pauseFuer", () => {
  it("keine Pause bis einschließlich 6 h brutto", () => {
    expect(pauseFuer("16:00", "21:00")).toBeNull()
    expect(pauseFuer("10:00", "16:00")).toBeNull()
  })

  it("über 6 h: 30 Minuten, mittig", () => {
    expect(pauseFuer("10:00", "18:00")).toEqual({ pauseVon: "13:45", pauseBis: "14:15" })
    expect(pauseFuer("10:00", "17:00")).toEqual({ pauseVon: "13:15", pauseBis: "13:45" })
  })

  it("rundet auf 5 Minuten", () => {
    // 10:00–16:05 → exakte Mitte 13:02:30 → Pause 12:50–13:20
    expect(pauseFuer("10:00", "16:05")).toEqual({ pauseVon: "12:50", pauseBis: "13:20" })
  })
})

describe("seedShifts", () => {
  it("Pausenregel: > 6 h brutto → 30 min, mittig, 5-Minuten-Raster", () => {
    for (const s of shifts) {
      const iv = schichtIntervall(s)
      const brutto = bruttoMinuten(iv)
      if (brutto > 360) {
        expect(s.pauseVon, `${s.datum} ${s.start}`).toBeDefined()
        const von = minutesSinceMidnight(s.pauseVon!)
        const bis = minutesSinceMidnight(s.pauseBis!)
        expect(bis - von).toBe(30)
        expect(von % 5).toBe(0)
        const mitteSchicht = (minutesSinceMidnight(s.start) + minutesSinceMidnight(s.ende)) / 2
        expect(Math.abs((von + bis) / 2 - mitteSchicht)).toBeLessThanOrEqual(2.5)
      } else {
        expect(s.pauseVon, `${s.datum} ${s.start}`).toBeUndefined()
        expect(s.pauseBis).toBeUndefined()
      }
    }
  })

  it("keine Uhrzeit 24:xx, kein Mitternachtsübergang", () => {
    for (const s of shifts) {
      for (const t of [s.start, s.ende, s.pauseVon, s.pauseBis]) {
        if (t !== undefined) expect(t).toMatch(ZEIT)
      }
      expect(minutesSinceMidnight(s.ende)).toBeGreaterThan(minutesSinceMidnight(s.start))
    }
  })

  it("Monatsgrenzen: nur 1. Nov 2026 bis 28. Feb 2027, jeder Monat belegt", () => {
    for (const s of shifts) {
      expect(s.datum >= SEED_VON && s.datum <= SEED_BIS, s.datum).toBe(true)
    }
    const monate = new Set(shifts.map((s) => s.datum.slice(0, 7)))
    expect([...monate].sort()).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"])
    expect(shifts.some((s) => s.datum === SEED_VON)).toBe(true)
    expect(shifts.some((s) => s.datum === SEED_BIS)).toBe(true)
  })

  it("Wochenstunden (alle Arbeitgeber zusammen) unter 20 h", () => {
    const proWoche = new Map<string, number>()
    for (const s of shifts) {
      const kw = isoWoche(s.datum)
      proWoche.set(kw, (proWoche.get(kw) ?? 0) + nettoMinuten(schichtIntervall(s)))
    }
    for (const [kw, min] of proWoche) expect(min, kw).toBeLessThan(20 * 60)
  })

  it("2–4 Schichten pro Arbeitgeber in jeder vollen Woche (außer der leeren Dezemberwoche)", () => {
    const leer = isoWoche(LEERE_WOCHE.bis)
    const wochen = new Set(
      eachDayOfInterval({ start: parseISO(SEED_VON), end: parseISO(SEED_BIS) })
        .filter((d) => d.getDay() === 1 && format(d, "yyyy-MM-dd") <= "2027-02-22")
        .map((d) => isoWoche(format(d, "yyyy-MM-dd"))),
    )
    wochen.delete(leer)
    expect(wochen.size).toBe(16)
    for (const kw of wochen) {
      for (const e of employers) {
        const n = shifts.filter((s) => s.employerId === e.id && isoWoche(s.datum) === kw).length
        expect(n, `${kw} ${e.name}`).toBeGreaterThanOrEqual(2)
        expect(n, `${kw} ${e.name}`).toBeLessThanOrEqual(4)
      }
    }
  })

  it("leere Dezemberwoche und freier 15. Januar", () => {
    expect(shifts.filter((s) => s.datum >= LEERE_WOCHE.von && s.datum <= LEERE_WOCHE.bis)).toEqual([])
    expect(shifts.filter((s) => s.datum === FREIER_TAG)).toEqual([])
  })

  it("keine zwei Schichten überschneiden sich", () => {
    const sortiert = [...shifts].sort((a, b) => (a.datum + a.start).localeCompare(b.datum + b.start))
    for (let i = 1; i < sortiert.length; i++) {
      const a = sortiert[i - 1], b = sortiert[i]
      if (a.datum === b.datum) expect(b.start >= a.ende, `${b.datum} ${a.start}/${b.start}`).toBe(true)
    }
  })

  it("Minijob bleibt pro Monat unter der Verdienstgrenze", () => {
    const minijob = employers.find((e) => e.art === "minijob")!
    const proMonat = new Map<string, number>()
    for (const s of shifts.filter((s) => s.employerId === minijob.id)) {
      const m = s.datum.slice(0, 7)
      proMonat.set(m, (proMonat.get(m) ?? 0) + nettoMinuten(schichtIntervall(s)))
    }
    for (const [m, min] of proMonat) {
      expect((min / 60) * minijob.stundenlohnCent, m).toBeLessThanOrEqual(MINIJOB_GRENZE_CENT)
    }
  })
})

describe("Firestore-Dokumente", () => {
  it("optionale Schichtfelder als null, nie undefined", () => {
    for (const s of shifts) {
      expect(Object.values(shiftDoc(s))).not.toContain(undefined)
    }
    expect(shiftDoc(shifts.find((s) => !s.pauseVon)!).pauseVon).toBeNull()
  })

  it("IDs eindeutig, Netto-Minuten wie in lib/calc", () => {
    expect(new Set(shifts.map(shiftId)).size).toBe(shifts.length)
    for (const s of shifts) expect(nettoMinutenSeed(s)).toBe(nettoMinuten(schichtIntervall(s)))
  })
})

describe("seedEmployers", () => {
  it("drei vollständige Arbeitgeber in Hamburg ohne Personalnummer", () => {
    expect(employers.map((e) => e.name)).toEqual(["Northwind Bistro", "Brightside Books", "Harbor Outfitters"])
    for (const e of employers) {
      expect(e.bundesland).toBe("HH")
      expect(e.personalnummer).toBeUndefined()
      expect(e.verfuegbarkeit?.einrichtungBestaetigt).toBe(true)
      expect(e.verfuegbarkeit?.festeSperrzeiten).toHaveLength(2)
    }
  })
})

describe("seedIcs", () => {
  const ics = seedIcs()
  const termine = parseIcal(ics, new Date("2026-10-01T00:00:00Z"), new Date("2027-03-01T00:00:00Z"))

  it("CRLF-Zeilenenden, keine 24xx-Zeiten", () => {
    expect(ics.split("\r\n").length).toBeGreaterThan(50)
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/)
    expect(ics).not.toMatch(/T24\d{4}/)
  })

  it("fünf wöchentliche Vorlesungen von Oktober bis Februar", () => {
    for (const titel of ["Database Systems", "Algorithms", "Linear Algebra", "Software Engineering", "Ethics in Computing"]) {
      const serie = termine.filter((t) => t.titel === titel)
      expect(serie.length, titel).toBeGreaterThan(10)
      expect(serie.some((t) => t.beginn.getUTCMonth() === 9), titel).toBe(true)
      expect(serie.some((t) => t.beginn.getUTCFullYear() === 2027 && t.beginn.getUTCMonth() === 1), titel).toBe(true)
    }
    expect(ics.match(/RRULE:FREQ=WEEKLY/g)!.length).toBeGreaterThanOrEqual(5)
  })

  it("Tutorien, Labor, Prüfungstag, Lerngruppe und Study Gym", () => {
    expect(termine.filter((t) => t.titel.includes("Tutorial")).map((t) => t.titel)).toContain("Algorithms Tutorial")
    expect(new Set(termine.filter((t) => t.titel.includes("Tutorial")).map((t) => t.titel)).size).toBe(2)
    expect(termine.some((t) => t.titel === "Database Lab Session")).toBe(true)
    const pruefung = termine.filter((t) => t.titel === "Midterm Exam")
    expect(pruefung).toHaveLength(1)
    expect(pruefung[0].ganztaegig).toBe(true)
    expect(termine.filter((t) => t.titel === "Study Group").every((t) => t.beginn.getDay() === 4)).toBe(true)
    const gym = termine.filter((t) => t.titel === "Study Gym")
    expect(new Set(gym.map((t) => t.beginn.getDay()))).toEqual(new Set([1, 3, 5]))
  })

  it("zwei Termine überschneiden sich mit einer Schicht", () => {
    const ueber = UEBERSCHNEIDUNGS_TERMINE
    expect(ueber).toHaveLength(2)
    for (const u of ueber) {
      const s = shifts.find((s) => s.datum === u.datum && s.start < u.ende && u.start < s.ende)
      expect(s, u.titel).toBeDefined()
      expect(termine.some((t) => t.titel === u.titel)).toBe(true)
    }
  })
})
