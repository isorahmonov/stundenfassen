/**
 * Login-Split Animationstest
 *
 * Voraussetzung: Dev-Server läuft auf http://localhost:3000 (npm run dev)
 * Ausführen:     npx playwright test e2e/login-split-animation.spec.ts
 *
 * Prüft, dass cardFloat bei no-preference sichtbar animiert und bei
 * prefers-reduce-motion statisch bleibt.
 */
import { test, expect } from "@playwright/test"

test.describe("Login-Split Animationen", () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test("cardFloat läuft ohne reduce-motion (Positionen 2.5s auseinander unterscheiden sich)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await page.goto("/anmelden")
    // brandPanel = desktop-Layout ist aktiv
    await page.waitForSelector("[class*='brandPanel']")
    // Warten bis cardFloat-Delay (0.6s) verstrichen und Animation läuft
    await page.waitForTimeout(700)

    const wrap = page.locator("[class*='loginWrap']").first()
    const y1 = await wrap.evaluate((el) => el.getBoundingClientRect().y)
    // 2.5s = 50% der 5s-Periode → Peak bei translateY(-3px)
    await page.waitForTimeout(2500)
    const y2 = await wrap.evaluate((el) => el.getBoundingClientRect().y)

    expect(Math.abs(y1 - y2)).toBeGreaterThan(0.5)
  })

  test("cardFloat statisch mit reduce-motion (Positionen bleiben identisch)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/anmelden")
    await page.waitForSelector("[class*='brandPanel']")
    await page.waitForTimeout(700)

    const wrap = page.locator("[class*='loginWrap']").first()
    const y1 = await wrap.evaluate((el) => el.getBoundingClientRect().y)
    await page.waitForTimeout(2500)
    const y2 = await wrap.evaluate((el) => el.getBoundingClientRect().y)

    expect(y1).toBe(y2)
  })
})
