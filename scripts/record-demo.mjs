#!/usr/bin/env node
/**
 * record-demo.mjs  —  Playwright walkthrough for the explainer GIF / MP4.
 *
 * Usage:
 *   PW_PATH=/path/to/playwright/index.mjs node scripts/record-demo.mjs
 *   (App must be running: npm run dev  — then open http://localhost:3000)
 *
 * Outputs:
 *   public/update/3-0-0-walkthrough.gif   (≤ 3 MB)
 *   public/update/3-0-0-walkthrough.mp4   (fallback when GIF > 3 MB)
 *
 * Env vars:
 *   PW_PATH     — path to playwright index.mjs (auto-discovered from npx cache)
 *   APP_URL     — default http://localhost:3000
 *   FFMPEG      — ffmpeg binary, default "ffmpeg"
 */

import { mkdirSync, readdirSync, statSync, existsSync } from "fs"
import { execSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dir, "..")
const FRAMES_DIR = path.join(__dir, "out", "demo-frames")
mkdirSync(FRAMES_DIR, { recursive: true })

// ─── Playwright discovery ─────────────────────────────────────────────────────
function findPlaywright() {
  if (process.env.PW_PATH) return process.env.PW_PATH
  const candidates = [
    path.join(ROOT, "node_modules", "playwright", "index.mjs"),
    "/tmp/pw-install/node_modules/playwright/index.mjs",
  ]
  // Also scan npx cache
  const npmCacheBase = (() => {
    try { return execSync("npm get cache", { encoding: "utf8" }).trim() } catch { return null }
  })()
  if (npmCacheBase) {
    try {
      const npxDir = path.join(npmCacheBase, "_npx")
      for (const hash of readdirSync(npxDir)) {
        const p = path.join(npxDir, hash, "node_modules", "playwright", "index.mjs")
        if (existsSync(p)) candidates.push(p)
      }
    } catch { /* ignore */ }
  }
  const found = candidates.find(p => existsSync(p))
  if (!found) {
    console.error(
      "Playwright not found. Install it or set PW_PATH:\n" +
      "  npx playwright install chromium\n" +
      "  PW_PATH=$(node -e \"require.resolve('playwright')\") node scripts/record-demo.mjs"
    )
    process.exit(1)
  }
  return found
}

const { chromium } = await import(findPlaywright())

const BASE = process.env.APP_URL ?? "http://localhost:3000"
const FFMPEG = process.env.FFMPEG ?? "ffmpeg"
const PUBLIC_UPDATE = path.join(ROOT, "public", "update")
mkdirSync(PUBLIC_UPDATE, { recursive: true })

// ─── Browser ──────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: process.env.HEADLESS !== "0" })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "light",
  locale: "en-US",
  timezoneId: "Europe/Berlin",
  recordVideo: { dir: FRAMES_DIR, size: { width: 390, height: 844 } },
})

// Belt-and-suspenders: also set via initScript (FOUC script already sets it via ?demo=1)
await context.addInitScript(() => {
  localStorage.setItem("sf_lang", "en")
  localStorage.setItem("sf_theme", "light")
})

const page = await context.newPage()
const wait = ms => page.waitForTimeout(ms)

// Click a chip button by its exact label
async function clickChip(label) {
  await page.getByRole("button", { name: label, exact: true }).click()
  await wait(500)
}

// ─── Scene 1: Home ───────────────────────────────────────────────────────────
console.log("[1/7] Home (?demo=1)")
await page.goto(`${BASE}/?demo=1`, { waitUntil: "load" })
await page.waitForSelector("text=Café Aurora", { timeout: 15_000 })
await wait(1000)

// ─── Scene 2: Calendar tab ───────────────────────────────────────────────────
console.log("[2/7] Calendar tab")
// href is now /?demo=1 → /kalender?demo=1 (TabBar preserves ?demo=1)
await page.getByRole("link", { name: "Calendar" }).click()
await page.waitForURL(`${BASE}/kalender**`, { timeout: 10_000 })
// Wait for view chips to render (chip bar)
await page.waitForSelector("button:has-text('Day')", { timeout: 10_000 })
await wait(500)

// ─── Scene 3: Day view ───────────────────────────────────────────────────────
console.log("[3/7] Day view")
await clickChip("Day")
await wait(700)

// ─── Scene 4: 3D view (now-line visible) ─────────────────────────────────────
console.log("[4/7] 3D (now-line)")
await clickChip("3D")
await wait(1200)

// ─── Scene 5: Week view ──────────────────────────────────────────────────────
console.log("[5/7] Week view")
await clickChip("Week")
await wait(800)

// ─── Scene 6: Month → tap a day with shifts → close sheet ────────────────────
console.log("[6/7] Month → day tap → close")
await clickChip("Month")
// Wait for month grid to render
await page.waitForSelector(".grid.grid-cols-7 button", { timeout: 5_000 })
await wait(600)

// Day 20 (2026-11-20) has demo shifts — tap to open detail sheet
// Using has() to find the button that wraps the "20" day span
const day20 = page.locator(".grid.grid-cols-7 button").filter({ hasText: "20" }).first()
await day20.click()
// Wait for sheet animation
await wait(1000)
// Close via backdrop tap (above the sheet, below the chip bar)
await page.mouse.click(195, 250)
await wait(700)

// ─── Scene 7: List view (Now separator) ──────────────────────────────────────
console.log("[7/7] List (Now separator)")
await clickChip("List")
// "Now" separator appears when there are upcoming shifts (demo data has them)
await page.waitForSelector("text=Now", { timeout: 5_000 }).catch(() => {
  console.warn("  'Now' separator not found — continuing anyway")
})
await wait(1000)

// ─── Finalise recording ───────────────────────────────────────────────────────
await context.close()
await browser.close()
console.log("Recording saved.")

// ─── ffmpeg: WebM → GIF ───────────────────────────────────────────────────────
const webms = readdirSync(FRAMES_DIR).filter(f => f.endsWith(".webm")).sort()
if (!webms.length) {
  console.error("No WebM file found in", FRAMES_DIR)
  process.exit(1)
}
const webm = path.join(FRAMES_DIR, webms.at(-1))
const palette = path.join(FRAMES_DIR, "palette.png")
const gifOut = path.join(PUBLIC_UPDATE, "3-0-0-walkthrough.gif")
const mp4Out = path.join(PUBLIC_UPDATE, "3-0-0-walkthrough.mp4")

console.log("Converting to GIF …")
// -update 1: overwrite same file each frame so palettegen accumulates all frames into one PNG
execSync(
  `${FFMPEG} -y -i "${webm}" -vf "fps=12,scale=640:-1:flags=lanczos,palettegen" -update 1 "${palette}"`,
  { stdio: "inherit" }
)
// -loop 0 = infinite loop via GIF muxer (paletteuse no longer has a loop option)
execSync(
  `${FFMPEG} -y -i "${webm}" -i "${palette}" -filter_complex "fps=12,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" -loop 0 "${gifOut}"`,
  { stdio: "inherit" }
)

const gifMB = (statSync(gifOut).size / 1024 / 1024).toFixed(1)
console.log(`GIF: ${gifOut} (${gifMB} MB)`)

if (statSync(gifOut).size > 3 * 1024 * 1024) {
  console.log("GIF > 3 MB, producing MP4 fallback …")
  execSync(
    `${FFMPEG} -y -i "${webm}" -c:v libx264 -preset fast -crf 22 -vf "scale=640:-2" -an -movflags +faststart "${mp4Out}"`,
    { stdio: "inherit" }
  )
  const mp4MB = (statSync(mp4Out).size / 1024 / 1024).toFixed(1)
  console.log(`MP4: ${mp4Out} (${mp4MB} MB)`)
  console.log("\nUse MP4 for embedding (GIF exceeded 3 MB).")
} else {
  console.log("\nGIF is under 3 MB — ready for embedding.")
}
