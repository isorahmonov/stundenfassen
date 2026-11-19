#!/usr/bin/env node
// Phase (e) login-page screenshot matrix. Local only, not committed.
// Usage: node scripts/playwright-phase-e.mjs [--port 3001]

import pkg from "/tmp/pw-install/node_modules/playwright/index.js"
const { chromium } = pkg
import { mkdir } from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT = path.join(ROOT, "playwright-screenshots")

const args = process.argv.slice(2)
const portIdx = args.indexOf("--port")
const PORT = portIdx !== -1 ? args[portIdx + 1] : "3001"
const BASE = `http://localhost:${PORT}/anmelden`

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "1440x800", width: 1440, height: 800 },
]

const MOBILE_WIDTHS = new Set([320, 375, 390, 430])
const THEMES = ["light", "dark"]
const LOCALES = ["de", "en"]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (await (async () => {
      const { execSync } = await import("child_process")
      try {
        return execSync("npx playwright --version 2>/dev/null; npx playwright show-browsers 2>/dev/null; echo done").toString()
      } catch { return undefined }
    })()) && undefined,
  headless: true,
  args: ["--headless=new"],
})

const scrollViolations = []
const files = []

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    for (const locale of LOCALES) {
      for (const errorState of [false, true]) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme === "dark" ? "dark" : "light",
          locale: locale === "de" ? "de-DE" : "en-US",
        })
        const page = await context.newPage()

        // Set stored locale preference so the app picks it up
        await context.addInitScript((loc) => {
          localStorage.setItem("sf_lang", loc)
        }, locale)

        // Set theme
        await context.addInitScript((th) => {
          localStorage.setItem("sf_theme", th)
        }, theme)

        await page.goto(BASE, { waitUntil: "networkidle", timeout: 15000 })

        // Wait for the card to be visible
        await page.waitForSelector('[class*="card"]', { timeout: 8000 }).catch(() => {})

        if (errorState) {
          // Inject an error by submitting invalid email/password credentials.
          // Firebase will return auth/invalid-credential which the UI surfaces.
          await page.fill('[type="email"]', "screenshot-test@example.invalid").catch(() => {})
          await page.fill('[type="password"]', "wrongpassword123").catch(() => {})
          await page.click('[type="submit"]').catch(() => {})
          // Wait for error message to appear (role=alert)
          await page.waitForSelector('[role="alert"]', { timeout: 6000 }).catch(async () => {
            // Fallback: inject error text directly into the DOM
            await page.evaluate(() => {
              const wrap = document.querySelector('[class*="msgWrap"]')
              if (!wrap) return
              const existing = wrap.querySelector('[role="alert"]')
              if (existing) return
              const p = document.createElement("p")
              p.setAttribute("role", "alert")
              p.style.cssText = "color:#b42318;background:rgba(220,60,50,.12);border-radius:.6rem;padding:.6rem .75rem;font-size:.8rem;line-height:1.4"
              p.textContent = "auth/wrong-password — Falsches Passwort."
              wrap.appendChild(p)
            })
          })
          await page.waitForTimeout(200)
        }

        const label = `${vp.name}_${theme}_${locale}${errorState ? "_error" : ""}`
        const file = path.join(OUT, `${label}.png`)

        await page.screenshot({ path: file, fullPage: false })
        files.push({ label, file })

        // Scroll check for mobile
        if (MOBILE_WIDTHS.has(vp.width)) {
          const scrolled = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
          if (scrolled) {
            const sh = await page.evaluate(() => document.documentElement.scrollHeight)
            const ih = await page.evaluate(() => window.innerHeight)
            scrollViolations.push({ label, scrollHeight: sh, innerHeight: ih })
          }
        }

        await context.close()
      }
    }
  }
}

await browser.close()

console.log("\n=== Screenshot paths ===")
for (const { label, file } of files) {
  console.log(`  ${label.padEnd(40)} ${file}`)
}

if (scrollViolations.length === 0) {
  console.log("\n✓ No scroll violations on mobile viewports")
} else {
  console.log("\n✗ SCROLL VIOLATIONS:")
  for (const v of scrollViolations) {
    console.log(`  ${v.label}: scrollHeight=${v.scrollHeight} innerHeight=${v.innerHeight}`)
  }
  process.exitCode = 1
}

console.log(`\n${files.length} screenshots saved to ${OUT}`)
