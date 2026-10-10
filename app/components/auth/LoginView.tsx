"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type AuthProvider,
} from "firebase/auth"
import {
  auth,
  googleProvider,
  githubProvider,
  appleProvider,
  AUTH_APPLE_ENABLED,
} from "@/lib/firebase/client"
import { mapAuthError } from "@/lib/auth/providers"
import { useLang, useT } from "../LangProvider"
import { useIsDesktop } from "../useIsDesktop"
import { ThemeToggle } from "../ThemeToggle"
import { ShiftslotLogo } from "../ShiftslotLogo"
import AuroraBackground from "../ui/AuroraBackground"
import { Button, ProviderButton } from "../ui/Button"
import ProductPreview from "./ProductPreview"
import { APP_NAME } from "@/lib/brand"
import { LOCALES, type Locale } from "@/lib/i18n"
import s from "./LoginView.module.css"

/** Hint-only strength score (0–3); Firebase enforces the real minimum server-side. */
function passwortStaerke(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return pw.length === 0 ? 0 : 1
  let score = 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 3) as 0 | 1 | 2 | 3
}

type Busy = null | "google" | "github" | "apple" | "email"

export default function LoginView() {
  const t = useT()
  const desktop = useIsDesktop()

  const [modus, setModus] = useState<"login" | "registrieren">("login")
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [busy, setBusy] = useState<Busy>(null)
  const [fehler, setFehler] = useState("")
  const [info, setInfo] = useState("")

  const [tabHidden, setTabHidden] = useState(false)
  useEffect(() => {
    const handler = () => setTabHidden(document.hidden)
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  async function mitAnbieter(key: Busy, provider: AuthProvider) {
    setFehler("")
    setInfo("")
    setBusy(key)
    try {
      await signInWithPopup(auth, provider)
      // On success AuthGate's onAuthStateChanged swaps to the app.
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ""
      if (code !== "auth/popup-closed-by-user") setFehler(t(mapAuthError(code)))
    } finally {
      setBusy(null)
    }
  }

  async function mitEmail(e: React.FormEvent) {
    e.preventDefault()
    setFehler("")
    setInfo("")
    if (modus === "registrieren" && passwort.length < 8) {
      setFehler(t("PW_MIN_HINWEIS"))
      return
    }
    setBusy("email")
    try {
      if (modus === "registrieren") {
        await createUserWithEmailAndPassword(auth, email, passwort)
      } else {
        await signInWithEmailAndPassword(auth, email, passwort)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      setFehler(t(mapAuthError(code)))
    } finally {
      setBusy(null)
    }
  }

  async function passwortVergessen() {
    setFehler("")
    setInfo("")
    if (!email) {
      setFehler(t("PW_RESET_EMAIL_FEHLT"))
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
    } catch {
      // Neutral: never reveal whether the address exists.
    }
    setInfo(t("PW_RESET_HINWEIS"))
  }

  const registrieren = modus === "registrieren"
  const staerke = passwortStaerke(passwort)
  const staerkeLabel =
    staerke <= 1 ? t("PW_STAERKE_SCHWACH") : staerke === 2 ? t("PW_STAERKE_MITTEL") : t("PW_STAERKE_STARK")

  const card = (
    <div className={s.loginWrap}>
      {/* Mobile-only branded intro (desktop shows the brand panel instead) */}
      {!desktop && (
        <div className={`${s.introWrap}${tabHidden ? ` ${s.animPaused}` : ""}`}>
          <div className={s.logoMark}>
            <ShiftslotLogo size={64} mode="mark" />
          </div>
          <h1 className={s.appName}>{APP_NAME}</h1>
          <p className={s.tagline}>{t("TAGLINE")}</p>
        </div>
      )}

      <div className={`${s.card} sf-glass`}>
        <h2 className={s.cardTitle}>
          {registrieren ? t("REGISTRIEREN_TITEL") : t("ANMELDEN_WILLKOMMEN")}
        </h2>
        <p className={s.cardSubtitle}>
          {registrieren ? t("REGISTRIEREN_UNTERTITEL") : t("ANMELDEN_UNTERTITEL")}
        </p>

        {fehler && <p className={s.error} role="alert">{fehler}</p>}
        {info && <p className={s.info} role="status">{info}</p>}

        <div className={s.providers}>
          <ProviderButton
            icon={<GoogleIcon />}
            loading={busy === "google"}
            disabled={busy !== null}
            onClick={() => mitAnbieter("google", googleProvider)}
          >
            {t("MIT_GOOGLE_ANMELDEN")}
          </ProviderButton>

          <ProviderButton
            icon={<AppleIcon />}
            loading={busy === "apple"}
            disabled={busy !== null || !AUTH_APPLE_ENABLED}
            title={AUTH_APPLE_ENABLED ? undefined : t("BALD_VERFUEGBAR")}
            onClick={() => AUTH_APPLE_ENABLED && mitAnbieter("apple", appleProvider)}
          >
            {AUTH_APPLE_ENABLED ? t("MIT_APPLE_ANMELDEN") : `${t("MIT_APPLE_ANMELDEN")} · ${t("BALD_VERFUEGBAR")}`}
          </ProviderButton>

          <ProviderButton
            icon={<GithubIcon />}
            loading={busy === "github"}
            disabled={busy !== null}
            onClick={() => mitAnbieter("github", githubProvider)}
          >
            {t("MIT_GITHUB_ANMELDEN")}
          </ProviderButton>
        </div>

        <div className={s.divider}>{t("ODER")}</div>

        <form className={s.form} onSubmit={mitEmail}>
          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="lv-email">{t("EMAIL_LABEL")}</label>
            <input
              id="lv-email"
              className={s.input}
              type="email"
              autoComplete="email"
              placeholder={t("EMAIL_PLATZHALTER")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="lv-pw">{t("PASSWORT_LABEL")}</label>
            <input
              id="lv-pw"
              className={s.input}
              type="password"
              autoComplete={registrieren ? "new-password" : "current-password"}
              placeholder={t("PASSWORT_PLATZHALTER")}
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              minLength={registrieren ? 8 : undefined}
              required
            />
            {registrieren && (
              <>
                <div className={s.strength} aria-hidden="true">
                  <div className={s.strengthTrack}>
                    <div className={`${s.strengthFill} ${staerke >= 3 ? s.s3 : staerke === 2 ? s.s2 : s.s1}`} />
                  </div>
                  <span className={s.strengthLabel}>{passwort ? staerkeLabel : ""}</span>
                </div>
                <span className={s.hint}>{t("PW_MIN_HINWEIS")}</span>
              </>
            )}
          </div>

          {!registrieren && (
            <div className={s.forgotRow}>
              <button type="button" className={s.linkBtn} onClick={passwortVergessen}>
                {t("PASSWORT_VERGESSEN")}
              </button>
            </div>
          )}

          <Button type="submit" loading={busy === "email"} disabled={busy !== null}>
            {registrieren ? t("KONTO_ERSTELLEN_AKTION") : t("ANMELDEN_AKTION")}
          </Button>
        </form>

        <p className={s.toggleRow}>
          {registrieren ? t("HABE_KONTO") : t("KEIN_KONTO")}{" "}
          <button
            type="button"
            className={s.linkBtn}
            onClick={() => { setModus(registrieren ? "login" : "registrieren"); setFehler(""); setInfo("") }}
          >
            {registrieren ? t("ZUM_ANMELDEN") : t("ZUM_REGISTRIEREN")}
          </button>
        </p>

        <p className={s.privacyNote}>
          {t("ANMELDUNG_ZUSTIMMUNG_PRAEFIX")}{" "}
          <Link href="/datenschutz">{t("DATENSCHUTZERKLAERUNG")}</Link>.
        </p>
      </div>

      <div className={s.footer}>
        <LangSelector />
        <div className={s.footerLinks}>
          <Link href="/datenschutz">{t("DATENSCHUTZ")}</Link>
          <span className={s.footerSep}>·</span>
          <Link href="/impressum">{t("IMPRESSUM")}</Link>
        </div>
      </div>
    </div>
  )

  if (desktop) {
    return (
      <div className={s.split}>
        <div className={s.topBar}><ThemeToggle /></div>
        <div className={s.brandPanel}>
          <AuroraBackground parallax />
          <div className={s.brandInner}>
            <ShiftslotLogo size={56} mode="mark" />
            <h1 className={s.brandName}>{APP_NAME}</h1>
            <p className={s.brandTagline}>{t("TAGLINE")}</p>
            <ProductPreview />
          </div>
        </div>
        <div className={s.cardPanel}>{card}</div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <AuroraBackground />
      <div className={s.topBar}><ThemeToggle /></div>
      {card}
    </div>
  )
}

function LangSelector() {
  const { locale, setLocale } = useLang()
  return (
    <div className={s.langWrap} role="group" aria-label="Language">
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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.22-1.12 3.02-.84.96-2.22 1.7-3.38 1.6-.14-1.12.42-2.3 1.1-3.02.78-.84 2.14-1.46 3.4-1.6zM20.5 17.1c-.6 1.38-.9 1.99-1.67 3.2-1.08 1.7-2.6 3.81-4.48 3.82-1.67.02-2.1-1.09-4.37-1.08-2.27.01-2.74 1.1-4.42 1.08-1.88-.02-3.32-1.93-4.4-3.62-3.02-4.74-3.34-10.3-1.47-13.26 1.33-2.1 3.43-3.33 5.4-3.33 2.01 0 3.27 1.1 4.93 1.1 1.61 0 2.59-1.1 4.92-1.1 1.76 0 3.62.96 4.95 2.62-4.35 2.38-3.64 8.58.08 9.57z"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/>
    </svg>
  )
}
