"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { User } from "firebase/auth"
import { sendEmailVerification, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { useT } from "../LangProvider"
import { ThemeToggle } from "../ThemeToggle"
import { ShiftslotLogo } from "../ShiftslotLogo"
import AuroraBackground from "../ui/AuroraBackground"
import { Button } from "../ui/Button"
import { APP_NAME } from "@/lib/brand"
import s from "./LoginView.module.css"

/**
 * Shown after `braucheVerifizierung(user)` — i.e. unverified password accounts.
 * Sends a verification mail on mount (server route with a Firebase-client
 * fallback), polls ~every 5 s so a user who clicked the link elsewhere enters
 * the app without refreshing, and offers a manual "I've verified" check.
 */
export default function VerifyEmailScreen({
  user,
  onVerified,
}: {
  user: User
  onVerified: () => void
}) {
  const t = useT()
  const [cooldown, setCooldown] = useState(0)
  const [info, setInfo] = useState("")
  const [fehler, setFehler] = useState("")
  const [pruefe, setPruefe] = useState(false)

  const erneutSenden = useCallback(async () => {
    setFehler("")
    setInfo("")
    setCooldown(60)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      // Route absent (pre-rollout) or it asked us to fall back → send client-side.
      const fallback = !res.ok || (await res.json().catch(() => ({})))?.fallback === true
      if (fallback) await sendEmailVerification(user)
      setInfo(t("VERIFY_ERNEUT_GESENDET"))
    } catch {
      // Neutral: try the client path, then always show the sent confirmation.
      try {
        await sendEmailVerification(user)
      } catch {
        /* ignore — never reveal details */
      }
      setInfo(t("VERIFY_ERNEUT_GESENDET"))
    }
  }, [user, t])

  // Send once on mount so the arrival copy ("we've sent a link") is always true.
  const gesendet = useRef(false)
  useEffect(() => {
    if (gesendet.current) return
    gesendet.current = true
    void erneutSenden()
  }, [erneutSenden])

  // Poll for verification done in another tab/device; stop on unmount.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await user.reload()
        if (user.emailVerified) {
          await user.getIdToken(true)
          onVerified()
        }
      } catch {
        /* transient — retry next tick */
      }
    }, 5000)
    return () => clearInterval(id)
  }, [user, onVerified])

  // Cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((sek) => sek - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function ichHabeBestaetigt() {
    setFehler("")
    setInfo("")
    setPruefe(true)
    try {
      await user.reload()
      if (user.emailVerified) {
        await user.getIdToken(true)
        onVerified()
        return
      }
      setFehler(t("VERIFY_NOCH_NICHT"))
    } catch {
      setFehler(t("VERIFY_NOCH_NICHT"))
    } finally {
      setPruefe(false)
    }
  }

  return (
    <div className={s.page}>
      <AuroraBackground />
      <div className={s.topBar}><ThemeToggle /></div>
      <div className={s.loginWrap}>
        <div className={`${s.card} sf-glass`}>
          <div className={s.logoMark}>
            <ShiftslotLogo size={56} mode="mark" />
          </div>
          <h1 className={s.cardTitle}>{t("VERIFY_TITEL")}</h1>
          <p className={s.cardSubtitle}>
            {t("VERIFY_TEXT").replace("{email}", user.email ?? APP_NAME)}
          </p>

          {fehler && <p className={s.error} role="alert">{fehler}</p>}
          {info && <p className={s.info} role="status">{info}</p>}

          <Button onClick={ichHabeBestaetigt} loading={pruefe}>
            {t("VERIFY_ICH_HABE_BESTAETIGT")}
          </Button>

          <button
            type="button"
            className={s.linkBtn}
            onClick={erneutSenden}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? t("VERIFY_COOLDOWN").replace("{sek}", String(cooldown))
              : t("VERIFY_ERNEUT_SENDEN")}
          </button>

          <p className={s.toggleRow}>
            <button type="button" className={s.linkBtn} onClick={() => signOut(auth)}>
              {t("VERIFY_ANDERES_KONTO")}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
