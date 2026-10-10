"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { TabBar } from "./TabBar"
import { ShiftslotLoader } from "./ShiftslotLoader"
import LoginView from "./auth/LoginView"
import { useT } from "./LangProvider"

const OEFFENTLICHE_PFADE = ["/datenschutz", "/impressum"]

export function AuthGate({ children }: { children: React.ReactNode }) {
  const t = useT()
  const [user, setUser] = useState<User | null>(null)
  const [laden, setLaden] = useState(true)
  const [authFehler, setAuthFehler] = useState(false)
  const pathname = usePathname()
  const istOeffentlich = OEFFENTLICHE_PFADE.includes(pathname)

  useEffect(() => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        setAuthFehler(true)
        setLaden(false)
      }
    }, 10_000)
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      settled = true
      clearTimeout(timer)
      setUser(u)
      setLaden(false)
    })
    return () => {
      settled = true
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  if (laden && !istOeffentlich) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center">
        <ShiftslotLoader size="lg" />
      </div>
    )
  }

  if (authFehler && !istOeffentlich) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center px-4">
        <div className="mx-auto max-w-sm w-full rounded-2xl bg-white dark:bg-neutral-900 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-red-600 dark:text-red-400 mb-5 leading-snug">
            {t("AUTH_LAEDT_FEHLER")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-stone-900 dark:bg-neutral-100 px-5 py-2 text-sm font-semibold text-white dark:text-neutral-900 active:scale-95 transition-all"
          >
            {t("AUTH_NEU_LADEN")}
          </button>
        </div>
      </div>
    )
  }

  if (!user && !istOeffentlich) {
    return <LoginView />
  }

  if (!user && istOeffentlich) {
    return <div className="min-h-screen sf-page">{children}</div>
  }

  return (
    <>
      {/* Abstand für die fixe Tab-Leiste unten */}
      <div className="pb-20">{children}</div>
      <TabBar />
    </>
  )
}
