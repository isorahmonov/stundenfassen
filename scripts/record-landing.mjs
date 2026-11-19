#!/usr/bin/env node
/**
 * record-landing.mjs  —  ungeschnittene Aufnahme der öffentlichen Landingpage.
 *
 * Usage:
 *   node scripts/record-landing.mjs
 *
 * Zwei Läufe, jeweils ein durchgehender Take:
 *   Startseite 2 s stehen → langsam nach unten scrollen, vor jedem Abschnitt 1 s
 *   anhalten → am Ende 2 s stehen.
 *
 * Outputs (out/ ist gitignored):
 *   out/landing-1920x1080.mp4   + out/landing-chapters-1920x1080.json
 *   out/landing-1080x1920.mp4   + out/landing-chapters-1080x1920.json
 *   out/raw/*.webm              (Playwright-Rohaufnahme inkl. Ladephase)
 *
 * Das MP4 beginnt beim ersten Kapitel (Startseite fertig geladen); der Vorlauf mit
 * Leerbild/Ladespinner wird abgeschnitten. Kapitelzeiten beziehen sich auf das MP4.
 *
 * Env vars:
 *   BASE_URL    — default https://shiftslot.dnshome.eu
 *   PW_PATH     — Pfad zu playwright (default: require.resolve("playwright"))
 *   PW_CHANNEL  — z.B. "chrome" für installiertes Google Chrome (default: Playwright-Chromium)
 *   SCROLL_PXS  — Scrollgeschwindigkeit in px/s, default 70
 *   FFMPEG      — ffmpeg binary, default "ffmpeg"
 *
 * Hinweis Hochformat: AuthGate zeigt die Landingpage nur ab (min-width: 1024px),
 * darunter kommt der Login. Deshalb 1080×1920 bei deviceScaleFactor 1, nicht 540×960 @2x.
 */

import { mkdirSync, renameSync, writeFileSync, existsSync } from "fs"
import { execFileSync } from "child_process"
import { createRequire } from "module"
import path from "path"
import { fileURLToPath } from "url"

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dir, "..")
const OUT = path.join(ROOT, "out")
const RAW = path.join(OUT, "raw")
mkdirSync(RAW, { recursive: true })

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PW_PATH ?? "playwright")

const BASE = process.env.BASE_URL ?? "https://shiftslot.dnshome.eu"
const FFMPEG = process.env.FFMPEG ?? "ffmpeg"
const SCROLL_PXS = Number(process.env.SCROLL_PXS ?? 70)

const LAEUFE = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1080x1920", width: 1080, height: 1920 },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Ein Lauf ─────────────────────────────────────────────────────────────────
async function aufnehmen(browser, lauf) {
  const context = await browser.newContext({
    viewport: { width: lauf.width, height: lauf.height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    recordVideo: { dir: RAW, size: { width: lauf.width, height: lauf.height } },
  })

  // Die Videoaufnahme beginnt mit dem Erzeugen der Seite → t0 als Zeitbasis
  const t0 = Date.now()
  const page = await context.newPage()
  const kapitel = []
  const sekunden = () => Math.round((Date.now() - t0) / 10) / 100
  await page.exposeFunction("__kapitel", (name) => {
    kapitel.push({ t: sekunden(), name })
  })

  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.locator("h1").first().waitFor({ state: "visible" })
  // AuthGate-Overlay ausblenden lassen, Fonts laden
  await page.evaluate(() => document.fonts.ready)
  await sleep(1500)

  // Abschnitte: header/section/footer plus h2/h3, sortiert nach Position
  await page.evaluate(async ({ pxs }) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    document.documentElement.style.scrollBehavior = "auto"
    window.scrollTo(0, 0)

    const nav = document.querySelector("nav")
    const navHoehe = nav ? nav.getBoundingClientRect().height : 0
    const maxY = document.documentElement.scrollHeight - window.innerHeight

    const name = (el) => {
      const h = el.matches("h1,h2,h3") ? el : el.querySelector("h1,h2,h3")
      const text = (h ?? el).textContent.trim().replace(/\s+/g, " ")
      return text.slice(0, 80) || el.tagName.toLowerCase()
    }
    const ziele = [...document.querySelectorAll("header, section, footer, h2, h3")]
      .map((el) => ({
        name: name(el),
        y: Math.min(maxY, Math.max(0, el.getBoundingClientRect().top + window.scrollY - navHoehe - 24)),
      }))
      .sort((a, b) => a.y - b.y)
      // Ziele, die (fast) an derselben Stelle liegen, zusammenfassen
      .filter((z, i, arr) => i === 0 || z.y - arr[i - 1].y > 80)

    // 1. Startseite stehen lassen
    window.__kapitel(ziele[0]?.y === 0 ? ziele[0].name : "Start")
    await sleep(2000)

    // 2./3. Glatt scrollen, vor jedem Abschnitt 1 s anhalten
    let y = 0
    for (const ziel of ziele) {
      if (ziel.y <= y) continue
      let letzte = performance.now()
      while (y < ziel.y) {
        await frame()
        const jetzt = performance.now()
        y = Math.min(ziel.y, y + ((jetzt - letzte) / 1000) * pxs)
        letzte = jetzt
        window.scrollTo(0, y)
      }
      window.__kapitel(ziel.name)
      await sleep(1000)
    }
    // Rest bis ganz unten
    let letzte = performance.now()
    while (y < maxY) {
      await frame()
      const jetzt = performance.now()
      y = Math.min(maxY, y + ((jetzt - letzte) / 1000) * pxs)
      letzte = jetzt
      window.scrollTo(0, y)
    }

    // 4. Ende stehen lassen
    window.__kapitel("Ende")
    await sleep(2000)
  }, { pxs: SCROLL_PXS })

  const video = page.video()
  await context.close()
  const webm = path.join(RAW, `landing-${lauf.name}.webm`)
  renameSync(await video.path(), webm)

  // Zeitbasis auf das erste Kapitel verschieben (= Anfang des MP4)
  const start = kapitel[0]?.t ?? 0
  const kapitelImMp4 = kapitel.map((k) => ({ t: Math.round((k.t - start) * 100) / 100, name: k.name }))
  writeFileSync(
    path.join(OUT, `landing-chapters-${lauf.name}.json`),
    JSON.stringify({ url: BASE, viewport: lauf.name, vorlaufWebm: start, kapitel: kapitelImMp4 }, null, 2) + "\n",
  )
  return { webm, start }
}

// ─── webm → MP4 (H.264, crf 18, 30 fps) ──────────────────────────────────────
function umwandeln({ webm, start }, lauf) {
  const mp4 = path.join(OUT, `landing-${lauf.name}.mp4`)
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error",
    "-i", webm, "-ss", String(start),
    "-vf", "fps=30",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-an", mp4,
  ], { stdio: "inherit" })
  return mp4
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
try {
  for (const lauf of LAEUFE) {
    console.log(`▶ ${lauf.name}: ${BASE}`)
    const aufnahme = await aufnehmen(browser, lauf)
    const mp4 = umwandeln(aufnahme, lauf)
    console.log(`  ✓ ${path.relative(ROOT, mp4)}${existsSync(mp4) ? "" : " (fehlt!)"}`)
  }
} finally {
  await browser.close()
}
