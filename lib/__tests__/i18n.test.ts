import { describe, it, expect } from "vitest"
import { translations, LOCALES } from "@/lib/i18n"

describe("translations completeness", () => {
  it("every locale has every key with a non-empty string value", () => {
    const referenceKeys = Object.keys(translations.de) as (keyof typeof translations.de)[]
    for (const locale of LOCALES) {
      for (const key of referenceKeys) {
        const value = translations[locale][key]
        expect(value, `${locale}.${key}`).toBeDefined()
        expect(value, `${locale}.${key}`).not.toBe("")
      }
    }
  })

  it("all locales have the same keys", () => {
    const deKeys = Object.keys(translations.de).sort()
    for (const locale of LOCALES) {
      expect(Object.keys(translations[locale]).sort(), `locale ${locale} keys`).toEqual(deKeys)
    }
  })
})
