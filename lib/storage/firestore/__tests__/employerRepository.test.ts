import { describe, expect, it } from "vitest"
import { buildUpdateRow } from "@/lib/storage/firestore/employerUpdateRow"
import type { EmployerUpdate } from "@/lib/storage"

// Vollständiger EmployerUpdate mit allen Feldern aus Employer (außer id)
const ALLE_FELDER: EmployerUpdate = {
  name: "Test GmbH",
  farbe: "#ff0000",
  art: "minijob",
  bundesland: "BY",
  stundenlohnCent: 1250,
  zuschlagSonntagProzent: 25,
  zuschlagFeiertagProzent: 50,
  zuschlagNachtProzent: 10,
  archiviert: false,
  minusImPDFAnzeigen: true,
  personalnummer: "12345",
}

describe("buildUpdateRow — Feldabdeckung", () => {
  it("schreibt bundesland (der eigentliche Bug)", () => {
    const row = buildUpdateRow({ bundesland: "BE" })
    expect(row.bundesland).toBe("BE")
  })

  it("schreibt alle Employer-Felder wenn alle übergeben werden", () => {
    const row = buildUpdateRow(ALLE_FELDER)
    expect(row.name).toBe("Test GmbH")
    expect(row.farbe).toBe("#ff0000")
    expect(row.art).toBe("minijob")
    expect(row.bundesland).toBe("BY")
    expect(row.stundenlohnCent).toBe(1250)
    expect(row.zuschlagSonntagProzent).toBe(25)
    expect(row.zuschlagFeiertagProzent).toBe(50)
    expect(row.zuschlagNachtProzent).toBe(10)
    expect(row.archiviert).toBe(false)
    expect(row.minusImPDFAnzeigen).toBe(true)
    expect(row.personalnummer).toBe("12345")
  })

  it("lässt undefined-Felder weg (kein versehentliches Überschreiben)", () => {
    const row = buildUpdateRow({ name: "NurName" })
    expect(row).toEqual({ name: "NurName" })
    expect(Object.keys(row)).toHaveLength(1)
  })

  it("archiviert: false → wird explizit geschrieben", () => {
    const row = buildUpdateRow({ archiviert: false })
    expect(row.archiviert).toBe(false)
  })

  it("archiviert: undefined → Feld wird nicht gesetzt (kein versehentliches Überschreiben)", () => {
    const row = buildUpdateRow({ archiviert: undefined })
    expect(row.archiviert).toBeUndefined()
  })

  it("personalnummer: leerer String → undefined (Feld wird gelöscht)", () => {
    const row = buildUpdateRow({ personalnummer: "" })
    expect(row.personalnummer).toBeUndefined()
  })
})
