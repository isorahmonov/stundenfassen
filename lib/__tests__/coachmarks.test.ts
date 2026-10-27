import { describe, it, expect } from "vitest"
import { sollCoachmarkZeigen } from "../coachmarks"
import type { Employer } from "../types"

const base: Omit<Employer, "id" | "name"> = {
  farbe: "#000", stundenlohnCent: 1200, art: "werkstudent", bundesland: "HH",
  zuschlagSonntagProzent: 0, zuschlagFeiertagProzent: 0, zuschlagNachtProzent: 0,
}
const emp = (id: string, overrides: Partial<Employer> = {}): Employer =>
  ({ ...base, id, name: id, ...overrides })

describe("sollCoachmarkZeigen", () => {
  it("false wenn gesehen", () => {
    expect(sollCoachmarkZeigen([emp("a"), emp("b")], true)).toBe(false)
  })

  it("false mit nur 1 aktivem Arbeitgeber", () => {
    expect(sollCoachmarkZeigen([emp("a")], false)).toBe(false)
  })

  it("true mit 2 aktiven Arbeitgebern ohne Favorit", () => {
    expect(sollCoachmarkZeigen([emp("a"), emp("b")], false)).toBe(true)
  })

  it("false wenn mindestens 1 Favorit gesetzt", () => {
    expect(sollCoachmarkZeigen([emp("a", { favorit: true }), emp("b")], false)).toBe(false)
  })

  it("false wenn alle Arbeitgeber archiviert sind", () => {
    expect(sollCoachmarkZeigen(
      [emp("a", { archiviert: true }), emp("b", { archiviert: true })],
      false,
    )).toBe(false)
  })
})
