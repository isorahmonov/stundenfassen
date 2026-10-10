"use client"

import { useTheme, type Theme } from "./ThemeProvider"
import { useT } from "./LangProvider"
import s from "./ThemeToggle.module.css"

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 13.5h4M8 11.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const ICONS: Record<Theme, React.ReactNode> = {
  system: <MonitorIcon />,
  light:  <SunIcon />,
  dark:   <MoonIcon />,
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const t = useT()

  const OPTIONS: { value: Theme; label: string; ariaLabel: string }[] = [
    { value: "system", label: t("THEME_SYSTEM"), ariaLabel: t("THEME_SYSTEM_ARIA") },
    { value: "light",  label: t("THEME_LIGHT"),  ariaLabel: t("THEME_LIGHT_ARIA")  },
    { value: "dark",   label: t("THEME_DARK"),   ariaLabel: t("THEME_DARK_ARIA")   },
  ]

  return (
    <div
      className={[s.segmented, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={t("THEME_ARIA_LABEL")}
    >
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          className={`${s.segment}${theme === o.value ? ` ${s.active}` : ""}`}
          onClick={() => setTheme(o.value)}
          aria-pressed={theme === o.value}
          aria-label={o.ariaLabel}
        >
          <span className={s.icon}>{ICONS[o.value]}</span>
          <span className={s.label}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
