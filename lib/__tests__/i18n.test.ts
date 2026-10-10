import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript"
import { translations, LOCALES } from "@/lib/i18n"

// ─── Source-level duplicate-key detection ─────────────────────────────────────
// JS silently keeps the last value when an object literal has duplicate keys,
// so the imported `translations` object gives no indication. We parse the
// TypeScript source with the TS compiler API instead.

describe("i18n source integrity", () => {
  it("no locale in translations has duplicate keys", () => {
    const filePath = resolve(__dirname, "../../lib/i18n.ts")
    const source = readFileSync(filePath, "utf8")
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

    function findTranslationsNode(node: ts.Node): ts.ObjectLiteralExpression | undefined {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "translations" &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        return node.initializer
      }
      return ts.forEachChild(node, findTranslationsNode)
    }

    const translationsObj = findTranslationsNode(sf)
    expect(translationsObj, "translations object not found in lib/i18n.ts").toBeDefined()
    if (!translationsObj) return

    for (const localeProp of translationsObj.properties) {
      if (!ts.isPropertyAssignment(localeProp)) continue
      if (!ts.isObjectLiteralExpression(localeProp.initializer)) continue
      const localeName = ts.isIdentifier(localeProp.name)
        ? localeProp.name.text
        : localeProp.name.getText(sf)

      const seen = new Set<string>()
      const duplicates: string[] = []
      for (const entry of localeProp.initializer.properties) {
        if (!ts.isPropertyAssignment(entry)) continue
        const key = ts.isIdentifier(entry.name) ? entry.name.text : entry.name.getText(sf)
        if (seen.has(key)) duplicates.push(key)
        else seen.add(key)
      }

      expect(duplicates, `locale "${localeName}" contains duplicate key(s)`).toEqual([])
    }
  })
})

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
