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

export default function LandingPage() {
  const t = useT()

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
        <AuroraBackground parallax />
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
          <Feature icon={<ClockIcon />} titelKey="LANDING_F1_TITEL" textKey="LANDING_F1_TEXT" />
          <Feature icon={<CalcIcon />} titelKey="LANDING_F2_TITEL" textKey="LANDING_F2_TEXT" />
          <Feature icon={<DocIcon />} titelKey="LANDING_F3_TITEL" textKey="LANDING_F3_TEXT" />
          <Feature icon={<CalendarIcon />} titelKey="LANDING_F4_TITEL" textKey="LANDING_F4_TEXT" />
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

/** Scroll-reveal feature card; static immediately under reduced motion (CSS). */
function Feature({
  icon,
  titelKey,
  textKey,
}: {
  icon: ReactNode
  titelKey: keyof UiStrings
  textKey: keyof UiStrings
}) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <article ref={ref} className={`${s.feature} sf-glass${visible ? ` ${s.featureVisible}` : ""}`}>
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
