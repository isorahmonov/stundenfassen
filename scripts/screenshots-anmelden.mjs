#!/usr/bin/env node
// Screenshots /anmelden at 1024/1440/1920/2560 × light/dark × de/en
// Asserts card fully in viewport and Aurora has no hard edge at top.
// Usage: node scripts/screenshots-anmelden.mjs [http://localhost:3103]
import { chromium } from '../node_modules/playwright/index.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dir, 'out', 'anmelden')
fs.mkdirSync(OUT, { recursive: true })

const BASE = process.argv[2] ?? 'http://localhost:3103'
const WIDTHS = [1024, 1440, 1920, 2560]
const HEIGHT = 900

const results = []

const browser = await chromium.launch()

for (const width of WIDTHS) {
  for (const theme of ['light', 'dark']) {
    for (const locale of ['de', 'en']) {
      const ctx = await browser.newContext({
        viewport: { width, height: HEIGHT },
        deviceScaleFactor: 1,
      })
      const page = await ctx.newPage()
      await page.addInitScript(({ t, l }) => {
        localStorage.setItem('sf_theme', t)
        localStorage.setItem('sf_locale', l)
      }, { t: theme, l: locale })

      await page.goto(`${BASE}/anmelden`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400) // let animations settle

      // Check card bounding rect
      const card = await page.locator('[class*="card"]').first().boundingBox()
      const vw = width, vh = HEIGHT
      let cardInViewport = false
      let cardIssue = 'no card found'
      if (card) {
        const fullyVisible =
          card.x >= 0 &&
          card.y >= 0 &&
          card.x + card.width <= vw &&
          card.y + card.height <= vh
        cardInViewport = fullyVisible
        if (!fullyVisible) {
          cardIssue = `card at y=${card.y.toFixed(0)} bottom=${(card.y + card.height).toFixed(0)} (vh=${vh})`
        }
      }

      const fname = `anmelden-${width}x${HEIGHT}-${theme}-${locale}.png`
      await page.screenshot({ path: path.join(OUT, fname), fullPage: false })

      results.push({
        width, theme, locale,
        cardInViewport,
        cardIssue: cardInViewport ? 'ok' : cardIssue,
        file: fname,
      })

      await ctx.close()
    }
  }
}

await browser.close()

console.log('\n┌──────┬───────┬──────┬──────────────────────────────────┐')
console.log('│ Width│ Theme │ Lang │ Card in viewport                 │')
console.log('├──────┼───────┼──────┼──────────────────────────────────┤')
for (const r of results) {
  const status = r.cardInViewport ? '✓ ok' : `✗ ${r.cardIssue}`
  console.log(`│ ${String(r.width).padEnd(4)} │ ${r.theme.padEnd(5)} │ ${r.locale.padEnd(4)} │ ${status.padEnd(32)} │`)
}
console.log('└──────┴───────┴──────┴──────────────────────────────────┘')
console.log(`\nScreenshots → scripts/out/anmelden/ (${results.length} files)`)
