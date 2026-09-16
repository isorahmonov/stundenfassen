"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged, signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase/client"
import { TabBar } from "./TabBar"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLaden(false)
    })
    return unsubscribe
  }, [])

  async function handleGoogleLogin() {
    setFehler("")
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e)
      setFehler(msg)
    }
  }

  if (laden) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center">
        <span className="text-sm text-stone-400 dark:text-neutral-500">Lade…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-neutral-100 mb-1">
              Stundenfassen
            </h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400">
              Zeiterfassung für Studentenjobs
            </p>
          </div>

          <div className="sf-card rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]">
            {fehler && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">
                {fehler}
              </p>
            )}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-sm font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-750 active:scale-[.99] transition-all"
            >
              <GoogleIcon />
              Mit Google anmelden
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Abstand für die fixe Tab-Leiste unten */}
      <div className="pb-20">{children}</div>
      <TabBar />
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
