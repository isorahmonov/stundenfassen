export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { sendEmail } from "@/lib/email/send"

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

export async function POST(req: NextRequest) {
  let uid: string
  try {
    uid = await ermittleUid(req)
  } catch (e) {
    return NextResponse.json({ fehler: e instanceof AuthFehler ? e.message : "Nicht angemeldet" }, { status: 401 })
  }

  try {
    // Gmail-Zugangsdaten des Users aus /secrets/{uid} lesen (nur Admin SDK)
    const secretsSnap = await adminDb.collection("secrets").doc(uid).get()
    const secrets = secretsSnap.data()
    const gmailUser = secrets?.gmailUser as string | null | undefined
    const gmailAppPassword = secrets?.gmailAppPassword as string | null | undefined

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json({ fehler: "KEIN_EMAIL_KONTO" }, { status: 422 })
    }

    const body = await req.json() as {
      to?: string
      cc?: string
      betreff?: string
      text?: string
      pdfBase64?: string
      dateiname?: string
    }

    const { to, cc, betreff, text, pdfBase64, dateiname } = body

    if (!to || !betreff || !pdfBase64 || !dateiname) {
      return NextResponse.json({ fehler: "Fehlende Pflichtfelder (to, betreff, pdfBase64, dateiname)" }, { status: 400 })
    }

    await sendEmail({ gmailUser, gmailAppPassword, to, cc, betreff, text: text ?? "", pdfBase64, dateiname })

    await adminDb
      .collection("users")
      .doc(uid)
      .collection("email_versandlog")
      .add({
        erstelltAm: new Date(),
        empfaenger: to,
        ...(cc ? { cc } : {}),
        betreff,
        dateiname,
      })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[email/send]", msg)
    return NextResponse.json({ fehler: msg }, { status: 500 })
  }
}
