/**
 * Loader-Overlay Screenshots
 *
 * Voraussetzung: Dev-Server läuft auf http://localhost:3000 (npm run dev)
 * Ausführen: npx playwright test e2e/loader-overlay.spec.ts
 *
 * Prüft den viewport-deckenden Ladezustand bei 1440px und 375px, hell und dunkel.
 * Firebase-Auth-Anfragen werden blockiert, damit laden=true erhalten bleibt.
 */
import { test, expect } from "@playwright/test"

/** Setzt localStorage-Keys vor dem Seitenaufruf. */
function mitSession(theme: "light" | "dark") {
  return {
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [
            // sf_session_hint=1 → sollteWarten()=true → laden bleibt true
            { name: "sf_session_hint", value: "1" },
            // Echter Firebase-Key-Prefix hält laden zusätzlich offen
            { name: "firebase:authUser:test-api-key:[DEFAULT]", value: JSON.stringify({ uid: "testuid" }) },
            { name: "sf_theme", value: theme },
          ],
        },
      ],
    },
  }
}

test.describe("Loader-Overlay Desktop 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("hell — Overlay deckt Viewport, Logo zentriert", async ({ page }) => {
    test.use(mitSession("light"))
    // Firebase-Auth blockieren, damit laden=true bleibt
    await page.route("**/identitytoolkit.googleapis.com/**", route => route.abort())
    await page.route("**/securetoken.googleapis.com/**", route => route.abort())
    await page.goto("/")
    // Overlay abwarten (fixed z-50, enthält ShiftslotLoader)
    await page.waitForSelector(".fixed.z-50", { timeout: 2000 })
    await page.screenshot({ path: "playwright-screenshots/loader-1440-light.png" })
  })

  test("dunkel — Overlay deckt Viewport, Logo zentriert", async ({ page }) => {
    test.use(mitSession("dark"))
    await page.route("**/identitytoolkit.googleapis.com/**", route => route.abort())
    await page.route("**/securetoken.googleapis.com/**", route => route.abort())
    // data-theme über addInitScript setzen, falls ThemeProvider noch nicht gemountet
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.setAttribute("data-theme", "dark")
      })
    })
    await page.goto("/")
    await page.waitForSelector(".fixed.z-50", { timeout: 2000 })
    await page.screenshot({ path: "playwright-screenshots/loader-1440-dark.png" })
  })
})

test.describe("Loader-Overlay Mobile 375px", () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test("hell — Overlay füllt 100dvh auf Mobilgeräten", async ({ page }) => {
    test.use(mitSession("light"))
    await page.route("**/identitytoolkit.googleapis.com/**", route => route.abort())
    await page.route("**/securetoken.googleapis.com/**", route => route.abort())
    await page.goto("/anmelden")
    await page.waitForSelector(".fixed.z-50", { timeout: 2000 })
    await page.screenshot({ path: "playwright-screenshots/loader-375-light.png" })
  })

  test("dunkel — Overlay füllt 100dvh auf Mobilgeräten", async ({ page }) => {
    test.use(mitSession("dark"))
    await page.route("**/identitytoolkit.googleapis.com/**", route => route.abort())
    await page.route("**/securetoken.googleapis.com/**", route => route.abort())
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.setAttribute("data-theme", "dark")
      })
    })
    await page.goto("/anmelden")
    await page.waitForSelector(".fixed.z-50", { timeout: 2000 })
    await page.screenshot({ path: "playwright-screenshots/loader-375-dark.png" })
  })
})

test.describe("CLS nach Overlay-Ausblendung", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 1440, height: 900 },
  })

  test("CLS = 0 beim Übergang von Overlay zu LoginView", async ({ page }) => {
    await page.goto("/anmelden")
    const cls: number = await page.evaluate(
      (duration) =>
        new Promise<number>((resolve) => {
          let total = 0
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as PerformanceEventTiming & { hadRecentInput: boolean }).hadRecentInput) {
                total += (entry as PerformanceEventTiming & { value: number }).value
              }
            }
          })
          obs.observe({ type: "layout-shift", buffered: true })
          setTimeout(() => { obs.disconnect(); resolve(total) }, duration)
        }),
      3000,
    )
    expect(cls).toBe(0)
  })
})
