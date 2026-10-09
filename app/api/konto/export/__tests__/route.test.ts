import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockVerifyIdToken,
  mockGetUser,
  mockRunTransaction,
  mockTxGet,
  mockTxSet,
  mockCollectionFn,
  mockUserSubGet,
  mockSecretsGet,
  mockKalenderGet,
} = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockGetUser: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockTxGet: vi.fn(),
  mockTxSet: vi.fn(),
  mockCollectionFn: vi.fn(),
  mockUserSubGet: vi.fn(),
  mockSecretsGet: vi.fn(),
  mockKalenderGet: vi.fn(),
}))

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
  },
  adminDb: {
    collection: mockCollectionFn,
    runTransaction: mockRunTransaction,
  },
}))

import { GET } from "@/app/api/konto/export/route"

// ── Helpers ───────────────────────────────────────────────────────────────────

const TX = { get: mockTxGet, set: mockTxSet }

function makeRequest(opts: { token?: string; url?: string } = {}) {
  return new NextRequest(opts.url ?? "http://localhost/api/konto/export", {
    method: "GET",
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
  })
}

function emptyQuerySnap() {
  return { docs: [] }
}

function makeKalenderSnap(entries: Array<{ id: string; name: string; farbe: string; defaultStatus: string; url: string }>) {
  return {
    docs: entries.map((e) => {
      const { id, ...data } = e
      return { id, data: () => data }
    }),
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks()

  mockRunTransaction.mockImplementation(
    async (fn: (tx: typeof TX) => Promise<void>) => fn(TX),
  )
  mockTxGet.mockResolvedValue({ exists: false })
  mockTxSet.mockResolvedValue(undefined)

  mockVerifyIdToken.mockResolvedValue({ uid: "uid-test" })
  mockGetUser.mockResolvedValue({ email: "user@example.com", displayName: "Test User" })

  mockUserSubGet.mockResolvedValue(emptyQuerySnap())
  mockSecretsGet.mockResolvedValue({ exists: false, data: () => ({}) })
  mockKalenderGet.mockResolvedValue(emptyQuerySnap())

  mockCollectionFn.mockImplementation((col: string) => {
    if (col === "users") {
      return {
        doc: () => ({
          collection: () => ({ get: mockUserSubGet }),
        }),
      }
    }
    if (col === "secrets") {
      return {
        doc: () => ({
          get: mockSecretsGet,
          collection: () => ({ get: mockKalenderGet }),
        }),
      }
    }
    // rate_limits
    return { doc: () => ({ delete: vi.fn().mockResolvedValue(undefined) }) }
  })
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("kein / ungültiges Token", () => {
  it("kein Authorization-Header → 401", async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(typeof body.fehler).toBe("string")
  })

  it("ungültiges Token (verifyIdToken wirft) → 401", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("invalid-token"))
    const res = await GET(makeRequest({ token: "bad" }))
    expect(res.status).toBe(401)
  })
})

// ── Rate-Limit ────────────────────────────────────────────────────────────────

describe("Rate-Limit", () => {
  it("11. Exportversuch innerhalb einer Stunde → 429", async () => {
    const now = Date.now()
    const recent = Array.from({ length: 10 }, (_, i) => now - (i + 1) * 100)
    mockTxGet.mockResolvedValue({
      exists: true,
      data: () => ({ exportVersuche: recent }),
    })
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.status).toBe(429)
  })

  it("exportVersuche-Zähler unabhängig von loeschenVersuche", async () => {
    const now = Date.now()
    // loeschenVersuche voll, aber exportVersuche leer → kein 429
    mockTxGet.mockResolvedValue({
      exists: true,
      data: () => ({
        loeschenVersuche: [now - 100, now - 200, now - 300],
        exportVersuche: [],
      }),
    })
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
  })
})

// ── Erfolgspfad & Content-Disposition ────────────────────────────────────────

describe("Erfolgspfad", () => {
  it("Content-Disposition enthält Dateinamen mit aktuellem Datum", async () => {
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
    const cd = res.headers.get("content-disposition") ?? ""
    expect(cd).toMatch(/attachment/)
    const heute = new Date().toISOString().slice(0, 10)
    expect(cd).toContain(heute)
    expect(cd).toMatch(/shiftslot-export-\d{4}-\d{2}-\d{2}\.json/)
  })

  it("Content-Type ist application/json", async () => {
    const res = await GET(makeRequest({ token: "valid" }))
    const ct = res.headers.get("content-type") ?? ""
    expect(ct).toContain("application/json")
  })

  it("Cache-Control: no-store", async () => {
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.headers.get("cache-control")).toBe("no-store")
  })

  it("enthält konto.email und konto.anzeigename aus Firebase Auth", async () => {
    mockGetUser.mockResolvedValue({ email: "max@example.com", displayName: "Max Mustermann" })
    const res = await GET(makeRequest({ token: "valid" }))
    const body = JSON.parse(await res.text())
    expect(body.konto.email).toBe("max@example.com")
    expect(body.konto.anzeigename).toBe("Max Mustermann")
  })

  it("uid stammt aus Token — Query-Parameter uid werden ignoriert", async () => {
    const res = await GET(
      makeRequest({ token: "tok-xyz", url: "http://localhost/api/konto/export?uid=fremd-uid" }),
    )
    expect(mockVerifyIdToken).toHaveBeenCalledWith("tok-xyz")
    expect(res.status).toBe(200)
  })
})

// ── Datenschutz: keine sensitiven Daten im Export ────────────────────────────

describe("Datenschutz", () => {
  it("iCal-URLs werden NICHT exportiert — url ist immer 'vorhanden'", async () => {
    mockKalenderGet.mockResolvedValue(
      makeKalenderSnap([
        {
          id: "kal-1",
          name: "Arbeit",
          farbe: "blue",
          defaultStatus: "work",
          url: "https://calendar.google.com/calendar/ical/SECRET_TOKEN/basic.ics",
        },
        {
          id: "kal-2",
          name: "Privat",
          farbe: "red",
          defaultStatus: "frei",
          url: "https://outlook.office365.com/owa/calendar/TOKEN123/calendar.ics",
        },
      ]),
    )
    const res = await GET(makeRequest({ token: "valid" }))
    const body = JSON.parse(await res.text())
    const rawJson = JSON.stringify(body)

    for (const kal of body.zugangsdaten.kalender) {
      expect(kal.url).toBe("vorhanden")
    }
    // Kein echter URL-String im gesamten Export
    expect(rawJson).not.toMatch(/SECRET_TOKEN/)
    expect(rawJson).not.toMatch(/TOKEN123/)
  })

  it("Gmail-App-Passwort wird NICHT im Klartext exportiert", async () => {
    mockSecretsGet.mockResolvedValue({
      exists: true,
      data: () => ({
        gmailUser: "nutzer@gmail.com",
        gmailAppPassword: "mein-geheimes-app-passwort",
      }),
    })
    const res = await GET(makeRequest({ token: "valid" }))
    const rawJson = await res.text()

    expect(rawJson).not.toContain("mein-geheimes-app-passwort")
    const body = JSON.parse(rawJson)
    expect(body.zugangsdaten.gmailAppPasswort).toBe("vorhanden")
    expect(body.zugangsdaten.gmailUser).toBe("nutzer@gmail.com")
  })

  it("kein Passwort-Klartext — auch wenn Secrets-Felder heikle Strings enthalten", async () => {
    mockSecretsGet.mockResolvedValue({
      exists: true,
      data: () => ({
        gmailAppPassword: "token:super-secret-password-1234",
      }),
    })
    const res = await GET(makeRequest({ token: "valid" }))
    const rawJson = await res.text()
    expect(rawJson).not.toContain("super-secret-password-1234")
    expect(rawJson).not.toContain("token:super-secret")
  })

  it("kein /secrets/-Pfad enthält rohe URL-Tokens im Export", async () => {
    mockKalenderGet.mockResolvedValue(
      makeKalenderSnap([
        { id: "k1", name: "X", farbe: "green", defaultStatus: "work", url: "https://example.com/calendar?token=abc123" },
      ]),
    )
    const res = await GET(makeRequest({ token: "valid" }))
    const rawJson = await res.text()
    expect(rawJson).not.toContain("abc123")
    expect(rawJson).not.toContain("https://example.com")
  })
})
