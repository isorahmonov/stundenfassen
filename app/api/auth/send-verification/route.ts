export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { APP_DOMAINS } from "@/lib/brand"
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n"
import { rateLimitEntscheidung } from "@/lib/auth/rateLimit"
import { verifizierungsEmail } from "@/lib/auth/verificationEmail"

// Immer neutrale Antwort: nie verraten, ob/weshalb nichts gesendet wurde.
const NEUTRAL = NextResponse.json({ ok: true })
const FALLBACK = NextResponse.json({ ok: true, fallback: true })

function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? ""
  return h.startsWith("Bearer ") ? h.slice(7) : null
}

// Erste IP aus x-forwarded-for; als Rate-Limit-Schlüssel nur der SHA-256-Hash
// (kein Klartext-IP in /rate_limits).
function ipHash(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? ""
  const erste = fwd.split(",")[0]?.trim() || "unbekannt"
  return createHash("sha256").update(erste).digest("hex").slice(0, 32)
}

// continueUrl ausschließlich aus Allowlist — nie aus Request-Host/Origin.
function continueUrl(): string {
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000/"
  return `https://${APP_DOMAINS.current[0]}/`
}

async function rateLimitOk(docId: string, feld: string): Promise<boolean> {
  const ref = adminDb.collection("rate_limits").doc(docId)
  const jetzt = Date.now()
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const bisherige = (snap.exists ? (snap.data()![feld] ?? []) : []) as number[]
    const { erlaubt, aktualisiert } = rateLimitEntscheidung(bisherige, jetzt)
    if (erlaubt) tx.set(ref, { [feld]: aktualisiert }, { merge: true })
    return erlaubt
  })
}

export async function POST(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NEUTRAL

  let uid: string
  let email: string | undefined
  let verifiziert: boolean
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
    email = decoded.email
    verifiziert = decoded.email_verified === true
  } catch {
    return NEUTRAL
  }

  // Nichts zu tun — neutral quittieren.
  if (!email || verifiziert) return NEUTRAL

  // Rate-Limit pro uid UND gehashter IP.
  const [uidOk, ipOk] = await Promise.all([
    rateLimitOk(uid, "verifyVersuche"),
    rateLimitOk(`ip_${ipHash(req)}`, "verifyVersuche"),
  ])
  if (!uidOk || !ipOk) return NEUTRAL

  // Ohne Resend-Key: Client soll clientseitig sendEmailVerification nutzen.
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) return FALLBACK

  const body = (await req.json().catch(() => ({}))) as { locale?: string }
  const locale: Locale = LOCALES.includes(body.locale as Locale)
    ? (body.locale as Locale)
    : DEFAULT_LOCALE

  try {
    const link = await adminAuth.generateEmailVerificationLink(email, { url: continueUrl() })
    const mail = verifizierungsEmail(locale, link)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: email, subject: mail.betreff, html: mail.html, text: mail.text }),
    })
    // Bei Resend-Fehler clientseitigen Fallback auslösen (bleibt neutral).
    if (!res.ok) return FALLBACK
  } catch {
    return FALLBACK
  }

  return NEUTRAL
}
