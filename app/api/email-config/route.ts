export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"

class AuthFehler extends Error {}

async function ermittleUid(req: NextRequest): Promise<string> {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) throw new AuthFehler("Kein Token")
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new AuthFehler("Ungültiges Token")
  }
}

function authFehler(e: unknown) {
  return NextResponse.json(
    { fehler: e instanceof AuthFehler ? e.message : "Nicht angemeldet" },
    { status: 401 },
  )
}

// GET — prüft ob Konto konfiguriert; gibt NIEMALS das Passwort zurück
export async function GET(req: NextRequest) {
  let uid: string
  try { uid = await ermittleUid(req) } catch (e) { return authFehler(e) }

  try {
    const snap = await adminDb.collection("secrets").doc(uid).get()
    const d = snap.data()
    if (d?.gmailUser && d?.gmailAppPassword) {
      return NextResponse.json({ konfiguriert: true, gmailUser: d.gmailUser as string })
    }
    return NextResponse.json({ konfiguriert: false })
  } catch (e) {
    return NextResponse.json({ fehler: String(e) }, { status: 500 })
  }
}

// POST — speichert Zugangsdaten
export async function POST(req: NextRequest) {
  let uid: string
  try { uid = await ermittleUid(req) } catch (e) { return authFehler(e) }

  try {
    const { gmailUser, gmailAppPassword } = await req.json() as {
      gmailUser?: string
      gmailAppPassword?: string
    }
    if (!gmailUser?.trim() || !gmailAppPassword?.trim()) {
      return NextResponse.json(
        { fehler: "gmailUser und gmailAppPassword erforderlich" },
        { status: 400 },
      )
    }
    await adminDb.collection("secrets").doc(uid).set(
      { gmailUser: gmailUser.trim(), gmailAppPassword: gmailAppPassword.trim() },
      { merge: true },
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ fehler: String(e) }, { status: 500 })
  }
}

// DELETE — entfernt Zugangsdaten
export async function DELETE(req: NextRequest) {
  let uid: string
  try { uid = await ermittleUid(req) } catch (e) { return authFehler(e) }

  try {
    await adminDb.collection("secrets").doc(uid).set(
      { gmailUser: null, gmailAppPassword: null },
      { merge: true },
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ fehler: String(e) }, { status: 500 })
  }
}
