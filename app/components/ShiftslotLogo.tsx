"use client"

import { useId } from "react"
import { APP_NAME } from "@/lib/brand"
import s from "./ShiftslotLogo.module.css"

interface ShiftslotLogoProps {
  /** Height in px; width is derived from the mark's aspect ratio. */
  size?: number
  /** "mark" = icon only; "wordmark" = icon + "Shiftslot" text side by side. */
  mode?: "mark" | "wordmark"
  className?: string
  style?: React.CSSProperties
}

export function ShiftslotLogo({
  size = 40,
  mode = "mark",
  className,
  style,
}: ShiftslotLogoProps) {
  const uid = useId().replace(/:/g, "")

  // Unique gradient IDs so multiple instances on one page don't clash
  const gA  = `${uid}gA`
  const bA  = `${uid}bA`
  const b2A = `${uid}b2A`
  const oA  = `${uid}oA`
  const gB  = `${uid}gB`
  const bB  = `${uid}bB`
  const b2B = `${uid}b2B`
  const oB  = `${uid}oB`

  // viewBox covers the symbol area: x=202–1024, y=204–820 (822×616 px in the 1024 space)
  const markW = Math.round(size * (822 / 616))

  const mark = (
    <svg
      viewBox="202 204 822 616"
      width={markW}
      height={size}
      overflow="hidden"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Dark-theme gradients */}
        <linearGradient id={gA} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4DF4A2" />
          <stop offset="100%" stopColor="#17CB7B" />
        </linearGradient>
        <linearGradient id={bA} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5ACFFF" />
          <stop offset="100%" stopColor="#28ADF2" />
        </linearGradient>
        <linearGradient id={b2A} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#46B2EE" />
          <stop offset="100%" stopColor="#1D8AD6" />
        </linearGradient>
        <linearGradient id={oA} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFB85A" />
          <stop offset="100%" stopColor="#FF6E18" />
        </linearGradient>

        {/* Light-theme gradients */}
        <linearGradient id={gB} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#27D478" />
          <stop offset="100%" stopColor="#14A456" />
        </linearGradient>
        <linearGradient id={bB} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4291FF" />
          <stop offset="100%" stopColor="#1A60DC" />
        </linearGradient>
        <linearGradient id={b2B} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#62AAFF" />
          <stop offset="100%" stopColor="#2E7AEE" />
        </linearGradient>
        <linearGradient id={oB} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FF9A2E" />
          <stop offset="100%" stopColor="#E25700" />
        </linearGradient>
      </defs>

      {/* Dark theme bars */}
      <g className={s.dark}>
        <rect x="202" y="204" width="620" height="130" rx="65" fill={`url(#${gA})`} />
        <rect x="202" y="366" width="620" height="130" rx="65" fill={`url(#${bA})`} />
        <rect x="202" y="528" width="620" height="130" rx="65"
          fill="none" stroke="#6E9ED8" strokeWidth="8" strokeDasharray="20 11" opacity="0.65" />
        <rect x="202" y="690" width="620" height="130" rx="65" fill={`url(#${b2A})`} />
        <rect x="862" y="528" width="300" height="130" rx="65" fill={`url(#${oA})`} />
      </g>

      {/* Light theme bars */}
      <g className={s.light}>
        <rect x="202" y="204" width="620" height="130" rx="65" fill={`url(#${gB})`} />
        <rect x="202" y="366" width="620" height="130" rx="65" fill={`url(#${bB})`} />
        <rect x="202" y="528" width="620" height="130" rx="65"
          fill="none" stroke="#90AFC8" strokeWidth="9" strokeDasharray="20 11" />
        <rect x="202" y="690" width="620" height="130" rx="65" fill={`url(#${b2B})`} />
        <rect x="862" y="528" width="300" height="130" rx="65" fill={`url(#${oB})`} />
      </g>
    </svg>
  )

  if (mode === "wordmark") {
    return (
      <div className={`${s.wordmark} ${className ?? ""}`} style={style}>
        {mark}
        <span className={s.wordmarkText}>{APP_NAME}</span>
      </div>
    )
  }

  return (
    <span className={className} style={{ display: "inline-flex", ...style }}>
      {mark}
    </span>
  )
}
