"use client"

import { useRef } from "react"
import { useT } from "../LangProvider"
import styles from "./ProductPreview.module.css"

// Static demo figures for the mock preview card (not real data).
// shortcut: fixed display format; a locale-aware number format is unnecessary for a mockup.
const BARS = [55, 72, 40, 88, 63, 78, 48]

/** Glassy mini app-preview card with a subtle 3D tilt on pointer move (desktop). */
export default function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const rx = ((e.clientY - (r.top + r.height / 2)) / r.height) * -8
    const ry = ((e.clientX - (r.left + r.width / 2)) / r.width) * 8
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
  }

  const reset = () => {
    const el = ref.current
    if (el) el.style.transform = ""
  }

  return (
    <div
      ref={ref}
      className={`${styles.card} sf-glass`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      aria-hidden="true"
    >
      <div className={styles.head}>
        <span className={styles.month}>{t("PREVIEW_MONAT")}</span>
        <span className={styles.dot} />
      </div>

      <div>
        <span className={`${styles.big} nums`}>42,5</span>
        <span className={styles.unit}>h</span>
        <div className={styles.label}>{t("PREVIEW_STUNDEN")}</div>
      </div>

      <div className={styles.bars}>
        {BARS.map((h, i) => (
          <div key={i} className={styles.bar} style={{ height: `${h}%` }} />
        ))}
      </div>

      <div className={styles.total}>
        <span className={styles.totalLabel}>{t("PREVIEW_GESAMT")}</span>
        <span className={`${styles.totalValue} nums`}>487,50 €</span>
      </div>
    </div>
  )
}
