import { describe, it, expect } from "vitest"
import { sortByFavoriten, getInitialChipState, getInitialSingleEmployerId, cleanDeadIds } from "../favorites"
import type { Employer } from "../types"

const base: Omit<Employer, "id" | "name" | "favorit"> = {
  farbe: "#000", stundenlohnCent: 1200, art: "werkstudent", bundesland: "HH",
  zuschlagSonntagProzent: 0, zuschlagFeiertagProzent: 0, zuschlagNachtProzent: 0,
}

const emp = (id: string, name: string, favorit?: boolean): Employer =>
  ({ ...base, id, name, ...(favorit !== undefined ? { favorit } : {}) })

describe("sortByFavoriten", () => {
  it("puts favoriten first, then sorts alphabetically", () => {
    const result = sortByFavoriten([
      emp("c", "Zara"), emp("a", "Alpha", true), emp("b", "Beta"),
    ])
    expect(result.map(e => e.id)).toEqual(["a", "b", "c"])
  })

  it("sorts multiple favoriten alphabetically among themselves", () => {
    const result = sortByFavoriten([
      emp("b", "Zara", true), emp("a", "Alpha", true),
    ])
    expect(result.map(e => e.id)).toEqual(["a", "b"])
  })

  it("does not mutate original array", () => {
    const original = [emp("a", "A"), emp("b", "B", true)]
    sortByFavoriten(original)
    expect(original[0].id).toBe("a")
  })
})

describe("getInitialChipState", () => {
  it("returns favoriten mode when any favorit exists", () => {
    const state = getInitialChipState([emp("a", "A", true), emp("b", "B")], "b")
    expect(state).toEqual({ mode: "favoriten" })
  })

  it("returns ids mode for last-used employer when no favoriten", () => {
    const state = getInitialChipState([emp("a", "A"), emp("b", "B")], "b")
    expect(state).toEqual({ mode: "ids", ids: ["b"] })
  })

  it("returns alle when no favoriten and no valid lastUsedId", () => {
    const state = getInitialChipState([emp("a", "A")], "missing")
    expect(state).toEqual({ mode: "alle" })
  })

  it("returns alle when no favoriten and lastUsedId is null", () => {
    const state = getInitialChipState([emp("a", "A")], null)
    expect(state).toEqual({ mode: "alle" })
  })

  it("returns alle for empty employer list", () => {
    const state = getInitialChipState([], null)
    expect(state).toEqual({ mode: "alle" })
  })
})

describe("getInitialSingleEmployerId", () => {
  it("returns first favorit id", () => {
    const id = getInitialSingleEmployerId([emp("a", "A"), emp("b", "B", true)], "a")
    expect(id).toBe("b")
  })

  it("returns lastUsedId when no favoriten", () => {
    const id = getInitialSingleEmployerId([emp("a", "A"), emp("b", "B")], "b")
    expect(id).toBe("b")
  })

  it("returns first employer when no favoriten and no lastUsed", () => {
    const id = getInitialSingleEmployerId([emp("a", "A"), emp("b", "B")], null)
    expect(id).toBe("a")
  })

  it("returns null for empty list", () => {
    expect(getInitialSingleEmployerId([], null)).toBeNull()
  })
})

describe("cleanDeadIds", () => {
  it("removes ids not in employers list", () => {
    const result = cleanDeadIds(["a", "x", "b"], [emp("a", "A"), emp("b", "B")])
    expect(result).toEqual(["a", "b"])
  })

  it("returns empty array when all ids are dead", () => {
    expect(cleanDeadIds(["x", "y"], [emp("a", "A")])).toEqual([])
  })

  it("returns all ids when all are valid", () => {
    expect(cleanDeadIds(["a", "b"], [emp("a", "A"), emp("b", "B")])).toEqual(["a", "b"])
  })
})
