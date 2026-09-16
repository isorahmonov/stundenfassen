"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"/>
        <path d="M8 20v-8h6v8"/>
      </svg>
    ),
  },
  {
    href: "/verfuegbarkeit",
    label: "Kalender",
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
    href: "/schichten",
    label: "Schichten",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8"/>
        <path d="M11 7v4l3 2"/>
      </svg>
    ),
  },
  {
    href: "/statistik",
    label: "Statistik",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="12" width="4" height="7" rx="1" fill="currentColor" stroke="none"/>
        <rect x="9" y="7" width="4" height="12" rx="1" fill="currentColor" stroke="none"/>
        <rect x="15" y="4" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
] as const

export function TabBar() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-t border-stone-200 dark:border-neutral-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const aktiv = tab.href === "/" ? path === "/" : path.startsWith(tab.href)
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
              {tab.icon}
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
