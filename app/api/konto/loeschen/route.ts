export const runtime = "nodejs"
export const maxDuration = 60

import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"

class AuthFehler extends Error {}
class FrischeAnmeldungFehler extends Error {}
class RateLimitFehler extends Error {}

async function ermittleUidMitAuthTime(
  req: NextRequest,
): Promise<{ uid: string; authTimeS: number }> {
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) throw new AuthFehler("Kein Token")
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { uid: decoded.uid, authTimeS: decoded.auth_time }
  } catch {
    throw new AuthFehler("Ungültiges Token")
  }
}

// Rate-Limit: max. 3 Versuche pro Stunde pro uid.
// Gespeichert in /rate_limits/{uid} (nur Admin SDK, kein Client-Zugriff).
async function pruefeRateLimit(uid: string): Promise<void> {
  const ref = adminDb.collection("rate_limits").doc(uid)
  const jetzt = Date.now()
  const fensterStart = jetzt - 60 * 60 * 1000

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const bisherige: number[] = snap.exists
      ? ((snap.data()!.loeschenVersuche ?? []) as number[]).filter(
          (t: number) => t > fensterStart,
        )
      : []

    if (bisherige.length >= 3) throw new RateLimitFehler("Zu viele Versuche. Warte eine Stunde.")

    tx.set(ref, { loeschenVersuche: [...bisherige, jetzt] }, { merge: true })
  })
}

export async function DELETE(req: NextRequest) {
  let uid: string
  let authTimeS: number

  try {
    ;({ uid, authTimeS } = await ermittleUidMitAuthTime(req))
  } catch (e) {
    return NextResponse.json(
      { fehler: e instanceof AuthFehler ? e.message : "Nicht angemeldet" },
      { status: 401 },
    )
  }

  // Frische Anmeldung erforderlich: max. 5 Minuten seit letzter Authentifizierung
  const alterSekunden = Math.floor(Date.now() / 1000) - authTimeS
  if (alterSekunden > 5 * 60) {
    return NextResponse.json(
      {
        fehler: "Bitte melde dich erneut an. Die letzte Anmeldung ist zu alt.",
        code: "REAUTH_REQUIRED",
      },
      { status: 403 },
    )
  }

  try {
    await pruefeRateLimit(uid)
  } catch (e) {
    if (e instanceof RateLimitFehler) {
      return NextResponse.json({ fehler: e.message }, { status: 429 })
    }
    throw e
  }

  try {
    // Nutzerdaten parallel löschen (recursiveDelete bei großen Konten bis zu ~60 s)
    await Promise.all([
      adminDb.recursiveDelete(adminDb.collection("users").doc(uid)),
      adminDb.recursiveDelete(adminDb.collection("secrets").doc(uid)),
      adminDb.recursiveDelete(adminDb.collection("ical_cache").doc(uid)),
    ])

    // Auth-Konto löschen — idempotent: auth/user-not-found → ok
    try {
      await adminAuth.deleteUser(uid)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code !== "auth/user-not-found") throw e
    }

    // Rate-Limit-Dokument aufräumen (kein PD, aber überflüssig nach Kontolöschung)
    await adminDb.collection("rate_limits").doc(uid).delete().catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    // Keine personenbezogenen Daten in Logs
    console.error("[konto/loeschen] Fehler:", e instanceof Error ? e.message : "unbekannt")
    return NextResponse.json({ fehler: "Interner Fehler" }, { status: 500 })
  }
}

// Export für Tests
export { FrischeAnmeldungFehler, RateLimitFehler }
