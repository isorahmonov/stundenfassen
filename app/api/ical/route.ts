// firebase-admin benötigt Node.js-APIs (crypto, fs) — nicht Edge-kompatibel
export const runtime = "nodejs"

import { type NextRequest } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { parseIcal } from "@/lib/verfuegbarkeit/icalParser"

// iCal-URLs dürfen nur von Google Calendar kommen (SSRF-Schutz)
const ERLAUBTE_HOSTS = new Set(["calendar.google.com", "myhaw.haw-hamburg.de"])

// Cache gilt 24 Stunden
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ─── Authentifizierung ──────────────────────────────────────────────────────

async function ermittleUid(request: NextRequest): Promise<string> {
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) throw new AuthFehler("Kein Token")
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new AuthFehler("Ungültiges Token")
  }
}

class AuthFehler extends Error {}
class EingabeFehler extends Error {}

function fehlerAntwort(err: unknown): Response {
  if (err instanceof AuthFehler)
    return Response.json({ fehler: err.message }, { status: 401 })
  if (err instanceof EingabeFehler)
    return Response.json({ fehler: err.message }, { status: 400 })
  console.error("[api/ical]", err)
  return Response.json({ fehler: "Interner Fehler" }, { status: 500 })
}

// ─── URL-Validierung ────────────────────────────────────────────────────────

function validiereIcalUrl(urlString: string): URL {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new EingabeFehler("Ungültige URL")
  }
  if (url.protocol !== "https:") throw new EingabeFehler("URL muss HTTPS sein")
  if (!ERLAUBTE_HOSTS.has(url.hostname))
    throw new EingabeFehler(`Host nicht erlaubt: ${url.hostname}`)
  return url
}

// ─── Cache-Logik ────────────────────────────────────────────────────────────

async function holeIcalText(
  uid: string,
  kalendarId: string,
  forceRefresh: boolean,
): Promise<string> {
  const cacheRef = adminDb
    .collection("ical_cache")
    .doc(uid)
    .collection("kalender")
    .doc(kalendarId)

  if (!forceRefresh) {
    const snap = await cacheRef.get()
    if (snap.exists) {
      const data = snap.data()!
      if (Date.now() - (data.letzterAbrufMs as number) < CACHE_TTL_MS) {
        return data.icalText as string
      }
    }
  }

  // URL aus secrets laden — URL kommt nie in den Client
  const secretRef = adminDb
    .collection("secrets")
    .doc(uid)
    .collection("kalender")
    .doc(kalendarId)
  const secretSnap = await secretRef.get()
  if (!secretSnap.exists) throw new EingabeFehler("Kalender nicht gefunden")
  const { url } = secretSnap.data()!

  const res = await fetch(url as string)
  if (!res.ok) throw new Error(`iCal-Abruf fehlgeschlagen: ${res.status}`)
  const icalText = await res.text()

  await cacheRef.set({ letzterAbrufMs: Date.now(), icalText })
  return icalText
}

// ─── GET /api/ical ───────────────────────────────────────────────────────────
// Ohne ?id=  → listet alle gespeicherten Kalender (ohne URL)
// Mit ?id=…  → gibt geparste Termine für die nächsten 8 Wochen zurück
// Mit ?id=…&refresh=true → erzwingt Neu-Abruf unabhängig vom Cache

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const uid = await ermittleUid(request)
    const params = request.nextUrl.searchParams
    const kalendarId = params.get("id")

    if (!kalendarId) {
      // Alle Kalender auflisten (name + farbe, keine URL)
      const snap = await adminDb
        .collection("secrets")
        .doc(uid)
        .collection("kalender")
        .get()
      const kalender = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name as string,
          farbe: data.farbe as string,
          defaultStatus: (data.defaultStatus ?? "LOCKED") as "LOCKED" | "FLEXIBLE",
        }
      })
      return Response.json({ kalender })
    }

    const forceRefresh = params.get("refresh") === "true"
    const icalText = await holeIcalText(uid, kalendarId, forceRefresh)

    // Optionale Datumsbereichs-Parameter "YYYY-MM-DD"; Standard: heute + 8 Wochen
    const jetzt = new Date()
    const vonDatum = params.get("von")
      ? new Date(params.get("von")! + "T00:00:00Z")
      : jetzt
    const bisDatum = params.get("bis")
      ? new Date(params.get("bis")! + "T23:59:59Z")
      : new Date(jetzt.getTime() + 8 * 7 * 24 * 60 * 60 * 1000)
    const termine = parseIcal(icalText, vonDatum, bisDatum)

    // Dates müssen als Strings serialisiert werden
    return Response.json({
      letzterAbruf: Date.now(),
      termine: termine.map((t) => ({
        ...t,
        beginn: t.beginn.toISOString(),
        ende: t.ende.toISOString(),
      })),
    })
  } catch (err) {
    return fehlerAntwort(err)
  }
}

// ─── POST /api/ical ─────────────────────────────────────────────────────────
// Speichert eine neue iCal-URL in /secrets/{uid}/kalender/{id}.
// Gibt { id, name, farbe } zurück — die URL verlässt nie den Server.

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const uid = await ermittleUid(request)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new EingabeFehler("Ungültiger JSON-Body")
    }

    const b = body as Record<string, unknown>
    if (
      typeof b.name !== "string" ||
      typeof b.farbe !== "string" ||
      typeof b.url !== "string" ||
      (b.defaultStatus !== "LOCKED" && b.defaultStatus !== "FLEXIBLE")
    ) {
      throw new EingabeFehler("Felder name, farbe, url und defaultStatus (LOCKED|FLEXIBLE) sind Pflicht")
    }

    const { name, farbe, url } = b as Record<string, string>
    const defaultStatus = b.defaultStatus as "LOCKED" | "FLEXIBLE"
    validiereIcalUrl(url)

    const id = crypto.randomUUID()
    await adminDb
      .collection("secrets")
      .doc(uid)
      .collection("kalender")
      .doc(id)
      .set({ id, name, farbe, url, defaultStatus })

    return Response.json({ id, name, farbe, defaultStatus }, { status: 201 })
  } catch (err) {
    return fehlerAntwort(err)
  }
}
