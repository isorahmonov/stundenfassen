import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  istPrivateIPv4,
  istPrivateIPv6,
  validiereUndNormalisiereIcalUrl,
  holeSicherIcal,
  verbindungsLookup,
  SSRFFehler,
} from "@/lib/ical/ssrfGuard"

// ─── Mocks ───────────────────────────────────────────────────────────────────

// node:dns/promises — für pruefeHostname (Vorab-Prüfung)
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }))
// node:dns — für verbindungsLookup (Verbindungszeit-Prüfung)
vi.mock("node:dns", () => ({ default: { lookup: vi.fn() } }))
// node:https — ersetzt globales fetch
vi.mock("node:https", () => ({ default: { request: vi.fn() } }))

import { lookup as _dnsLookupPromise } from "node:dns/promises"
import dns from "node:dns"
import https from "node:https"

const mockDnsPromise = _dnsLookupPromise as unknown as ReturnType<typeof vi.fn>
const mockDnsSync = dns.lookup as unknown as ReturnType<typeof vi.fn>
const mockHttpsRequest = https.request as unknown as ReturnType<typeof vi.fn>

function mockDns(addresses: Array<{ address: string; family: 4 | 6 }>) {
  mockDnsPromise.mockResolvedValue(addresses)
}

const ICAL_BODY = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR"

function createMockResponse(statusCode: number, headers: Record<string, string> = {}) {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  const res = {
    statusCode,
    headers,
    resume: vi.fn(),
    on(event: string, fn: (...args: unknown[]) => void) { (listeners[event] ??= []).push(fn); return this },
    _emit(event: string, ...args: unknown[]) { for (const fn of listeners[event] ?? []) fn(...args) },
  }
  return res
}

function createMockRequest() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  return {
    on(event: string, fn: (...args: unknown[]) => void) { (listeners[event] ??= []).push(fn); return this },
    _emit(event: string, ...args: unknown[]) { for (const fn of listeners[event] ?? []) fn(...args) },
    end: vi.fn(),
    destroy: vi.fn(),
  }
}

// Richtet einen einfachen 200-OK-Abruf ein (gibt VCALENDAR-Body zurück)
function setupHttpsSuccess(body = ICAL_BODY) {
  const res = createMockResponse(200)
  const req = createMockRequest()
  mockHttpsRequest.mockImplementation((_opts: unknown, cb: (res: unknown) => void) => {
    setTimeout(() => { cb(res); res._emit("data", Buffer.from(body)); res._emit("end") }, 0)
    return req
  })
  return { res, req }
}

beforeEach(() => { vi.resetAllMocks() })

// ─── istPrivateIPv4 ───────────────────────────────────────────────────────────

describe("istPrivateIPv4", () => {
  it.each([
    "127.0.0.1", "10.0.0.1", "10.255.255.255", "192.168.1.1",
    "172.16.0.1", "172.31.255.255", "169.254.169.254", "0.0.0.0", "224.0.0.1",
  ])("erkennt %s als privat", (addr) => {
    expect(istPrivateIPv4(addr)).toBe(true)
  })

  it.each([
    "1.2.3.4", "8.8.8.8", "185.93.201.100", "172.15.255.255", "172.32.0.0",
  ])("erkennt %s als öffentlich", (addr) => {
    expect(istPrivateIPv4(addr)).toBe(false)
  })
})

// ─── istPrivateIPv6 ───────────────────────────────────────────────────────────

describe("istPrivateIPv6", () => {
  it.each(["::1", "::", "fe80::1", "fc00::1", "fd12::1", "ff02::1"])(
    "erkennt %s als privat",
    (addr) => { expect(istPrivateIPv6(addr)).toBe(true) },
  )

  it("erkennt öffentliches IPv6 als nicht-privat", () => {
    expect(istPrivateIPv6("2001:db8::1")).toBe(false)
  })

  // IPv4-mapped (gemischte Notation, direkt)
  it.each(["::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:192.168.1.1"])(
    "erkennt IPv4-mapped %s als privat",
    (addr) => { expect(istPrivateIPv6(addr)).toBe(true) },
  )

  // IPv4-mapped in Hex-Notation — so normalisiert WHATWG URL [::ffff:127.0.0.1]
  it("erkennt ::ffff:7f00:1 (= ::ffff:127.0.0.1 nach WHATWG-Normalisierung) als privat", () => {
    expect(istPrivateIPv6("::ffff:7f00:1")).toBe(true)
  })

  it("erkennt ::ffff:c0a8:101 (= ::ffff:192.168.1.1 nach WHATWG-Normalisierung) als privat", () => {
    expect(istPrivateIPv6("::ffff:c0a8:101")).toBe(true)
  })

  it("erkennt ::ffff:808:808 (= ::ffff:8.8.8.8, öffentlich) als nicht-privat", () => {
    expect(istPrivateIPv6("::ffff:808:808")).toBe(false)
  })
})

// ─── validiereUndNormalisiereIcalUrl ──────────────────────────────────────────

describe("validiereUndNormalisiereIcalUrl", () => {
  it("erlaubt portal.fh-dortmund.de", async () => {
    mockDns([{ address: "130.149.100.1", family: 4 }])
    const result = await validiereUndNormalisiereIcalUrl("https://portal.fh-dortmund.de/cal.ics")
    expect(result).toBe("https://portal.fh-dortmund.de/cal.ics")
  })

  it("erlaubt calendar.google.com", async () => {
    mockDns([{ address: "142.250.74.110", family: 4 }])
    const result = await validiereUndNormalisiereIcalUrl("https://calendar.google.com/calendar/ical/abc.ics")
    expect(result).toContain("calendar.google.com")
  })

  it("erlaubt outlook.office365.com", async () => {
    mockDns([{ address: "52.98.80.0", family: 4 }])
    const result = await validiereUndNormalisiereIcalUrl("https://outlook.office365.com/owa/calendar/abc.ics")
    expect(result).toContain("outlook.office365.com")
  })

  it("normalisiert webcal:// zu https://", async () => {
    mockDns([{ address: "142.250.74.110", family: 4 }])
    const result = await validiereUndNormalisiereIcalUrl("webcal://calendar.google.com/calendar/ical/abc.ics")
    expect(result).toMatch(/^https:\/\//)
  })

  it("blockiert http://", async () => {
    await expect(validiereUndNormalisiereIcalUrl("http://calendar.google.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert 127.0.0.1 direkt", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://127.0.0.1/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert 10.0.0.1 direkt", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://10.0.0.1/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert 192.168.1.1 direkt", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://192.168.1.1/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert 169.254.169.254 direkt (Cloud-Metadata)", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://169.254.169.254/latest/meta-data/"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert [::1] (IPv6 loopback in Klammern)", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://[::1]/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert localhost wenn DNS auf private IP zeigt", async () => {
    mockDns([{ address: "127.0.0.1", family: 4 }])
    await expect(validiereUndNormalisiereIcalUrl("https://localhost/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert Hostname wenn DNS auf private IP zeigt", async () => {
    mockDns([{ address: "10.0.0.1", family: 4 }])
    await expect(validiereUndNormalisiereIcalUrl("https://internal.company.local/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  // IP-Kurzformen — WHATWG URL normalisiert alle zu 127.0.0.1 vor der Prüfung
  it("blockiert dezimale IPv4-Notation (2130706433 = 127.0.0.1)", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://2130706433/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert Kurzform 127.1 (= 127.0.0.1)", async () => {
    // WHATWG URL normalisiert 127.1 → 127.0.0.1
    await expect(validiereUndNormalisiereIcalUrl("https://127.1/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("blockiert [::ffff:127.0.0.1] — nach WHATWG-Normalisierung Hostname ::ffff:7f00:1", async () => {
    await expect(validiereUndNormalisiereIcalUrl("https://[::ffff:127.0.0.1]/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  // Gespeicherte Links aus Firestore laufen ebenfalls durch holeSicherIcal
  it("blockiert gespeicherte private IP aus Firestore (10.0.0.1)", async () => {
    await expect(holeSicherIcal("https://10.0.0.1/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })
})

// ─── verbindungsLookup (DNS-Rebinding-Schutz) ────────────────────────────────
// Testet beide Aufrufformen: all:false (Standard) und all:true (Node autoSelectFamily)

describe("verbindungsLookup — all: false (einzelne Adresse)", () => {
  it("lässt öffentliche IPv4 durch", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) => cb(null, "8.8.8.8", 4))
    let capturedErr: NodeJS.ErrnoException | null = null
    let capturedAddr = ""
    verbindungsLookup("google.com", {}, (err, addr) => { capturedErr = err; capturedAddr = addr })
    expect(capturedErr).toBeNull()
    expect(capturedAddr).toBe("8.8.8.8")
  })

  it("blockiert private IPv4 mit EBLOCKED", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) => cb(null, "10.0.0.1", 4))
    let capturedCode = ""
    verbindungsLookup("internal.local", {}, (err) => { capturedCode = (err as NodeJS.ErrnoException)?.code ?? "" })
    expect(capturedCode).toBe("EBLOCKED")
  })

  it("blockiert private IPv6 (::1) mit EBLOCKED", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) => cb(null, "::1", 6))
    let capturedCode = ""
    verbindungsLookup("loopback.local", {}, (err) => { capturedCode = (err as NodeJS.ErrnoException)?.code ?? "" })
    expect(capturedCode).toBe("EBLOCKED")
  })
})

describe("verbindungsLookup — all: true (Node autoSelectFamily, Standard in Node 21+)", () => {
  // Node 24 ruft lookup mit { hints: 1024, all: true } auf — das hat der Aufruf-Test bestätigt.
  // Ohne Fix: addrOrList ist LookupAddress[], cast zu string bricht → "Invalid IP address: undefined"

  it("lässt öffentliche IPs durch, gibt erste Adresse zurück", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) =>
      cb(null, [{ address: "142.250.74.110", family: 4 }, { address: "2607:f8b0::1", family: 6 }]))
    let capturedErr: NodeJS.ErrnoException | null = null
    let capturedAddr = ""
    let capturedFamily = 0
    verbindungsLookup("google.com", { all: true }, (err, addr, fam) => {
      capturedErr = err; capturedAddr = addr; capturedFamily = fam
    })
    expect(capturedErr).toBeNull()
    expect(capturedAddr).toBe("142.250.74.110")
    expect(capturedFamily).toBe(4)
  })

  it("blockiert wenn private IPv4 in der Liste enthalten ist", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) =>
      cb(null, [{ address: "185.93.201.100", family: 4 }, { address: "10.0.0.1", family: 4 }]))
    let capturedCode = ""
    verbindungsLookup("rebind.example.com", { all: true }, (err) => {
      capturedCode = (err as NodeJS.ErrnoException)?.code ?? ""
    })
    expect(capturedCode).toBe("EBLOCKED")
  })

  it("blockiert wenn private IPv6 (::1) in der Liste enthalten ist", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) =>
      cb(null, [{ address: "2001:db8::1", family: 6 }, { address: "::1", family: 6 }]))
    let capturedCode = ""
    verbindungsLookup("rebind6.example.com", { all: true }, (err) => {
      capturedCode = (err as NodeJS.ErrnoException)?.code ?? ""
    })
    expect(capturedCode).toBe("EBLOCKED")
  })

  it("gibt ENOTFOUND zurück bei leerer Adressliste", () => {
    mockDnsSync.mockImplementation((_h: unknown, _o: unknown, cb: Function) => cb(null, []))
    let capturedCode = ""
    verbindungsLookup("empty.example.com", { all: true }, (err) => {
      capturedCode = (err as NodeJS.ErrnoException)?.code ?? ""
    })
    expect(capturedCode).toBe("ENOTFOUND")
  })
})

// ─── holeSicherIcal ───────────────────────────────────────────────────────────

describe("holeSicherIcal — Redirect auf private IP blockiert", () => {
  it("blockiert Redirect auf 169.254.169.254", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }])
    const req = createMockRequest()
    const res = createMockResponse(301, { location: "https://169.254.169.254/latest/meta-data/" })
    mockHttpsRequest.mockImplementation((_opts: unknown, cb: (res: unknown) => void) => {
      setTimeout(() => { cb(res); res._emit("end") }, 0)
      return req
    })
    await expect(holeSicherIcal("https://legit.example.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("liefert iCal-Text bei erfolgreicher Anfrage", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }])
    setupHttpsSuccess()
    const result = await holeSicherIcal("https://legit.example.com/cal.ics")
    expect(result).toContain("BEGIN:VCALENDAR")
  })

  it("wirft SSRFFehler wenn Antwort kein BEGIN:VCALENDAR enthält", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }])
    setupHttpsSuccess("<html>Not a calendar</html>")
    await expect(holeSicherIcal("https://legit.example.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("wirft SSRFFehler bei HTTP-Fehler (404)", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }])
    const req = createMockRequest()
    const res = createMockResponse(404)
    mockHttpsRequest.mockImplementation((_opts: unknown, cb: (res: unknown) => void) => {
      setTimeout(() => { cb(res); res._emit("end") }, 0)
      return req
    })
    await expect(holeSicherIcal("https://legit.example.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("DNS-Rebinding: EBLOCKED-Fehler aus verbindungsLookup wird als SSRFFehler weitergereicht", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }]) // Vorab-Prüfung besteht
    const req = createMockRequest()
    mockHttpsRequest.mockImplementation((_opts: unknown, _cb: unknown) => {
      // Simuliert: verbindungsLookup entdeckt beim TCP-Aufbau eine private IP
      setTimeout(() => {
        req._emit("error", Object.assign(new Error("SSRF_BLOCKED"), { code: "EBLOCKED" }))
      }, 0)
      return req
    })
    await expect(holeSicherIcal("https://legit.example.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })

  it("wirft SSRFFehler wenn Antwort das 5-MB-Limit überschreitet", async () => {
    mockDns([{ address: "185.93.201.100", family: 4 }])
    const req = createMockRequest()
    const res = createMockResponse(200)
    mockHttpsRequest.mockImplementation((_opts: unknown, cb: (res: unknown) => void) => {
      setTimeout(() => {
        cb(res)
        // 6 MB in 3 Chunks — überschreitet 5 MB
        res._emit("data", Buffer.alloc(2 * 1024 * 1024, "x"))
        res._emit("data", Buffer.alloc(2 * 1024 * 1024, "x"))
        res._emit("data", Buffer.alloc(2 * 1024 * 1024, "x"))
        res._emit("end")
      }, 0)
      return req
    })
    await expect(holeSicherIcal("https://legit.example.com/cal.ics"))
      .rejects.toBeInstanceOf(SSRFFehler)
  })
})
