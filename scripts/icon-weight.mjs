#!/usr/bin/env node
// Counts filled SVG pixels for Apple/Google/GitHub icon buttons at 3× dpr.
// Usage: node scripts/icon-weight.mjs [http://localhost:3000]
import { chromium } from '../node_modules/playwright/index.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dir, 'out')
fs.mkdirSync(OUT, { recursive: true })

const BASE = process.argv[2] ?? 'http://localhost:3000'
const SCALE = 3

async function measure(context, theme) {
  const page = await context.newPage()
  await page.addInitScript((t) => localStorage.setItem('sf_theme', t), theme)
  await page.goto(`${BASE}/anmelden`)
  await page.waitForSelector('[class*="iconBtnIcon"]', { timeout: 15000 })

  const results = await page.evaluate(async () => {
    function identifySvg(svg) {
      if (svg.innerHTML.includes('#4285F4')) return 'Google'
      const d = svg.querySelector('path')?.getAttribute('d') ?? ''
      return (d.match(/M/g) ?? []).length >= 2 ? 'Apple' : 'GitHub'
    }

    const wrappers = [...document.querySelectorAll('[class*="iconBtnIcon"]')]
    const out = []
    for (const wrapper of wrappers) {
      const svg = wrapper.querySelector('svg')
      if (!svg) continue

      const name = identifySvg(svg)
      const rect = svg.getBoundingClientRect()
      const dpr = window.devicePixelRatio
      const pw = Math.round(rect.width * dpr)
      const ph = Math.round(rect.height * dpr)

      const svgStr = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      const burl = URL.createObjectURL(blob)

      const canvas = document.createElement('canvas')
      canvas.width = pw
      canvas.height = ph
      const ctx = canvas.getContext('2d')

      const img = new Image(pw, ph)
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = burl })
      ctx.drawImage(img, 0, 0, pw, ph)
      URL.revokeObjectURL(burl)

      let filled = 0
      const data = ctx.getImageData(0, 0, pw, ph).data
      for (let i = 3; i < data.length; i += 4) if (data[i] > 10) filled++

      out.push({ name, filled, visW: rect.width, visH: rect.height, pw, ph })
    }
    return out
  })

  // Screenshot providers section at 3× resolution
  const bbox = await page.locator('[class*="providers"]').first().boundingBox()
  if (bbox) {
    const pad = 24
    await page.screenshot({
      path: path.join(OUT, `icon-weight-${theme}.png`),
      clip: {
        x: Math.max(0, bbox.x - pad),
        y: Math.max(0, bbox.y - pad),
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2,
      },
    })
  }

  await page.close()
  return results
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: SCALE,
})

const allResults = {}
for (const theme of ['light', 'dark']) {
  allResults[theme] = await measure(ctx, theme)
}
await browser.close()

console.log('\n┌─────────────────────────────────────────────────────┐')
console.log('│  Icon Visual Weight (filled px at 3× dpr)           │')
console.log('├──────────┬────────┬────────────┬────────────────────┤')
console.log('│ Icon     │  Light │   Dark     │ Apple/GitHub ratio │')
console.log('├──────────┼────────┼────────────┼────────────────────┤')

const icons = ['Apple', 'GitHub', 'Google']
const byTheme = {}
for (const theme of ['light', 'dark']) {
  byTheme[theme] = {}
  for (const r of allResults[theme]) byTheme[theme][r.name] = r
}

for (const name of icons) {
  const l = byTheme.light[name]
  const d = byTheme.dark[name]
  const lf = l?.filled ?? 0
  const df = d?.filled ?? 0
  const gh_l = byTheme.light.GitHub?.filled ?? 1
  const ratio = name === 'Apple' ? ` ${(lf / gh_l).toFixed(3)}` : '     —'
  console.log(`│ ${name.padEnd(8)} │ ${String(lf).padStart(6)} │ ${String(df).padStart(10)} │${ratio.padStart(20)} │`)
}
console.log('└──────────┴────────┴────────────┴────────────────────┘')

const apple = byTheme.light.Apple
const github = byTheme.light.GitHub
if (apple && github) {
  const ratio = apple.filled / github.filled
  const ok = ratio <= 1.15
  console.log(`\nApple SVG: ${apple.visW}×${apple.visH} css-px → ${apple.pw}×${apple.ph} device-px`)
  console.log(`GitHub SVG: ${github.visW}×${github.visH} css-px → ${github.pw}×${github.ph} device-px`)
  console.log(`\nRatio: ${ratio.toFixed(4)}  Target: ≤ 1.15  ${ok ? '✓ PASS' : '✗ FAIL — adjust Apple size'}`)
}

console.log('\nScreenshots written to scripts/out/')
