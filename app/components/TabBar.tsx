"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useT } from "./LangProvider"
import { sollSlotsNeuZeigen, SLOTS_NEU_LS_KEY, SLOTS_NEU_SEIT_LS_KEY } from "@/lib/hinweise"
import type { UiStrings } from "@/lib/i18n"

const TABS: { href: string; labelKey: keyof UiStrings; icon: React.ReactNode }[] = [
  {
    href: "/",
    labelKey: "TAB_HOME",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"/>
        <path d="M8 20v-8h6v8"/>
      </svg>
    ),
  },
  {
    href: "/verfuegbarkeit",
    labelKey: "TAB_SLOTS",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="16" height="16" rx="2"/>
        <path d="M16 2v4M6 2v4M3 9h16"/>
        <rect x="7" y="13" width="2" height="2" rx=".5" fill="currentColor" stroke="none"/>
        <rect x="11" y="13" width="2" height="2" rx=".5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: "/kalender",
    labelKey: "TAB_KALENDER",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="16" height="16" rx="2"/>
        <path d="M16 2v4M6 2v4M3 9h16"/>
        <path d="M7 13h8M7 17h5"/>
      </svg>
    ),
  },
  {
    href: "/schichten",
    labelKey: "TAB_SCHICHTEN",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8"/>
        <path d="M11 7v4l3 2"/>
      </svg>
    ),
  },
  {
    href: "/profil",
    labelKey: "TAB_PROFIL",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="8" r="4"/>
        <path d="M3 21c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
      </svg>
    ),
  },
]

export function TabBar() {
  const path = usePathname()
  const t = useT()
  const [neuDotVisible, setNeuDotVisible] = useState(false)

  useEffect(() => {
    const gesehen = localStorage.getItem(SLOTS_NEU_LS_KEY) === "1"
    const seitRaw = localStorage.getItem(SLOTS_NEU_SEIT_LS_KEY)
    const slotsNeuSeit = seitRaw ? Number(seitRaw) : null
    setNeuDotVisible(sollSlotsNeuZeigen(gesehen, false, slotsNeuSeit))
  }, [])

  useEffect(() => {
    if (path === "/verfuegbarkeit" && neuDotVisible) {
      localStorage.setItem(SLOTS_NEU_LS_KEY, "1")
      setNeuDotVisible(false)
    }
  }, [path, neuDotVisible])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-t border-stone-200 dark:border-neutral-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const aktiv = tab.href === "/" ? path === "/" : path.startsWith(tab.href)
          const showDot = tab.href === "/verfuegbarkeit" && neuDotVisible
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-100 ${
                aktiv
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-400"
              }`}
              aria-current={aktiv ? "page" : undefined}
            >
              <div className="relative">
                {tab.icon}
                {showDot && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500"
                    aria-label={t("KAL_SLOTS_NEU_ARIA")}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">{t(tab.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
