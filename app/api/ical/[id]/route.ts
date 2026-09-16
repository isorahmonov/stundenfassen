export const runtime = "nodejs"

import { type NextRequest } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"

class AuthFehler extends Error {}
class EingabeFehler extends Error {}

const ERLAUBTE_HOSTS = new Set(["calendar.google.com", "myhaw.haw-hamburg.de"])

async function ermittleUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) throw new AuthFehler("Kein Token")
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new AuthFehler("Ungültiges Token")
  }
}

function fehlerAntwort(err: unknown): Response {
  if (err instanceof AuthFehler)
    return Response.json({ fehler: err.message }, { status: 401 })
  if (err instanceof EingabeFehler)
    return Response.json({ fehler: err.message }, { status: 400 })
  console.error("[api/ical/[id]]", err)
  return Response.json({ fehler: "Interner Fehler" }, { status: 500 })
}

function validiereUrl(urlString: string) {
  let url: URL
  try { url = new URL(urlString) } catch { throw new EingabeFehler("Ungültige URL") }
  if (url.protocol !== "https:") throw new EingabeFehler("URL muss HTTPS sein")
  if (!ERLAUBTE_HOSTS.has(url.hostname))
    throw new EingabeFehler(`Host nicht erlaubt: ${url.hostname}`)
}

// ─── PUT /api/ical/[id] ──────────────────────────────────────────────────────
// Aktualisiert Name, Farbe, Status und optional die URL.
// Gibt { id, name, farbe, defaultStatus } zurück — URL bleibt geheim.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const uid = await ermittleUid(request)
    const { id } = await params

    let body: unknown
    try { body = await request.json() } catch { throw new EingabeFehler("Ungültiger JSON-Body") }
    const b = body as Record<string, unknown>

    const ref = adminDb.collection("secrets").doc(uid).collection("kalender").doc(id)
    const snap = await ref.get()
    if (!snap.exists) throw new EingabeFehler("Kalender nicht gefunden")

    const updates: Record<string, unknown> = {}

    if (typeof b.name === "string") updates.name = b.name
    if (typeof b.farbe === "string") updates.farbe = b.farbe
    if (b.defaultStatus === "LOCKED" || b.defaultStatus === "FLEXIBLE")
      updates.defaultStatus = b.defaultStatus
    if (typeof b.url === "string") {
      validiereUrl(b.url)
      updates.url = b.url
      // Cache invalidieren wenn URL sich ändert
      await adminDb.collection("ical_cache").doc(uid).collection("kalender").doc(id).delete()
    }

    if (Object.keys(updates).length === 0)
      throw new EingabeFehler("Keine aktualisierbaren Felder angegeben")

    await ref.update(updates)

    const aktuell = { ...snap.data()!, ...updates }
    return Response.json({
      id,
      name: aktuell.name,
      farbe: aktuell.farbe,
      defaultStatus: aktuell.defaultStatus,
    })
  } catch (err) {
    return fehlerAntwort(err)
  }
}

// ─── DELETE /api/ical/[id] ───────────────────────────────────────────────────
// Löscht den Kalender aus secrets und den zugehörigen Cache.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const uid = await ermittleUid(request)
    const { id } = await params

    const ref = adminDb.collection("secrets").doc(uid).collection("kalender").doc(id)
    const snap = await ref.get()
    if (!snap.exists) throw new EingabeFehler("Kalender nicht gefunden")

    await Promise.all([
      ref.delete(),
      adminDb.collection("ical_cache").doc(uid).collection("kalender").doc(id).delete(),
    ])

    return new Response(null, { status: 204 })
  } catch (err) {
    return fehlerAntwort(err)
  }
}
