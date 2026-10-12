/**
 * Login-Split Layout-Test
 *
 * Voraussetzung: Dev-Server läuft auf http://localhost:3000 (npm run dev)
 * Ausführen:     npx playwright test e2e/login-split-layout.spec.ts
 *
 * Prüft, dass die Login-Karte bei breiten Viewports nicht abgeschnitten wird.
 * Testet 1024/1440/1920/2560px in light/dark und DE/EN.
 */
import { test, expect } from "@playwright/test"

const WIDTHS = [1024, 1440, 1920, 2560]
const THEMES: Array<"light" | "dark"> = ["light", "dark"]
const LOCALES: Array<"de" | "en"> = ["de", "en"]

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    for (const locale of LOCALES) {
      test(`Karte nicht abgeschnitten — ${width}px / ${theme} / ${locale}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 720 })

        // Set locale via localStorage before navigation
        await page.addInitScript(({ t, l }) => {
          localStorage.setItem("sf_theme", t)
          localStorage.setItem("sf_locale", l)
        }, { t: theme, l: locale })

        await page.goto("/anmelden")
        await page.waitForSelector("[class*='brandPanel']")

        const card = page.locator("[class*='loginWrap']").first()
        const { left, right } = await card.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return { left: r.left, right: r.right }
        })
        const vw = await page.evaluate(() => window.innerWidth)

        expect(left).toBeGreaterThanOrEqual(0)
        expect(right).toBeLessThanOrEqual(vw)
      })
    }
  }
}
