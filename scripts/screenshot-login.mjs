/**
 * Playwright screenshots of the login screen at 0 ms, 800 ms, 2500 ms.
 * Requires: npm run dev (http://localhost:3000) to be running.
 * Run: node scripts/screenshot-login.mjs
 */

import { chromium } from "../node_modules/playwright/index.mjs"
import { mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, "..", "playwright-screenshots")
mkdirSync(OUT, { recursive: true })

const URL = "http://localhost:3000"

const VIEWPORTS = [
  { name: "mobile",   width: 390,  height: 844  },
  { name: "desktop",  width: 1280, height: 800  },
]

const SCHEMES = [
  { name: "light", colorScheme: "light", reducedMotion: "no-preference" },
  { name: "dark",  colorScheme: "dark",  reducedMotion: "no-preference" },
  { name: "reduced", colorScheme: "light", reducedMotion: "reduce" },
]

const TIMES_MS = [0, 800, 2500]

async function run() {
  const browser = await chromium.launch()
  let total = 0

  for (const vp of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme.colorScheme,
        reducedMotion: scheme.reducedMotion,
      })
      const page = await ctx.newPage()

      // Clear sessionStorage so the full animation always plays
      await page.addInitScript(() => {
        try { sessionStorage.removeItem("sf_login_anim") } catch (_) {}
      })

      await page.goto(URL, { waitUntil: "domcontentloaded" })

      // Wait for login h1 to appear (auth resolves, loading spinner gone)
      await page.waitForSelector("h1", { timeout: 15000 })

      // Pause all CSS animations immediately so we can seek to exact times
      await page.evaluate(() => {
        for (const a of document.getAnimations()) a.pause()
      })

      if (scheme.reducedMotion === "reduce") {
        // Single screenshot — all animations disabled, final state visible
        const file = join(OUT, `${vp.name}-${scheme.name}.png`)
        await page.screenshot({ path: file })
        console.log(`✓ ${vp.name}-${scheme.name}.png`)
        total++
      } else {
        for (const ms of TIMES_MS) {
          await page.evaluate((t) => {
            for (const a of document.getAnimations()) {
              a.currentTime = t
            }
          }, ms)
          // Let the browser render the frame
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)))

          const file = join(OUT, `${vp.name}-${scheme.name}-${ms}ms.png`)
          await page.screenshot({ path: file })
          console.log(`✓ ${vp.name}-${scheme.name}-${ms}ms.png`)
          total++
        }
      }

      await ctx.close()
    }
  }

  await browser.close()
  console.log(`\nDone — ${total} screenshots in ${OUT}`)
}

run().catch((e) => { console.error(e); process.exit(1) })
