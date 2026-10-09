"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

export type Theme = "system" | "light" | "dark"

interface ThemeCtx {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({ theme: "system", setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer reads localStorage on the client so React state is correct
  // from the very first render — avoids setState-in-effect and hydration mismatch.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    try {
      const v = localStorage.getItem("sf_theme")
      if (v === "light" || v === "dark" || v === "system") return v
    } catch {}
    return "system"
  })

  const applyTheme = useCallback((t: Theme) => {
    const dark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-managed]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.dataset.managed = "1"
      document.head.appendChild(meta)
    }
    meta.content = dark ? "#111111" : "#ffffff"
  }, [])

  // Mount: sync data-theme DOM attribute with initial state (FOUC script already set it,
  // this is a safety sync in case the script didn't run).
  useEffect(() => {
    applyTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount only

  // System preference listener (active when theme === "system")
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => { if (theme === "system") applyTheme("system") }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme, applyTheme])

  // Firestore: read remote preference on login
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "default"))
        const remote = snap.data()?.theme
        if (remote === "light" || remote === "dark" || remote === "system") {
          setThemeState(remote)
          applyTheme(remote)
          try { localStorage.setItem("sf_theme", remote) } catch {}
        }
      } catch {}
    })
  }, [applyTheme])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      applyTheme(t)
      try { localStorage.setItem("sf_theme", t) } catch {}
      const user = auth.currentUser
      if (user) {
        setDoc(
          doc(db, "users", user.uid, "settings", "default"),
          { theme: t },
          { merge: true },
        ).catch(() => {})
      }
    },
    [applyTheme],
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
