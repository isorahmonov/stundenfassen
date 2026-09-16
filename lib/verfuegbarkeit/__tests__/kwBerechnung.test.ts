import { describe, expect, it } from "vitest"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"

const ANKER = "2026-02-01"

describe("tkWoche — Pflichtfälle aus der Spezifikation", () => {
  it("gibt KW 34 für Sonntag 2026-09-20 (Wochenbeginn) zurück", () => {
    expect(tkWoche("2026-09-20", ANKER)).toBe(34)
  })

  it("gibt KW 34 für Samstag 2026-09-26 (Wochenende) zurück", () => {
    expect(tkWoche("2026-09-26", ANKER)).toBe(34)
  })

  it("gibt KW 35 für Sonntag 2026-09-27 (erster Tag der Folgewoche) zurück", () => {
    expect(tkWoche("2026-09-27", ANKER)).toBe(35)
  })
})

describe("tkWoche — Grenzfälle", () => {
  it("gibt KW 1 für den Ankertag selbst zurück", () => {
    expect(tkWoche("2026-02-01", ANKER)).toBe(1)
  })

  it("gibt KW 1 für Samstag 2026-02-07 (letzter Tag von KW 1) zurück", () => {
    expect(tkWoche("2026-02-07", ANKER)).toBe(1)
  })

  it("gibt KW 2 für Sonntag 2026-02-08 (Beginn KW 2) zurück", () => {
    expect(tkWoche("2026-02-08", ANKER)).toBe(2)
  })

  it("ist robust bei einem anderen Anker (verschobenes Geschäftsjahr)", () => {
    // Anker eine Woche später → dieselbe Woche hat KW 33 statt 34
    expect(tkWoche("2026-09-20", "2026-02-08")).toBe(33)
  })
})
