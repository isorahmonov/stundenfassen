"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useLang, useT } from "../LangProvider"
import { ThemeToggle } from "../ThemeToggle"
import { ShiftslotLogo } from "../ShiftslotLogo"
import AuroraBackground from "../ui/AuroraBackground"
import { Button } from "../ui/Button"
import ProductPreview from "../auth/ProductPreview"
import { APP_NAME } from "@/lib/brand"
import { LOCALES, type Locale, type UiStrings } from "@/lib/i18n"
import s from "./LandingPage.module.css"

const FEATURES = [
  { icon: <ClockIcon />, titelKey: "LANDING_F1_TITEL", textKey: "LANDING_F1_TEXT" },
  { icon: <CalcIcon />, titelKey: "LANDING_F2_TITEL", textKey: "LANDING_F2_TEXT" },
  { icon: <DocIcon />, titelKey: "LANDING_F3_TITEL", textKey: "LANDING_F3_TEXT" },
  { icon: <CalendarIcon />, titelKey: "LANDING_F4_TITEL", textKey: "LANDING_F4_TEXT" },
] as const

export default function LandingPage() {
  const t = useT()
  const [visibleFeatures, setVisibleFeatures] = useState(() => [false, false, false, false])
  const featureRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const i = featureRefs.current.indexOf(entry.target as HTMLElement)
          if (i >= 0) {
            setVisibleFeatures((v) => { const n = [...v]; n[i] = true; return n })
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.2 },
    )
    featureRefs.current.forEach((el) => { if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  return (
    <div className={s.root}>
      <nav className={`${s.nav} sf-glass`}>
        <div className={s.navInner}>
          <ShiftslotLogo size={30} mode="wordmark" />
          <div className={s.navRight}>
            <LangSelector />
            <ThemeToggle />
            <Link href="/anmelden" className={s.navLogin}>
              {t("ANMELDEN_AKTION")}
            </Link>
          </div>
        </div>
      </nav>

      <header className={s.hero}>
        <AuroraBackground parallax fixed />
        <div className={s.heroInner}>
          <div className={s.heroLogo}>
            <ShiftslotLogo size={88} mode="mark" />
          </div>
          <h1 className={s.heroTitle}>{t("LANDING_HERO_TITEL")}</h1>
          <p className={s.heroSub}>{t("LANDING_HERO_UNTERTITEL")}</p>
          <div className={s.heroCtas}>
            <Link href="/anmelden" className={s.ctaLink}>
              <Button variant="primary" magnetic>{t("LANDING_LOSLEGEN")}</Button>
            </Link>
            <Link href="/anmelden" className={s.ctaLink}>
              <Button variant="secondary">{t("ANMELDEN_AKTION")}</Button>
            </Link>
          </div>
          <div className={s.heroPreview}>
            <ProductPreview />
          </div>
        </div>
      </header>

      <section className={s.features}>
        <h2 className={s.featuresTitle}>{t("LANDING_FEATURES_TITEL")}</h2>
        <div className={s.featureGrid}>
          {FEATURES.map((f, i) => (
            <Feature
              key={i}
              icon={f.icon}
              titelKey={f.titelKey}
              textKey={f.textKey}
              visible={visibleFeatures[i]}
              onRef={(el) => { featureRefs.current[i] = el }}
            />
          ))}
        </div>
      </section>

      <footer className={s.footer}>
        <span className={s.footerBrand}>© {new Date().getFullYear()} {APP_NAME}</span>
        <div className={s.footerLinks}>
          <Link href="/datenschutz">{t("DATENSCHUTZ")}</Link>
          <span className={s.footerSep}>·</span>
          <Link href="/impressum">{t("IMPRESSUM")}</Link>
        </div>
        <div className={s.footerRight}>
          <LangSelector />
          <ThemeToggle />
        </div>
      </footer>
    </div>
  )
}

/** Scroll-reveal feature card; visibility driven by parent's shared IntersectionObserver. */
function Feature({
  icon,
  titelKey,
  textKey,
  visible,
  onRef,
}: {
  icon: ReactNode
  titelKey: keyof UiStrings
  textKey: keyof UiStrings
  visible: boolean
  onRef: (el: HTMLElement | null) => void
}) {
  const t = useT()
  return (
    <article ref={onRef} className={`${s.feature} sf-glass${visible ? ` ${s.featureVisible}` : ""}`}>
      <span className={s.featureIcon} aria-hidden="true">{icon}</span>
      <h3 className={s.featureTitle}>{t(titelKey)}</h3>
      <p className={s.featureText}>{t(textKey)}</p>
    </article>
  )
}

function LangSelector() {
  const { locale, setLocale } = useLang()
  const t = useT()
  return (
    <div className={s.langWrap} role="group" aria-label={t("SEKTION_SPRACHE")}>
      {(LOCALES as readonly Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          className={`${s.langBtn}${locale === l ? ` ${s.langActive}` : ""}`}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}
function CalcIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15v2" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}
