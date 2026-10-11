import { describe, it, expect, beforeEach, vi } from "vitest"
import { sollteWartenFuer, setSessionHint, clearSessionHint, hasSessionHint } from "../sessionHint"

// sollteWartenFuer ist eine reine Funktion — kein Storage nötig
describe("sollteWartenFuer (Hint-Entscheidung)", () => {
  it("false bei leerem Speicher", () => {
    expect(sollteWartenFuer(false, [])).toBe(false)
  })

  it("false bei fremden Keys ohne Firebase-Eintrag", () => {
    expect(sollteWartenFuer(false, ["some:key", "localKey", "firebase:other"])).toBe(false)
  })

  it("true wenn Hint gesetzt", () => {
    expect(sollteWartenFuer(true, [])).toBe(true)
    expect(sollteWartenFuer(true, ["firebase:authUser:x:[DEFAULT]"])).toBe(true)
  })

  it("true bei firebase:authUser:* in Keys (Fall A — erster Besuch nach Deploy)", () => {
    expect(sollteWartenFuer(false, ["firebase:authUser:apikey:[DEFAULT]"])).toBe(true)
    expect(sollteWartenFuer(false, ["other", "firebase:authUser:x:y", "z"])).toBe(true)
  })

  it("erkennt nur den exakten Präfix", () => {
    expect(sollteWartenFuer(false, ["firebase:authUse"])).toBe(false)
    expect(sollteWartenFuer(false, ["xfirebase:authUser:k"])).toBe(false)
  })
})

// localStorage-Hilfsfunktionen mit gemocktem Storage (kein jsdom nötig)
describe("localStorage-Hilfsfunktionen", () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { store = {} },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length },
    })
  })

  it("setSessionHint / hasSessionHint / clearSessionHint runder Durchlauf", () => {
    expect(hasSessionHint()).toBe(false)
    setSessionHint()
    expect(hasSessionHint()).toBe(true)
    clearSessionHint()
    expect(hasSessionHint()).toBe(false)
  })

  it("clearSessionHint ist idempotent", () => {
    clearSessionHint()
    clearSessionHint()
    expect(hasSessionHint()).toBe(false)
  })

  it("clearSessionHint löscht nur den eigenen Key", () => {
    store["sf_andere_key"] = "wert"
    setSessionHint()
    clearSessionHint()
    expect(store["sf_andere_key"]).toBe("wert")
    expect(hasSessionHint()).toBe(false)
  })
})
