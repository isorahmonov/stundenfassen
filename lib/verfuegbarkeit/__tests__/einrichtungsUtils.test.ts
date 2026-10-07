import { describe, expect, it } from "vitest"
import { sollDialogOeffnen } from "@/lib/verfuegbarkeit/einrichtungsUtils"
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
})
