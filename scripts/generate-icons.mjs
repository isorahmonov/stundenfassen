/**
 * Generates all PWA + Instagram PNG icons from the SVG source files.
 * Requires: node scripts/generate-icons.mjs
 * Output: public/icons/*.png  and  design/icon/instagram-*.png
 */

import { chromium } from "../node_modules/playwright/index.mjs"
import { readFileSync, copyFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")
const ICONS_DIR = join(ROOT, "public", "icons")
const DESIGN_DIR = join(ROOT, "design", "icon")

mkdirSync(ICONS_DIR, { recursive: true })

function html(svgContent, w, h, { circle = false } = {}) {
  const img = `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}" width="${w}" height="${h}" style="display:block;" />`
  const bodyStyle = `width:${w}px;height:${h}px;overflow:hidden;background:transparent;margin:0;padding:0;`
  const wrapOpen  = circle ? `<div style="width:${w}px;height:${h}px;border-radius:50%;overflow:hidden;">` : ""
  const wrapClose = circle ? `</div>` : ""
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;}html,body{${bodyStyle}}</style></head><body>${wrapOpen}${img}${wrapClose}</body></html>`
}

async function render(page, svgPath, outPath, w, h, opts = {}) {
  const svg = readFileSync(svgPath, "utf8")
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(html(svg, w, h, opts), { waitUntil: "load" })
  await page.screenshot({ path: outPath, omitBackground: opts.circle ?? false })
  console.log(`✓  ${outPath.replace(ROOT + "/", "")}`)
}

async function run() {
  const browser = await chromium.launch()
  const page = await (await browser.newContext()).newPage()

  const svgA = join(DESIGN_DIR, "icon-A.svg")
  const svgB = join(DESIGN_DIR, "icon-B.svg")

  // ── PWA icons: all use icon-A (dark bg, works on every homescreen) ──
  await render(page, svgA, join(ICONS_DIR, "apple-touch-icon.png"),   180,  180)
  await render(page, svgA, join(ICONS_DIR, "icon-192.png"),           192,  192)
  await render(page, svgA, join(ICONS_DIR, "icon-512.png"),           512,  512)
  await render(page, svgA, join(ICONS_DIR, "icon-512-maskable.png"),  512,  512)

  // ── Instagram profile images: 1080×1080, symbol centred ~60 % ──────
  // Full-bleed square (Instagram crops to circle in-app)
  await render(page, svgA, join(DESIGN_DIR, "instagram-profile-A.png"), 1080, 1080)
  await render(page, svgB, join(DESIGN_DIR, "instagram-profile-B.png"), 1080, 1080)

  // Circle-crop previews (transparent PNG, 400 px)
  await render(page, svgA, join(DESIGN_DIR, "instagram-circle-A.png"), 400, 400, { circle: true })
  await render(page, svgB, join(DESIGN_DIR, "instagram-circle-B.png"), 400, 400, { circle: true })

  // ── Favicon SVGs: copy into public/ for <link> tags ────────────────
  copyFileSync(svgA, join(ROOT, "public", "favicon-dark.svg"))
  copyFileSync(svgB, join(ROOT, "public", "favicon-light.svg"))
  console.log("✓  public/favicon-dark.svg")
  console.log("✓  public/favicon-light.svg")

  await browser.close()
  console.log("\nAll icons generated.")
}

run().catch(e => { console.error(e); process.exit(1) })
