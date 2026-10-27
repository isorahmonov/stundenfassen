import { describe, expect, it } from "vitest"
import { sichtbareMinusEintraege } from "@/lib/pdf/minus"
import type { Employer, MinusEintrag } from "@/lib/types"

const EMPLOYER: Employer = {
  id: "e1",
  name: "Testarbeitgeber",
  farbe: "#2563eb",
  stundenlohnCent: 1300,
  art: "minijob",
  bundesland: "HH",
  zuschlagSonntagProzent: 0,
  zuschlagFeiertagProzent: 0,
  zuschlagNachtProzent: 0,
}

const MINUS: MinusEintrag[] = [{ id: "m1", datum: "2026-10-01", minuten: 120 }]

describe("sichtbareMinusEintraege — Schalter minusImPDFAnzeigen", () => {
  it("Schalter aus (minusImPDFAnzeigen: false) → keine Minusstunden in den PDF-Daten", () => {
    const result = sichtbareMinusEintraege({ ...EMPLOYER, minusImPDFAnzeigen: false }, MINUS)
    expect(result).toEqual([])
  })

  it("Schalter an (minusImPDFAnzeigen: true) → Minusstunden sind enthalten", () => {
    const result = sichtbareMinusEintraege({ ...EMPLOYER, minusImPDFAnzeigen: true }, MINUS)
    expect(result).toEqual(MINUS)
  })

  it("Schalter nicht gesetzt (undefined) → Default ist anzeigen", () => {
    const result = sichtbareMinusEintraege(EMPLOYER, MINUS)
    expect(result).toEqual(MINUS)
  })

  it("kein Arbeitgeber (null) → Default ist anzeigen", () => {
    const result = sichtbareMinusEintraege(null, MINUS)
    expect(result).toEqual(MINUS)
  })
})
