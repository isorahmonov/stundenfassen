"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "firebase/auth"
import { onAuthStateChanged, signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase/client"
import { TabBar } from "./TabBar"
import { ThemeToggle } from "./ThemeToggle"
import { ShiftslotLogo } from "./ShiftslotLogo"
import { APP_NAME, APP_TAGLINE } from "@/lib/brand"
import s from "./AuthGate.module.css"

const OEFFENTLICHE_PFADE = ["/datenschutz", "/impressum"]

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [animSeen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try { return sessionStorage.getItem("sf_login_anim") === "1" } catch { return false }
  })
  const pathname = usePathname()
  const istOeffentlich = OEFFENTLICHE_PFADE.includes(pathname)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLaden(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem("sf_login_anim", "1") } catch {
      // ignore — PWA/private browsing
    }
  }, [])

  async function handleGoogleLogin() {
    setFehler("")
    setIsSigningIn(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e)
      setFehler(msg)
    } finally {
      setIsSigningIn(false)
    }
  }

  if (laden && !istOeffentlich) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center">
        <span className="text-sm text-stone-400 dark:text-neutral-500">Lade…</span>
      </div>
    )
  }

  if (!user && !istOeffentlich) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center px-4 relative">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className={`${s.loginWrap} ${animSeen ? s.animVerkuerzt : ""}`}>

          {/* Intro: logo + slot animation + app name */}
          <div className={s.introWrap}>
            <div className={`${s.logoMark} ${isSigningIn ? s.logoSpinning : ""}`}>
              <ShiftslotLogo size={72} mode="mark" />
            </div>
            <div className={s.slotWrap} aria-hidden="true">
              <div className={s.slotBar}>
                <div className={`${s.block} ${s.c1}`} />
                <div className={`${s.block} ${s.c2}`} />
                <div className={s.slotItem}>
                  <div className={s.slotGhost} />
                  <div className={s.flyBlock} />
                </div>
                <div className={`${s.block} ${s.c4}`} />
                <div className={`${s.block} ${s.c5}`} />
              </div>
            </div>

            <h1 className={s.appName}>{APP_NAME}</h1>
            <p className={s.tagline}>{APP_TAGLINE}</p>
          </div>

          {/* Login card */}
          <div className={s.loginCard}>
            <div className="sf-card rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]">
              {fehler && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">
                  {fehler}
                </p>
              )}
              <button
                onClick={handleGoogleLogin}
                className={`w-full flex items-center justify-center gap-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-sm font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-750 active:scale-[.99] transition-all ${s.loginBtn}`}
              >
                <GoogleIcon />
                Mit Google anmelden
              </button>
              <p className="text-xs text-stone-400 dark:text-neutral-500 text-center mt-4 leading-relaxed">
                Mit der Anmeldung akzeptierst du die{" "}
                <Link href="/datenschutz" className="underline hover:text-stone-600 dark:hover:text-neutral-300">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>

            <div className="flex justify-center mt-5">
              <LangSelector />
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <Link href="/datenschutz" className="text-xs text-stone-400 dark:text-neutral-500 hover:underline">
                Datenschutz
              </Link>
              <span className="text-xs text-stone-300 dark:text-neutral-600">·</span>
              <Link href="/impressum" className="text-xs text-stone-400 dark:text-neutral-500 hover:underline">
                Impressum
              </Link>
            </div>
          </div>

        </div>
      </div>
    )
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

function LangSelector() {
  const [lang, setLang] = useState<"de" | "en" | "ru">("de")
  return (
    <div className={s.langWrap} role="group" aria-label="Sprache">
      {(["de", "en", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={`${s.langBtn}${lang === l ? ` ${s.langActive}` : ""}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
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
