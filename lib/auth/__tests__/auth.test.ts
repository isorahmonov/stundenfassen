import { describe, expect, it } from "vitest"
import { mapAuthError, braucheVerifizierung } from "@/lib/auth/providers"
import { rateLimitEntscheidung, VERIFY_LIMIT } from "@/lib/auth/rateLimit"

describe("mapAuthError", () => {
  it("maps known codes to their UiStrings keys", () => {
    expect(mapAuthError("auth/wrong-password")).toBe("AUTH_FEHLER_FALSCHE_DATEN")
    expect(mapAuthError("auth/invalid-credential")).toBe("AUTH_FEHLER_FALSCHE_DATEN")
    expect(mapAuthError("auth/invalid-email")).toBe("AUTH_FEHLER_EMAIL_UNGUELTIG")
    expect(mapAuthError("auth/email-already-in-use")).toBe("AUTH_FEHLER_EMAIL_VERGEBEN")
    expect(mapAuthError("auth/weak-password")).toBe("AUTH_FEHLER_SCHWACHES_PW")
    expect(mapAuthError("auth/too-many-requests")).toBe("AUTH_FEHLER_ZU_VIELE")
    expect(mapAuthError("auth/account-exists-with-different-credential")).toBe(
      "AUTH_FEHLER_KONTO_ANDERER_ANBIETER",
    )
    expect(mapAuthError("auth/unauthorized-domain")).toBe("AUTH_FEHLER_DOMAIN")
    expect(mapAuthError("auth/popup-blocked")).toBe("AUTH_FEHLER_POPUP_BLOCKIERT")
    expect(mapAuthError("auth/network-request-failed")).toBe("AUTH_FEHLER_NETZWERK")
    expect(mapAuthError("auth/popup-closed-by-user")).toBe("AUTH_FEHLER_ABGEBROCHEN")
  })

  it("falls back to the generic error for unknown codes", () => {
    expect(mapAuthError("auth/some-new-code")).toBe("AUTH_FEHLER_ALLGEMEIN")
    expect(mapAuthError("")).toBe("AUTH_FEHLER_ALLGEMEIN")
  })
})

describe("braucheVerifizierung", () => {
  it("requires verification only for unverified password accounts", () => {
    expect(
      braucheVerifizierung({ emailVerified: false, providerData: [{ providerId: "password" }] }),
    ).toBe(true)
  })

  it("passes verified password accounts through", () => {
    expect(
      braucheVerifizierung({ emailVerified: true, providerData: [{ providerId: "password" }] }),
    ).toBe(false)
  })

  it("treats federated sign-ins as verified regardless of emailVerified", () => {
    expect(
      braucheVerifizierung({ emailVerified: false, providerData: [{ providerId: "google.com" }] }),
    ).toBe(false)
    expect(
      braucheVerifizierung({ emailVerified: false, providerData: [{ providerId: "github.com" }] }),
    ).toBe(false)
    expect(braucheVerifizierung({ emailVerified: false, providerData: [] })).toBe(false)
  })
})

describe("rateLimitEntscheidung", () => {
  it("allows a first attempt and records the timestamp", () => {
    const r = rateLimitEntscheidung([], 1000)
    expect(r.erlaubt).toBe(true)
    expect(r.aktualisiert).toEqual([1000])
  })

  it("blocks once the limit is reached within the window", () => {
    const jetzt = 1_000_000
    const voll = Array.from({ length: VERIFY_LIMIT }, (_, i) => jetzt - i * 1000)
    const r = rateLimitEntscheidung(voll, jetzt)
    expect(r.erlaubt).toBe(false)
    expect(r.aktualisiert).toHaveLength(VERIFY_LIMIT)
  })

  it("drops timestamps outside the window and allows again", () => {
    const jetzt = 10_000_000
    const fensterMs = 1000
    const alt = [jetzt - 5000, jetzt - 3000] // beide außerhalb
    const r = rateLimitEntscheidung(alt, jetzt, 2, fensterMs)
    expect(r.erlaubt).toBe(true)
    expect(r.aktualisiert).toEqual([jetzt])
  })
})
