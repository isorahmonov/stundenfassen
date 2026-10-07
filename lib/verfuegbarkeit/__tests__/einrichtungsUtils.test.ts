import { describe, expect, it } from "vitest"
import { sollDialogOeffnen, sollEinrichtenZeigen } from "@/lib/verfuegbarkeit/einrichtungsUtils"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Employer } from "@/lib/types"

const BASIS: Employer = {
  id: "test",
  name: "Test AG",
  farbe: "#2563eb",
  art: "werkstudent",
  bundesland: "HH",
  stundenlohnCent: 1500,
  zuschlagSonntagProzent: 0,
  zuschlagFeiertagProzent: 0,
  zuschlagNachtProzent: 0,
}

describe("sollDialogOeffnen", () => {
  it("öffnet nicht wenn einrichtungBestaetigt=true", () => {
    const e: Employer = { ...BASIS, verfuegbarkeit: { ...NEUTRALE_EINSTELLUNGEN, einrichtungBestaetigt: true } }
    expect(sollDialogOeffnen(e)).toBe(false)
  })

  it("öffnet wenn einrichtungBestaetigt=false", () => {
    const e: Employer = { ...BASIS, verfuegbarkeit: { ...NEUTRALE_EINSTELLUNGEN, einrichtungBestaetigt: false } }
    expect(sollDialogOeffnen(e)).toBe(true)
  })

  it("öffnet wenn verfuegbarkeit fehlt (undefined)", () => {
    expect(sollDialogOeffnen(BASIS)).toBe(true)
  })

  it("öffnet nicht ohne Arbeitgeber (null)", () => {
    expect(sollDialogOeffnen(null)).toBe(false)
  })

  it("öffnet nicht wenn einrichtungUebersprungen=true (auch ohne Bestätigung)", () => {
    const e: Employer = { ...BASIS, verfuegbarkeit: { ...NEUTRALE_EINSTELLUNGEN, einrichtungBestaetigt: false, einrichtungUebersprungen: true } }
    expect(sollDialogOeffnen(e)).toBe(false)
  })

  it("öffnet wenn einrichtungUebersprungen=false und nicht bestätigt", () => {
    const e: Employer = { ...BASIS, verfuegbarkeit: { ...NEUTRALE_EINSTELLUNGEN, einrichtungBestaetigt: false, einrichtungUebersprungen: false } }
    expect(sollDialogOeffnen(e)).toBe(true)
  })
})

describe("sollEinrichtenZeigen", () => {
  it("gibt false zurück wenn Liste leer", () => {
    expect(sollEinrichtenZeigen([])).toBe(false)
  })

  it("gibt false zurück wenn alle bestätigt", () => {
    const docs = [
      { verfuegbarkeit: { einrichtungBestaetigt: true } },
      { verfuegbarkeit: { einrichtungBestaetigt: true } },
    ]
    expect(sollEinrichtenZeigen(docs)).toBe(false)
  })

  it("gibt true zurück wenn mindestens einer unbestätigt", () => {
    const docs = [
      { verfuegbarkeit: { einrichtungBestaetigt: true } },
      { verfuegbarkeit: { einrichtungBestaetigt: false } },
    ]
    expect(sollEinrichtenZeigen(docs)).toBe(true)
  })

  it("gibt true zurück wenn verfuegbarkeit fehlt (undefined)", () => {
    const docs = [{}]
    expect(sollEinrichtenZeigen(docs)).toBe(true)
  })

  it("gibt true zurück wenn einrichtungBestaetigt fehlt", () => {
    const docs = [{ verfuegbarkeit: {} }]
    expect(sollEinrichtenZeigen(docs)).toBe(true)
  })
})
