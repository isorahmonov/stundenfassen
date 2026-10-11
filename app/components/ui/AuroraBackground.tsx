"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./AuroraBackground.module.css"

/**
 * Drifting gradient blobs + light grain behind landing/login content.
 * Static under prefers-reduced-motion (handled in CSS). Optional mouse
 * parallax on fine-pointer (desktop) devices only.
 */
export default function AuroraBackground({ parallax = false }: { parallax?: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!parallax) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduced) return

    const layer = layerRef.current
    if (!layer) return

    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      layer.style.transform = `translate(${x * 18}px, ${y * 18}px)`
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [parallax])

  return (
    <div className={`${styles.root}${active ? ` ${styles.active}` : ""}`} aria-hidden="true">
      <div ref={layerRef} className={styles.layer}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>
      <div className={styles.grain} />
    </div>
  )
}
