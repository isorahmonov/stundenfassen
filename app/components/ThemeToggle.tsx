"use client"

import { useTheme, type Theme } from "./ThemeProvider"
import s from "./ThemeToggle.module.css"

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto"   },
  { value: "light",  label: "Hell"   },
  { value: "dark",   label: "Dunkel" },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className={[s.segmented, className].filter(Boolean).join(" ")}
      role="group"
      aria-label="Farbschema"
    >
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          className={`${s.segment}${theme === o.value ? ` ${s.active}` : ""}`}
          onClick={() => setTheme(o.value)}
          aria-pressed={theme === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
