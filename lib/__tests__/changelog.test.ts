import { describe, it, expect } from "vitest"
import { getEintraegeZeigen, entscheideAnzeige, CHANGELOG, type ChangelogEintrag } from "@/lib/changelog"
import { APP_VERSION } from "@/lib/brand"

const EINTRAG_2_1_0: ChangelogEintrag = CHANGELOG.find((e) => e.version === "2.1.0")!
const EINTRAG_2_0: ChangelogEintrag = CHANGELOG.find((e) => e.version === "2.0")!

describe("getEintraegeZeigen", () => {
  it("current version stored → no entries (already up to date)", () => {
    expect(getEintraegeZeigen(APP_VERSION, CHANGELOG)).toHaveLength(0)
  })

  it("user with version 2.0 sees only 2.1.0", () => {
    const result = getEintraegeZeigen("2.0", CHANGELOG)
    expect(result).toHaveLength(1)
    expect(result[0].version).toBe("2.1.0")
  })

  it("user with version 1.x sees both 2.0 and 2.1.0 (max 2)", () => {
    const result = getEintraegeZeigen("1.5", CHANGELOG)
    expect(result).toHaveLength(2)
    expect(result[0].version).toBe("2.1.0")
    expect(result[1].version).toBe("2.0")
  })

  it("legacy value '2026-10-07-v2' is treated as 2.0 seen — only 2.1.0 shown", () => {
    // "2026-10-07-v2" was the lastSeenUpdateVersion written before semver was introduced.
    // It maps to "2.0" so the user does not see the 2.0 entry a second time.
    const result = getEintraegeZeigen("2026-10-07-v2", CHANGELOG)
    expect(result).toHaveLength(1)
    expect(result[0].version).toBe("2.1.0")
  })

  it("old account with no stored version (undefined) sees both 2.0 and 2.1.0", () => {
    // empSnap is not empty (existing user), but no version was ever stored —
    // they missed both announcements, so both entries are shown (max 2).
    const result = getEintraegeZeigen(undefined, CHANGELOG)
    expect(result).toHaveLength(2)
    expect(result[0].version).toBe("2.1.0")
    expect(result[1].version).toBe("2.0")
  })

  it("user who already dismissed sees nothing on second login", () => {
    const result = getEintraegeZeigen(APP_VERSION, CHANGELOG)
    expect(result).toHaveLength(0)
  })

  it("max parameter limits entries", () => {
    const result = getEintraegeZeigen(undefined, CHANGELOG, 1)
    expect(result).toHaveLength(1)
    expect(result[0].version).toBe("2.1.0")
  })

  it("returns entries newest first", () => {
    const result = getEintraegeZeigen(undefined, CHANGELOG)
    expect(result[0].version).toBe("2.1.0")
    expect(result[1].version).toBe("2.0")
  })
})

describe("CHANGELOG structure", () => {
  it("has 2.1.0 entry with 8 item keys", () => {
    expect(EINTRAG_2_1_0).toBeDefined()
    expect(EINTRAG_2_1_0.itemKeys).toHaveLength(8)
  })

  it("has 2.0 entry with 9 item keys", () => {
    expect(EINTRAG_2_0).toBeDefined()
    expect(EINTRAG_2_0.itemKeys).toHaveLength(9)
  })

  it("is ordered newest first", () => {
    expect(CHANGELOG[0].version).toBe("2.1.0")
    expect(CHANGELOG[1].version).toBe("2.0")
  })

  it("2.1.0 item keys are all unique", () => {
    const keys = EINTRAG_2_1_0.itemKeys
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe("entscheideAnzeige", () => {
  it("new account — empty employers, not time-new → speichern, nothing shown", () => {
    const r = entscheideAnzeige(undefined, { empty: true }, false)
    expect(r.aktion).toBe("speichern")
  })

  it("new account — has employers but account < 10 min old → speichern (invitation flow)", () => {
    const r = entscheideAnzeige(undefined, { empty: false }, true)
    expect(r.aktion).toBe("speichern")
  })

  it("after employer added later, version already stored → nichts shown", () => {
    // Simulates: was new on first load, version written; user adds employer, reopens app.
    const r = entscheideAnzeige(APP_VERSION, { empty: false }, false)
    expect(r.aktion).toBe("nichts")
  })

  it("old account with employers and no stored value → both entries shown", () => {
    const r = entscheideAnzeige(undefined, { empty: false }, false)
    expect(r.aktion).toBe("zeigen")
    const eintraege = r.aktion === "zeigen" ? r.eintraege : []
    expect(eintraege).toHaveLength(2)
    expect(eintraege[0].version).toBe("2.1.0")
    expect(eintraege[1].version).toBe("2.0")
  })

  it("old account with legacy version → only 2.1.0 shown", () => {
    const r = entscheideAnzeige("2026-10-07-v2", { empty: false }, false)
    expect(r.aktion).toBe("zeigen")
    const eintraege = r.aktion === "zeigen" ? r.eintraege : []
    expect(eintraege).toHaveLength(1)
    expect(eintraege[0].version).toBe("2.1.0")
  })

  it("already seen current version → nichts (all paths)", () => {
    expect(entscheideAnzeige(APP_VERSION, { empty: true }, true).aktion).toBe("nichts")
    expect(entscheideAnzeige(APP_VERSION, { empty: false }, false).aktion).toBe("nichts")
  })
})
