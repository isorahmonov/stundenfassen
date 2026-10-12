#!/usr/bin/env node
// Measures scroll frame timing at 1440×900 on the landing page.
// Usage: node scripts/scroll-perf.mjs http://localhost:3103 [http://localhost:3104]
import { chromium } from '../node_modules/playwright/index.mjs'

const VIEWPORT = { width: 1440, height: 900 }
const SCROLL_MS = 5000

async function measureScroll(url) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: VIEWPORT })
  await page.goto(url, { waitUntil: 'networkidle' })

  // Inject RAF-based frame timer then scroll
  const frames = await page.evaluate(async (scrollMs) => {
    const intervals = []
    let last = performance.now()
    let running = true

    const raf = () => {
      if (!running) return
      const now = performance.now()
      intervals.push(now - last)
      last = now
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Smooth scroll through the entire page
    const totalHeight = document.body.scrollHeight - window.innerHeight
    const start = performance.now()
    await new Promise(resolve => {
      const step = () => {
        const elapsed = performance.now() - start
        if (elapsed >= scrollMs) { running = false; resolve(); return }
        window.scrollTo(0, (elapsed / scrollMs) * totalHeight)
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })

    return intervals.slice(2) // skip first 2 (warmup)
  }, SCROLL_MS)

  await browser.close()

  frames.sort((a, b) => a - b)
  const median = frames[Math.floor(frames.length * 0.5)]
  const p95 = frames[Math.floor(frames.length * 0.95)]
  const over = frames.filter(f => f > 16.7).length
  const pct = ((over / frames.length) * 100).toFixed(1)

  return { median: median.toFixed(2), p95: p95.toFixed(2), over, pct, total: frames.length }
}

const after = process.argv[2] ?? 'http://localhost:3103'
const before = process.argv[3]

console.log(`\nMeasuring "After"  ${after} …`)
const afterResult = await measureScroll(after)

let beforeResult = null
if (before) {
  console.log(`Measuring "Before" ${before} …`)
  beforeResult = await measureScroll(before)
}

console.log('\n┌───────────────┬─────────────┬───────────────┬──────────────────────┐')
console.log('│ Version       │ Median (ms) │    p95 (ms)   │ Frames > 16.7ms      │')
console.log('├───────────────┼─────────────┼───────────────┼──────────────────────┤')
if (beforeResult) {
  console.log(`│ Before        │ ${String(beforeResult.median).padStart(11)} │ ${String(beforeResult.p95).padStart(13)} │ ${String(beforeResult.over).padStart(4)} / ${String(beforeResult.total).padEnd(5)} (${beforeResult.pct}%)   │`)
}
console.log(`│ After         │ ${String(afterResult.median).padStart(11)} │ ${String(afterResult.p95).padStart(13)} │ ${String(afterResult.over).padStart(4)} / ${String(afterResult.total).padEnd(5)} (${afterResult.pct}%)   │`)
if (beforeResult) {
  const dMedian = (parseFloat(beforeResult.median) - parseFloat(afterResult.median)).toFixed(2)
  const dP95 = (parseFloat(beforeResult.p95) - parseFloat(afterResult.p95)).toFixed(2)
  const sign = (n) => n > 0 ? `−${Math.abs(n).toFixed(2)}` : n < 0 ? `+${Math.abs(n).toFixed(2)}` : '0.00'
  console.log(`│ Δ (−=better)  │ ${sign(parseFloat(dMedian)).padStart(11)} │ ${sign(parseFloat(dP95)).padStart(13)} │                      │`)
}
console.log('└───────────────┴─────────────┴───────────────┴──────────────────────┘')
