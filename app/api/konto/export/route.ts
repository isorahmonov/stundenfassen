export const runtime = "nodejs"
export const maxDuration = 30

import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"

class AuthFehler extends Error {}
class RateLimitFehler extends Error {}

async function ermittleUid(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) throw new AuthFehler("Kein Token")
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new AuthFehler("Ungültiges Token")
  }
}

// Rate-Limit: max. 10 Exporte pro Stunde pro uid
async function pruefeRateLimit(uid: string): Promise<void> {
  const ref = adminDb.collection("rate_limits").doc(uid)
  const jetzt = Date.now()
  const fensterStart = jetzt - 60 * 60 * 1000

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const bisherige: number[] = snap.exists
      ? ((snap.data()!.exportVersuche ?? []) as number[]).filter(
          (t: number) => t > fensterStart,
        )
      : []

    if (bisherige.length >= 10) throw new RateLimitFehler("Zu viele Exportanfragen. Warte eine Stunde.")

    tx.set(ref, { exportVersuche: [...bisherige, jetzt] }, { merge: true })
  })
}

type DocMap = Record<string, unknown>

function snapshotZuListe(
  snap: FirebaseFirestore.QuerySnapshot,
): DocMap[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function GET(req: NextRequest) {
  let uid: string
  try {
    uid = await ermittleUid(req)
  } catch (e) {
    return NextResponse.json(
      { fehler: e instanceof AuthFehler ? e.message : "Nicht angemeldet" },
      { status: 401 },
    )
  }

  try {
    await pruefeRateLimit(uid)
  } catch (e) {
    if (e instanceof RateLimitFehler) {
      return NextResponse.json({ fehler: (e as Error).message }, { status: 429 })
    }
    throw e
  }

  try {
    const userRef = adminDb.collection("users").doc(uid)
    const secretsRef = adminDb.collection("secrets").doc(uid)

    const [
      authUserRecord,
      employersSnap,
      shiftsSnap,
      settingsSnap,
      minusSnap,
      geplanteSnap,
      emailVorlagenSnap,
      abgleichSnap,
      verfuegbarkeitArchivSnap,
      secretsSnap,
      kalenderSnap,
    ] = await Promise.all([
      adminAuth.getUser(uid),
      userRef.collection("employers").get(),
      userRef.collection("shifts").get(),
      userRef.collection("settings").get(),
      userRef.collection("minus_eintraege").get(),
      userRef.collection("geplante_schichten").get(),
      userRef.collection("email_vorlagen").get(),
      userRef.collection("abgleich").get(),
      userRef.collection("verfuegbarkeit_archiv").get(),
      secretsRef.get(),
      secretsRef.collection("kalender").get(),
    ])

    const secretsData = secretsSnap.exists ? secretsSnap.data()! : {}

    const exportDaten = {
      exportiert_am: new Date().toISOString(),
      version: 1,
      hinweis:
        "iCal-URLs und Passwörter sind nicht enthalten. Diese Datei enthält personenbezogene Daten — bitte sicher aufbewahren.",
      konto: {
        email: authUserRecord.email ?? null,
        anzeigename: authUserRecord.displayName ?? null,
      },
      daten: {
        employers: snapshotZuListe(employersSnap),
        shifts: snapshotZuListe(shiftsSnap),
        settings: snapshotZuListe(settingsSnap),
        minus_eintraege: snapshotZuListe(minusSnap),
        geplante_schichten: snapshotZuListe(geplanteSnap),
        email_vorlagen: snapshotZuListe(emailVorlagenSnap),
        abgleich: snapshotZuListe(abgleichSnap),
        verfuegbarkeit_archiv: snapshotZuListe(verfuegbarkeitArchivSnap),
      },
      zugangsdaten: {
        // Passwort wird NICHT exportiert — nur ob es hinterlegt ist
        gmailUser: (secretsData.gmailUser as string | undefined) ?? null,
        gmailAppPasswort: secretsData.gmailAppPassword ? "vorhanden" : "nicht vorhanden",
        // iCal-URLs werden NICHT exportiert (enthalten Authentifizierungstoken)
        kalender: kalenderSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name as string,
          farbe: d.data().farbe as string,
          defaultStatus: d.data().defaultStatus as string,
          url: "vorhanden",
        })),
      },
    }

    const datum = new Date().toISOString().slice(0, 10)
    const json = JSON.stringify(exportDaten, null, 2)

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="stundenfassen-export-${datum}.json"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("[konto/export] Fehler:", e instanceof Error ? e.message : "unbekannt")
    return NextResponse.json({ fehler: "Interner Fehler" }, { status: 500 })
  }
}

// Export für Tests
export { RateLimitFehler }
