import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockVerifyIdToken,
  mockDeleteUser,
  mockRunTransaction,
  mockRecursiveDelete,
  mockRateLimitsDocDelete,
  mockTxGet,
  mockTxSet,
} = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockRecursiveDelete: vi.fn(),
  mockRateLimitsDocDelete: vi.fn(),
  mockTxGet: vi.fn(),
  mockTxSet: vi.fn(),
}))

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
    deleteUser: mockDeleteUser,
  },
  adminDb: {
    collection: (col: string) => ({
      doc: () =>
        col === "rate_limits"
          ? { delete: mockRateLimitsDocDelete }
          : {},
    }),
    runTransaction: mockRunTransaction,
    recursiveDelete: mockRecursiveDelete,
  },
}))

import { DELETE } from "@/app/api/konto/loeschen/route"

// ── Helpers ───────────────────────────────────────────────────────────────────

const TX = { get: mockTxGet, set: mockTxSet }

function freshAuthTime() {
  return Math.floor(Date.now() / 1000) - 10
}

function staleAuthTime() {
  return Math.floor(Date.now() / 1000) - 400
}

function makeRequest(opts: { token?: string; url?: string } = {}) {
  return new NextRequest(opts.url ?? "http://localhost/api/konto/loeschen", {
    method: "DELETE",
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
  })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks()
  mockRunTransaction.mockImplementation(
    async (fn: (tx: typeof TX) => Promise<void>) => fn(TX),
  )
  mockTxGet.mockResolvedValue({ exists: false })
  mockTxSet.mockResolvedValue(undefined)
  mockRecursiveDelete.mockResolvedValue(undefined)
  mockDeleteUser.mockResolvedValue(undefined)
  mockRateLimitsDocDelete.mockResolvedValue(undefined)
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("kein / ungültiges Token", () => {
  it("kein Authorization-Header → 401", async () => {
    const res = await DELETE(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(typeof body.fehler).toBe("string")
  })

  it("ungültiges Token (verifyIdToken wirft) → 401", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("invalid-token"))
    const res = await DELETE(makeRequest({ token: "bad" }))
    expect(res.status).toBe(401)
  })

  it("leerer Bearer-Wert → 401", async () => {
    const req = new NextRequest("http://localhost/api/konto/loeschen", {
      method: "DELETE",
      headers: { Authorization: "Bearer " },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })
})

// ── Frische Anmeldung ─────────────────────────────────────────────────────────

describe("auth_time-Prüfung", () => {
  it("frisches Token (< 5 min) → kein 403", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", auth_time: freshAuthTime() })
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).not.toBe(403)
  })

  it("alte Anmeldung (> 5 min) → 403 mit code REAUTH_REQUIRED und klarer Meldung", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u1", auth_time: staleAuthTime() })
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe("REAUTH_REQUIRED")
    expect(typeof body.fehler).toBe("string")
    expect(body.fehler.length).toBeGreaterThan(10)
  })
})

// ── Rate-Limit ────────────────────────────────────────────────────────────────

describe("Rate-Limit", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u-rl", auth_time: freshAuthTime() })
  })

  it("4. Löschversuch innerhalb einer Stunde → 429", async () => {
    const now = Date.now()
    mockTxGet.mockResolvedValue({
      exists: true,
      data: () => ({ loeschenVersuche: [now - 1000, now - 2000, now - 3000] }),
    })
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(429)
  })

  it("3 Versuche älter als 1 Stunde zählen nicht → kein 429", async () => {
    const h = 60 * 60 * 1000
    mockTxGet.mockResolvedValue({
      exists: true,
      data: () => ({ loeschenVersuche: [Date.now() - 2 * h, Date.now() - 90 * 60 * 1000, Date.now() - 70 * 60 * 1000] }),
    })
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
  })

  it("loeschenVersuche-Zähler unabhängig von exportVersuche", async () => {
    const now = Date.now()
    // exportVersuche voll, aber loeschenVersuche leer → kein 429
    mockTxGet.mockResolvedValue({
      exists: true,
      data: () => ({
        exportVersuche: [now - 100, now - 200, now - 300, now - 400, now - 500,
                         now - 600, now - 700, now - 800, now - 900, now - 1000],
        loeschenVersuche: [],
      }),
    })
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
  })
})

// ── Erfolgspfad ───────────────────────────────────────────────────────────────

describe("Erfolgspfad", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u-ok", auth_time: freshAuthTime() })
  })

  it("gibt { ok: true } mit Status 200 zurück", async () => {
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("ruft recursiveDelete genau 3-mal auf (users, secrets, ical_cache)", async () => {
    await DELETE(makeRequest({ token: "valid" }))
    expect(mockRecursiveDelete).toHaveBeenCalledTimes(3)
  })

  it("ruft deleteUser auf", async () => {
    await DELETE(makeRequest({ token: "valid" }))
    expect(mockDeleteUser).toHaveBeenCalledOnce()
  })

  it("räumt rate_limits-Dokument auf", async () => {
    await DELETE(makeRequest({ token: "valid" }))
    expect(mockRateLimitsDocDelete).toHaveBeenCalledOnce()
  })

  it("auth/user-not-found bei deleteUser → trotzdem 200 (idempotent)", async () => {
    mockDeleteUser.mockRejectedValue(
      Object.assign(new Error("User not found"), { code: "auth/user-not-found" }),
    )
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("uid stammt aus Token — Query-Parameter uid werden ignoriert", async () => {
    const res = await DELETE(
      makeRequest({ token: "tok-abc", url: "http://localhost/api/konto/loeschen?uid=fremd-uid" }),
    )
    // Wenn die Route nur verifyIdToken("tok-abc") aufruft und uid niemals aus der URL liest:
    expect(mockVerifyIdToken).toHaveBeenCalledWith("tok-abc")
    expect(res.status).toBe(200)
  })
})

// ── Fehlerbehandlung ──────────────────────────────────────────────────────────

describe("Fehlerbehandlung", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockResolvedValue({ uid: "u-err", auth_time: freshAuthTime() })
  })

  it("recursiveDelete wirft → 500 (kein 200)", async () => {
    mockRecursiveDelete.mockRejectedValue(new Error("Firestore unavailable"))
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.fehler).toBeTruthy()
    expect(body.ok).toBeUndefined()
  })

  it("deleteUser wirft unbekannten Fehler → 500", async () => {
    mockDeleteUser.mockRejectedValue(
      Object.assign(new Error("Unexpected"), { code: "auth/some-other-error" }),
    )
    const res = await DELETE(makeRequest({ token: "valid" }))
    expect(res.status).toBe(500)
  })
})
