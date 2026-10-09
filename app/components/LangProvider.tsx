"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type Locale,
  type UiStrings,
  DEFAULT_LOCALE,
  translations,
  detectLocale,
} from "@/lib/i18n"

interface LangCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof UiStrings) => string
}

const LangContext = createContext<LangCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translations[DEFAULT_LOCALE][key],
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const detected = detectLocale()
    setLocaleState(detected)
    document.documentElement.lang = detected
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    try { localStorage.setItem("sf_lang", l) } catch { /* ignore */ }
    document.documentElement.lang = l
  }

  return (
    <LangContext.Provider value={{ locale, setLocale, t: (key) => translations[locale][key] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export function useT() {
  return useContext(LangContext).t
}
