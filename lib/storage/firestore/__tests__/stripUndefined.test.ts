import { describe, it, expect } from "vitest"
import { stripUndefined } from "@/lib/storage/firestore/stripUndefined"

describe("stripUndefined", () => {
  it("entfernt undefined-Felder auf der obersten Ebene", () => {
    expect(stripUndefined({ a: 1, b: undefined } as Record<string, unknown>)).toEqual({ a: 1 })
  })

  it("entfernt undefined-Felder rekursiv in verschachtelten Objekten", () => {
    expect(stripUndefined({ x: { y: undefined, z: 2 } } as Record<string, unknown>)).toEqual({ x: { z: 2 } })
  })

  it("lässt null unverändert", () => {
    expect(stripUndefined({ n: null } as Record<string, unknown>)).toEqual({ n: null })
  })

  it("lässt Arrays unverändert (kein Filtern, kein Umsortieren)", () => {
    const arr = [1, undefined, 3]
    const result = stripUndefined({ arr } as Record<string, unknown>) as { arr: unknown[] }
    expect(result.arr).toBe(arr)
  })

  it("lässt Klassen-Instanzen (z.B. Firestore FieldValue) unverändert", () => {
    class Sentinel {}
    const v = new Sentinel()
    expect((stripUndefined({ v } as Record<string, unknown>) as { v: unknown }).v).toBe(v)
  })

  it("gibt leeres Objekt zurück, wenn alle Felder undefined sind", () => {
    expect(stripUndefined({ a: undefined, b: undefined } as Record<string, unknown>)).toEqual({})
  })
})
