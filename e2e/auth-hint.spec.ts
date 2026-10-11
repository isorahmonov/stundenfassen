/**
 * Auth-Hint Edge-Case Tests
 *
 * Voraussetzung: Dev-Server läuft auf http://localhost:3000 (npm run dev)
 * Ausführen: npx playwright test e2e/auth-hint.spec.ts
 *
 * Getestet wird nur das Client-seitige Verhalten (localStorage/IndexedDB-Prüfung),
 * nicht die echte Firebase-Authentifizierung.
 */
import { test, expect, type Page } from "@playwright/test"

/** Misst CLS (Cumulative Layout Shift) während einer bestimmten Zeitspanne nach dem Load. */
async function measureCLS(page: Page, ms = 2000): Promise<number> {
  return page.evaluate(
    (duration) =>
      new Promise<number>((resolve) => {
        let cls = 0
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEventTiming & { hadRecentInput: boolean }).hadRecentInput) {
              cls += (entry as PerformanceEventTiming & { value: number }).value
            }
          }
        })
        obs.observe({ type: "layout-shift", buffered: true })
        setTimeout(() => {
          obs.disconnect()
          resolve(cls)
        }, duration)
      }),
    ms,
  )
}

/**
 * Fall A: Nutzer hat aktive Firebase-Session (Key in localStorage),
 * aber sf_session_hint fehlt (z. B. erster Besuch nach Deploy).
 * Erwartung: AuthGate wartet auf Firebase → kein sofortiger LoginView-Flash.
 */
test.describe("Fall A: Firebase-Key ohne Hint", () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [
            // Echte Firebase-Session-Keys haben dieses Präfix. Wert muss kein
            // gültiges Token sein — wir testen nur das Warte-Verhalten, nicht Auth.
            { name: "firebase:authUser:test-api-key:[DEFAULT]", value: JSON.stringify({ uid: "testuid" }) },
          ],
        },
      ],
    },
  })

  test("loader gezeigt statt sofortigem LoginView", async ({ page }) => {
    await page.goto("/anmelden")

    // sollteWarten() findet den Firebase-Key → laden bleibt true → kein LoginView sofort.
    // Das Login-Formular (E-Mail-Input) darf in den ersten 500 ms nicht sichtbar sein.
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).not.toBeVisible({ timeout: 500 })
  })

  test("CLS < 0,1 in den ersten 2 s", async ({ page }) => {
    await page.goto("/anmelden")
    const cls = await measureCLS(page, 2000)
    expect(cls).toBeLessThan(0.1)
  })
})

/**
 * Fall B: Hint gesetzt, aber keine Firebase-Session vorhanden (Session abgelaufen).
 * Erwartung: AuthGate wartet auf Firebase → loader → danach LoginView, keine Fehlermeldung.
 */
test.describe("Fall B: Hint gesetzt, Session abgelaufen", () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [{ name: "sf_session_hint", value: "1" }],
        },
      ],
    },
  })

  test("loader sofort sichtbar (kein optimistisches Render)", async ({ page }) => {
    await page.goto("/anmelden")

    // Hint gesetzt → laden bleibt true → LoginView nicht sofort
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).not.toBeVisible({ timeout: 500 })
  })

  test("CLS < 0,1 in den ersten 2 s", async ({ page }) => {
    await page.goto("/anmelden")
    const cls = await measureCLS(page, 2000)
    expect(cls).toBeLessThan(0.1)
  })
})

/**
 * Fall C: Kein Hint, kein Firebase-Key (normaler abgemeldeter Nutzer).
 * Erwartung: Optimistisches Render → LoginView sofort sichtbar, CLS = 0.
 */
test.describe("Fall C: Kein Hint, kein Firebase-Key", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  })

  test("LoginView sofort nach Navigation sichtbar", async ({ page }) => {
    await page.goto("/anmelden")

    // sollteWarten() → false → setLaden(false) → LoginView ohne Warten
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 1000 })
  })

  test("CLS = 0 (kein Layout-Shift bei sofortigem Render)", async ({ page }) => {
    await page.goto("/anmelden")
    const cls = await measureCLS(page, 2000)
    expect(cls).toBe(0)
  })
})
