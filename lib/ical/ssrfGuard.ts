// SSRF-Schutz für externe iCal-URLs.
// Kein Allowlist — DNS-Auflösung + IP-Range-Prüfung zum Verbindungszeitpunkt.
// Die URL darf nie in Fehlermeldungen auftauchen (enthält oft Token).

import https from "node:https"
import dns from "node:dns"
import { lookup as dnsLookupPromise } from "node:dns/promises"
import type { LookupAddress, LookupAllOptions, LookupOneOptions, LookupOptions } from "node:dns"
import type { IncomingMessage } from "node:http"

const MAX_ANTWORT_BYTES = 5 * 1024 * 1024 // 5 MB
const TIMEOUT_MS = 10_000
const MAX_UMLEITUNGEN = 3

// TLS-Fehlercodes, bei denen Zertifikatsprüfung NICHT abschaltet werden darf.
// Stattdessen wird der Code ans Log weitergeleitet, damit der Nutzer entscheiden kann.
const TLS_FEHLER_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "CERT_UNTRUSTED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "ERR_TLS_CERT_ALTNAME_INVALID",
])

// Bekannte TCP/DNS-Fehlercodes — vom Netz verursacht, nicht von unserem Code.
const NETZ_FEHLER_CODES = new Set([
  "ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT",
  "EPIPE", "ECONNABORTED", "EAI_AGAIN", "EAI_FAIL",
  "EAI_NONAME", "ENETUNREACH", "EHOSTUNREACH", "ENETDOWN",
])


export type IcalFehlerCode =
  | "STRUKTUR"
  | "DNS"
  | "PRIVATE_IP"
  | "REDIRECT"
  | "HTTP_STATUS"
  | "CONTENT_TYPE"
  | "ZU_GROSS"
  | "TIMEOUT"
  | "TLS_FEHLER"
  | "KEIN_VCALENDAR"
  | "INTERN"

export class SSRFFehler extends Error {
  readonly code: IcalFehlerCode
  constructor(message: string, code: IcalFehlerCode = "STRUKTUR") {
    super(message)
    this.name = "SSRFFehler"
    this.code = code
  }
}

// ─── URL-Normalisierung und Struktur-Prüfung ────────────────────────────────

function normalisiereUrl(urlString: string): URL {
  const s = urlString.replace(/^webcal:\/\//i, "https://")
  try {
    return new URL(s)
  } catch {
    throw new SSRFFehler("Ungültige URL")
  }
}

function pruefeStruktur(url: URL): void {
  if (url.protocol !== "https:") {
    throw new SSRFFehler("URL muss HTTPS verwenden (https://…)", "STRUKTUR")
  }
  if (url.username || url.password) {
    throw new SSRFFehler("URL darf keine Zugangsdaten enthalten", "STRUKTUR")
  }
  if (url.port && url.port !== "443") {
    throw new SSRFFehler("Nur der Standard-HTTPS-Port ist erlaubt", "STRUKTUR")
  }
}

// ─── IP-Range-Prüfung ────────────────────────────────────────────────────────

export function istPrivateIPv4(addr: string): boolean {
  const teile = addr.split(".")
  if (teile.length !== 4) return false
  const o = teile.map((t) => parseInt(t, 10))
  if (o.some((n) => isNaN(n) || n < 0 || n > 255)) return false
  const [a, b] = o
  return (
    a === 0 ||                           // 0.0.0.0/8
    a === 10 ||                          // 10.0.0.0/8
    a === 127 ||                         // 127.0.0.0/8 loopback
    (a === 169 && b === 254) ||          // 169.254.0.0/16 link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||          // 192.168.0.0/16
    a >= 224                             // multicast + reserved
  )
}

export function istPrivateIPv6(addr: string): boolean {
  const a = addr.toLowerCase().trim()
  if (a === "::1" || a === "::") return true  // loopback / unspecified
  if (a.startsWith("ff")) return true         // ff00::/8 multicast

  // Link-local fe80::/10 → fe80–febf
  if (a.length >= 4) {
    const prefix = parseInt(a.slice(0, 4), 16)
    if (!isNaN(prefix) && prefix >= 0xfe80 && prefix <= 0xfebf) return true
  }

  if (a.startsWith("fc") || a.startsWith("fd")) return true // fc00::/7 ULA

  // IPv4-mapped: ::ffff:x.x.x.x (gemischte Notation, direkt eingegeben)
  if (a.startsWith("::ffff:") && a.includes(".")) {
    return istPrivateIPv4(a.slice(7))
  }

  // IPv4-mapped: ::ffff:xxxx:xxxx (nach WHATWG URL-Normalisierung)
  // z. B. [::ffff:127.0.0.1] → Hostname [::ffff:7f00:1]
  if (a.startsWith("::ffff:") && !a.includes(".")) {
    const rest = a.slice(7)
    const teile = rest.split(":")
    if (teile.length === 2) {
      const high = parseInt(teile[0], 16)
      const low = parseInt(teile[1], 16)
      if (!isNaN(high) && !isNaN(low)) {
        const ipv4 = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`
        return istPrivateIPv4(ipv4)
      }
    }
  }

  return false
}

// ─── Verbindungszeit-Lookup (DNS-Rebinding-Schutz) ───────────────────────────
// node:https ruft diese Funktion beim Verbindungsaufbau auf — zu einem Zeitpunkt,
// zu dem die aufgelöste IP direkt für die TCP-Verbindung verwendet wird.
// Damit ist der TOCTOU-Angriff (zwischen Prüfung und Verbindung) ausgeschlossen.

export function verbindungsLookup(
  hostname: string,
  options: LookupOptions,
  // Dritte Überladungsform: string-Einzel- oder LookupAddress[]-Array je nach options.all
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
): void {
  // Node 20+ (autoSelectFamily default-on) ruft lookup mit { all: true } auf und erwartet
  // den Callback mit (null, LookupAddress[]) — nicht (null, string, number).
  // Bug vor dem Fix: callback(null, first.address, first.family) → ERR_INVALID_ARG_TYPE.
  if ((options as LookupAllOptions).all === true) {
    dns.lookup(hostname, options as LookupAllOptions, (err, addresses) => {
      if (err) { callback(err, ""); return }
      for (const { address, family: fam } of addresses) {
        if (fam === 4 && istPrivateIPv4(address)) {
          callback(Object.assign(new Error("SSRF_BLOCKED"), { code: "EBLOCKED" }), "")
          return
        }
        if (fam === 6 && istPrivateIPv6(address)) {
          callback(Object.assign(new Error("SSRF_BLOCKED"), { code: "EBLOCKED" }), "")
          return
        }
      }
      const first = addresses[0]
      if (!first) {
        callback(Object.assign(new Error("Hostname konnte nicht aufgelöst werden"), { code: "ENOTFOUND" }), "")
        return
      }
      // Alle Adressen geprüft und öffentlich — vollständiges Array zurückgeben
      callback(null, addresses)
    })
  } else {
    dns.lookup(hostname, options as LookupOneOptions, (err, address, family) => {
      if (err) { callback(err, "", 4); return }
      if (family === 4 && istPrivateIPv4(address)) {
        callback(Object.assign(new Error("SSRF_BLOCKED"), { code: "EBLOCKED" }), "", 4)
        return
      }
      if (family === 6 && istPrivateIPv6(address)) {
        callback(Object.assign(new Error("SSRF_BLOCKED"), { code: "EBLOCKED" }), "", 6)
        return
      }
      callback(null, address, family)
    })
  }
}

// ─── Vorab-Hostname-Prüfung (für Speichern + Nutzerfehlermeldungen) ───────────

async function pruefeHostname(hostname: string): Promise<void> {
  // IPv4-Literal direkt prüfen (kein DNS nötig)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (istPrivateIPv4(hostname)) {
      throw new SSRFFehler("Dieser Kalender-Link ist nicht erlaubt (interne Adresse).", "PRIVATE_IP")
    }
    return
  }
  // IPv6-Literal in eckigen Klammern (URL-Syntax)
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    if (istPrivateIPv6(hostname.slice(1, -1))) {
      throw new SSRFFehler("Dieser Kalender-Link ist nicht erlaubt (interne Adresse).", "PRIVATE_IP")
    }
    return
  }
  // DNS-Lookup: alle IPs müssen öffentlich sein
  let adressen: LookupAddress[]
  try {
    adressen = await dnsLookupPromise(hostname, { all: true } as LookupAllOptions)
  } catch {
    throw new SSRFFehler("Das Portal ist nicht erreichbar – der Server konnte nicht gefunden werden.", "DNS")
  }
  if (!adressen || adressen.length === 0) {
    throw new SSRFFehler("Das Portal ist nicht erreichbar – der Server konnte nicht gefunden werden.", "DNS")
  }
  for (const { address, family } of adressen) {
    if (family === 4 && istPrivateIPv4(address)) {
      throw new SSRFFehler("Dieser Kalender-Link ist nicht erlaubt (interne Adresse).", "PRIVATE_IP")
    }
    if (family === 6 && istPrivateIPv6(address)) {
      throw new SSRFFehler("Dieser Kalender-Link ist nicht erlaubt (interne Adresse).", "PRIVATE_IP")
    }
  }
}

// ─── Öffentliche API ─────────────────────────────────────────────────────────

/** Validiert und normalisiert eine iCal-URL (ohne Abruf). Für POST/PUT. */
export async function validiereUndNormalisiereIcalUrl(urlString: string): Promise<string> {
  const url = normalisiereUrl(urlString)
  pruefeStruktur(url)
  await pruefeHostname(url.hostname)
  return url.toString()
}

/**
 * Validiert + ruft eine iCal-URL sicher ab.
 * DNS-Prüfung sowohl vor als auch zum Verbindungszeitpunkt (verbindungsLookup).
 * Größenlimit: 5 MB (Streaming, gilt für entpackten Inhalt).
 * BEGIN:VCALENDAR-Check, max. 3 Redirects (jeder Hop neu validiert).
 */
export async function holeSicherIcal(urlString: string): Promise<string> {
  const validiert = await validiereUndNormalisiereIcalUrl(urlString)
  return holePerHttps(new URL(validiert), MAX_UMLEITUNGEN)
}

async function holePerHttps(url: URL, verbleibend: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let abgeschlossen = false
    const erledige = (fn: () => void) => {
      if (!abgeschlossen) { abgeschlossen = true; clearTimeout(timer); fn() }
    }

    const timer = setTimeout(() => {
      erledige(() => reject(new SSRFFehler(
        "Das Portal antwortet nicht (Zeitüberschreitung).",
        "TIMEOUT",
      )))
      req.destroy()
    }, TIMEOUT_MS)

    const req = https.request(
      {
        hostname: url.hostname,
        port: Number(url.port) || 443,
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          "User-Agent": "stundenfassen/1.0 (iCal fetcher)",
          Accept: "text/calendar, */*;q=0.8",
          "Accept-Encoding": "identity", // Komprimierung deaktiviert: Limit gilt für rohen Inhalt
          Host: url.hostname,
        },
        // Verbindungszeit-Lookup: TOCTOU-sicher, da DNS-Prüfung beim TCP-Verbindungsaufbau
        lookup: verbindungsLookup,
      },
      (res: IncomingMessage) => {
        // Redirect manuell folgen — jeder Schritt wird neu validiert
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          res.resume()
          if (verbleibend <= 0) {
            erledige(() => reject(new SSRFFehler(
              "Der Kalender-Link führt über zu viele Weiterleitungen.",
              "REDIRECT",
            )))
            return
          }
          const location = res.headers.location as string | undefined
          if (!location) {
            erledige(() => reject(new SSRFFehler(
              "Der Kalender-Link führt zu einer ungültigen Weiterleitung.",
              "REDIRECT",
            )))
            return
          }
          let naechste: URL
          try { naechste = new URL(location, url) } catch {
            erledige(() => reject(new SSRFFehler(
              "Der Kalender-Link führt zu einer ungültigen Weiterleitung.",
              "REDIRECT",
            )))
            return
          }
          try { pruefeStruktur(naechste) } catch (e) {
            erledige(() => reject(e)); return
          }
          clearTimeout(timer)
          pruefeHostname(naechste.hostname)
            .then(() => holePerHttps(naechste, verbleibend - 1))
            .then(resolve)
            .catch(reject)
          return
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume()
          const status = res.statusCode ?? 0
          let meldung: string
          if (status === 401 || status === 403) {
            meldung = "Das Portal erfordert eine Anmeldung – dieser Kalender-Link ist nicht öffentlich zugänglich."
          } else if (status >= 400 && status < 500) {
            meldung = "Das Portal hat die Anfrage abgelehnt – bitte den Kalender-Link prüfen."
          } else {
            meldung = "Das Portal ist derzeit nicht erreichbar."
          }
          erledige(() => reject(new SSRFFehler(meldung, "HTTP_STATUS")))
          return
        }

        // Content-Type prüfen (Warnung, kein Abbruch — einige Server schicken text/plain)
        const contentType = res.headers["content-type"] ?? ""
        const hatFremdenContentType =
          contentType.length > 0 &&
          !contentType.includes("text/calendar") &&
          !contentType.includes("text/plain") &&
          !contentType.includes("application/octet-stream")

        // Streaming-Größenlimit: Abbruch sobald mehr als MAX_ANTWORT_BYTES ankommen
        let bytesGelesen = 0
        const teile: Buffer[] = []

        res.on("data", (chunk: Buffer) => {
          if (abgeschlossen) return
          bytesGelesen += chunk.length
          if (bytesGelesen > MAX_ANTWORT_BYTES) {
            erledige(() => reject(new SSRFFehler("Der Kalender-Link liefert zu viele Daten.", "ZU_GROSS")))
            req.destroy()
            return
          }
          teile.push(chunk)
        })

        res.on("end", () => {
          const rawText = Buffer.concat(teile).toString("utf-8")
          // BOM (﻿) und führende Leerzeichen entfernen — trimStart() erfasst ﻿ nicht immer.
          const text = rawText.replace(/^﻿/, "").trimStart()

          if (!text.startsWith("BEGIN:VCALENDAR")) {
            if (hatFremdenContentType) {
              erledige(() => reject(new SSRFFehler(
                "Das Portal hat keinen Kalender geliefert (möglicherweise ist eine Anmeldung nötig).",
                "CONTENT_TYPE",
              )))
            } else {
              erledige(() => reject(new SSRFFehler(
                "Das Portal hat keinen Kalender geliefert – evtl. ist eine Anmeldung nötig oder der Link ist abgelaufen.",
                "KEIN_VCALENDAR",
              )))
            }
            return
          }
          erledige(() => resolve(rawText))
        })

        res.on("error", () => {
          erledige(() => reject(new SSRFFehler(
            "Das Portal ist nicht erreichbar.",
            "DNS",
          )))
        })
      },
    )

    req.on("error", (err: NodeJS.ErrnoException) => {
      erledige(() => {
        if (err.code === "EBLOCKED") {
          reject(new SSRFFehler("Dieser Kalender-Link ist nicht erlaubt (interne Adresse).", "PRIVATE_IP"))
        } else if (err.code && TLS_FEHLER_CODES.has(err.code)) {
          console.error("[ical] TLS_FEHLER:", err.code)
          reject(new SSRFFehler(
            "Das Portal hat ein ungültiges TLS-Zertifikat. Bitte den Kalender-Link prüfen.",
            "TLS_FEHLER",
          ))
        } else if (NETZ_FEHLER_CODES.has(err.code ?? "")) {
          reject(new SSRFFehler("Das Portal ist nicht erreichbar.", "DNS"))
        } else {
          // Unerwarteter Programmfehler — nicht als Netzfehler ausgeben
          console.error("[ical] INTERN:", err.constructor?.name ?? "Error", err.code ?? "(kein Code)", err.message.replace(/https?:\/\/[^\s"']+/g, "[URL]"))
          reject(new SSRFFehler("Interner Fehler beim Kalenderabruf.", "INTERN"))
        }
      })
    })

    req.end()
  })
}
