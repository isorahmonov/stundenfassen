"use client"

import { ShiftslotLogo } from "./ShiftslotLogo"
import s from "./ShiftslotLoader.module.css"

const SIZE: Record<"sm" | "md" | "lg", number> = { sm: 16, md: 24, lg: 40 }

interface Props {
  size?: "sm" | "md" | "lg"
  label?: string
}

export function ShiftslotLoader({ size = "md", label }: Props) {
  return (
    <span role="status" className={s.loader}>
      <span className={s.spinning} aria-hidden="true">
        <ShiftslotLogo size={SIZE[size]} mode="mark" />
      </span>
      {label ? (
        <span className={s.label}>{label}</span>
      ) : (
        <span className={s.srOnly}>Lädt…</span>
      )}
    </span>
  )
}
