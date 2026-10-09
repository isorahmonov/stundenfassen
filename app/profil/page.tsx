"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, reauthenticateWithPopup } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase/client"
import { resolveStatus } from "@/lib/verfuegbarkeit/status"
import type { TerminRoh } from "@/lib/verfuegbarkeit/eventCache"
import type { Employer, MinusEintrag, EmailVorlage, Settings, Steuerklasse } from "@/lib/types"
import { minusEintraege as minusRepo, employers as employersRepo, emailVorlagen as emailVorlageRepo, settings as settingsRepo } from "@/lib/storage"
import type { MinusEintragInput } from "@/lib/storage"
import { BaseDialog } from "../components/BaseDialog"
import { Toggle } from "../components/Toggle"
import { ThemeToggle } from "../components/ThemeToggle"

const BERLIN = "Europe/Berlin"

interface KalenderInfo {
  id: string
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
}

interface KalenderFormDaten {
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
  url?: string
}

async function getToken() {
  const t = await auth.currentUser?.getIdToken()
  if (!t) throw new Error("Nicht angemeldet")
  return t
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${(b as Record<string, string>).fehler ?? res.statusText}`)
  }
  return res.json()
}

type Sektion = "kalender" | "arbeitgeber" | "minus" | "email" | "emailKonto" | "steuer" | "erscheinungsbild"

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function ProfilSeite() {
  const [offen, setOffen] = useState<Set<Sektion>>(new Set())

  const [kalender, setKalender] = useState<KalenderInfo[]>([])
  const [neuKalenderOffen, setNeuKalenderOffen] = useState(false)

  const [minus, setMinus] = useState<MinusEintrag[]>([])
  const [minusFormOffen, setMinusFormOffen] = useState(false)
  const [minusVersion, setMinusVersion] = useState(0)

  const [arbeitgeber, setArbeitgeber] = useState<Employer[]>([])
  const [arbeitgeberAnzahl, setArbeitgeberAnzahl] = useState(0)

  const [vorlagen, setVorlagen] = useState<EmailVorlage[]>([])
  const [neuVorlageOffen, setNeuVorlageOffen] = useState(false)
  const [bearbeitenVorlageId, setBearbeitenVorlageId] = useState<string | null>(null)

  const [steuerDaten, setSteuerDaten] = useState<Pick<Settings, "steuerklasse" | "kirchensteuer">>({
    steuerklasse: 1,
    kirchensteuer: false,
  })
  const [steuerLaden, setSteuerLaden] = useState(false)

  const [emailKonfiguriert, setEmailKonfiguriert] = useState(false)
  const [emailGmailUser, setEmailGmailUser] = useState("")
  const [emailFormOffen, setEmailFormOffen] = useState(false)
  const [emailLaden, setEmailLaden] = useState(false)

  const [fehler, setFehler] = useState("")

  const [abmeldenOffen, setAbmeldenOffen] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)
  const [exportOffen, setExportOffen] = useState(false)
  const nutzerEmail = auth.currentUser?.email ?? ""

  useEffect(() => { ladeKalender() }, [])
  useEffect(() => { minusRepo.findAlle().then(setMinus).catch(() => {}) }, [minusVersion])
  useEffect(() => { ladeArbeitgeber() }, [])
  useEffect(() => { ladeVorlagen() }, [])
  useEffect(() => { ladeEmailConfig() }, [])
  useEffect(() => {
    settingsRepo.get().then(s => {
      if (s) setSteuerDaten({ steuerklasse: s.steuerklasse, kirchensteuer: s.kirchensteuer })
    }).catch(() => {})
  }, [])

  async function ladeArbeitgeber() {
    try {
      const emps = await employersRepo.findAktive()
      setArbeitgeber(emps)
      setArbeitgeberAnzahl(emps.length)
    } catch { /* ignorieren */ }
  }

  async function ladeVorlagen() {
    try {
      const vl = await emailVorlageRepo.findAlle()
      setVorlagen(vl)
    } catch { /* ignorieren */ }
  }

  async function ladeEmailConfig() {
    try {
      const d = await api("/api/email-config") as { konfiguriert: boolean; gmailUser?: string }
      setEmailKonfiguriert(d.konfiguriert)
      setEmailGmailUser(d.gmailUser ?? "")
      if (!d.konfiguriert) setEmailFormOffen(true)
    } catch { /* ignorieren */ }
  }

  async function speichernEmailConfig(gmailUser: string, gmailAppPassword: string) {
    setEmailLaden(true)
    try {
      await api("/api/email-config", {
        method: "POST",
        body: JSON.stringify({ gmailUser, gmailAppPassword }),
      })
      await ladeEmailConfig()
      setEmailFormOffen(false)
    } catch (e) { setFehler(String(e)) }
    finally { setEmailLaden(false) }
  }

  async function entfernenEmailConfig() {
    if (!confirm("E-Mail-Konto wirklich entfernen?")) return
    setEmailLaden(true)
    try {
      await api("/api/email-config", { method: "DELETE" })
      await ladeEmailConfig()
      setEmailFormOffen(true)
    } catch (e) { setFehler(String(e)) }
    finally { setEmailLaden(false) }
  }

  async function toggleKurzfristigPauschal(emp: Employer) {
    try {
      await employersRepo.update(emp.id, { kurzfristigPauschal: !emp.kurzfristigPauschal })
      ladeArbeitgeber()
    } catch (e) { setFehler(String(e)) }
  }

  async function toggleMinusImPDF(emp: Employer) {
    try {
      await employersRepo.update(emp.id, { minusImPDFAnzeigen: emp.minusImPDFAnzeigen !== false ? false : true })
      ladeArbeitgeber()
    } catch (e) { setFehler(String(e)) }
  }

  async function speichernSteuer() {
    setSteuerLaden(true)
    try {
      await settingsRepo.save(steuerDaten)
    } catch (e) { setFehler(String(e)) }
    finally { setSteuerLaden(false) }
  }

  async function abmelden() {
    // Alle App-eigenen localStorage-Einträge löschen (iCal-Cache + Block-Auswahl)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith("sf_ical2_") || k.startsWith("sf_sel_"))) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    await signOut(auth)
    // AuthGate erkennt den Logout via onAuthStateChanged und zeigt den Login-Screen
  }

  async function kontoLoeschen() {
    if (!auth.currentUser) throw new Error("Nicht angemeldet")
    // Frische Google-Bestätigung via Popup (Pflicht vor Konto-Löschung).
    // iOS-Homescreen-PWA blockiert Popups (auth/popup-blocked) — in dem Fall
    // klaren Hinweis geben. Muss im iOS-PWA-Modus getestet werden.
    try {
      await reauthenticateWithPopup(auth.currentUser, googleProvider)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        throw new Error(
          "Das Anmelde-Popup wurde blockiert. Bitte öffne die App im Browser (Safari → Teilen → In Browser öffnen) und versuche es erneut.",
        )
      }
      throw e
    }
    const token = await auth.currentUser.getIdToken(true)

    const res = await fetch("/api/konto/loeschen", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error((b as Record<string, string>).fehler ?? `Fehler ${res.status}`)
    }

    // Alle sf_* localStorage-Schlüssel löschen
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith("sf_")) keysToRemove.push(k)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // Service-Worker-Caches leeren
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    }

    await signOut(auth)
  }

  async function exportiereDaten(): Promise<void> {
    const token = await getToken()
    const res = await fetch("/api/konto/export", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error((b as Record<string, string>).fehler ?? `Fehler ${res.status}`)
    }
    const blob = await res.blob()
    const datum = new Date().toISOString().slice(0, 10)
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `shiftslot-export-${datum}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  async function ladeKalender() {
    try {
      const d = await api("/api/ical") as { kalender: KalenderInfo[] }
      setKalender(d.kalender)
    } catch (e) { setFehler(String(e)) }
  }

  async function erstelleKalender(data: KalenderFormDaten) {
    await api("/api/ical", { method: "POST", body: JSON.stringify(data) })
    setNeuKalenderOffen(false)
    ladeKalender()
  }

  async function aktualisiereKalender(id: string, data: Partial<KalenderFormDaten>) {
    await api(`/api/ical/${id}`, { method: "PUT", body: JSON.stringify(data) })
    ladeKalender()
  }

  async function loescheKalender(id: string) {
    await api(`/api/ical/${id}`, { method: "DELETE" })
    ladeKalender()
  }

  function toggle(s: Sektion) {
    setOffen((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-10">

        <header className="mb-8">
          <h1 className="text-xl font-bold sf-text">Profil</h1>
        </header>

        {fehler && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        <div className="space-y-3">

          {/* ── Kalender ───────────────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="Kalender"
            symbol={<KalenderIcon />}
            badge={kalender.length > 0 ? String(kalender.length) : undefined}
            offen={offen.has("kalender")}
            onToggle={() => toggle("kalender")}
          >
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide">Kalender verwalten</p>
                <button
                  onClick={() => setNeuKalenderOffen((o) => !o)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white text-lg font-light active:scale-90 transition-all"
                  style={{ backgroundColor: "#2563eb" }}
                  aria-label="Neuen Kalender hinzufügen"
                >+</button>
              </div>

              {neuKalenderOffen && (
                <KalenderFormular
                  onSpeichern={(d) => erstelleKalender(d).catch((e) => setFehler(String(e)))}
                  onAbbrechen={() => setNeuKalenderOffen(false)}
                />
              )}

              {kalender.length === 0 && !neuKalenderOffen && (
                <div className="rounded-xl p-6 text-center bg-stone-50 dark:bg-neutral-800/50">
                  <p className="text-sm sf-text-2 mb-1">Noch keine Kalender.</p>
                  <button onClick={() => setNeuKalenderOffen(true)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Ersten anlegen →
                  </button>
                </div>
              )}

              {kalender.map((k) => (
                <KalenderKarte
                  key={k.id}
                  kalender={k}
                  onAktualisieren={(d) => aktualisiereKalender(k.id, d).catch((e) => setFehler(String(e)))}
                  onLoeschen={() => {
                    if (confirm(`„${k.name}" wirklich löschen?`))
                      loescheKalender(k.id).catch((e) => setFehler(String(e)))
                  }}
                />
              ))}
            </div>
          </AkkordeonAbschnitt>

          {/* ── Arbeitgeber ─────────────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="Arbeitgeber"
            symbol={<ArbeitgeberIcon />}
            badge={arbeitgeberAnzahl > 0 ? String(arbeitgeberAnzahl) : undefined}
            offen={offen.has("arbeitgeber")}
            onToggle={() => toggle("arbeitgeber")}
          >
            <div className="pt-3">
              <Link
                href="/profil/arbeitgeber"
                className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/50 px-4 py-3.5 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors active:scale-[.99]"
              >
                <span className="text-sm font-medium sf-text">Arbeitgeber verwalten</span>
                <span className="text-stone-400 dark:text-neutral-500 text-lg leading-none">›</span>
              </Link>
            </div>
          </AkkordeonAbschnitt>

          {/* ── Minusstunden ────────────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="Minusstunden"
            symbol={<MinusIcon />}
            badge={minus.length > 0 ? String(minus.length) : undefined}
            offen={offen.has("minus")}
            onToggle={() => toggle("minus")}
          >
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide">Einträge</p>
                <button
                  onClick={() => setMinusFormOffen((o) => !o)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white text-lg font-light active:scale-90 transition-all"
                  style={{ backgroundColor: "#dc2626" }}
                  aria-label="Minusstunden eintragen"
                >+</button>
              </div>

              {minusFormOffen && (
                <MinusFormular
                  employers={arbeitgeber}
                  onSpeichern={async (d) => {
                    try {
                      await minusRepo.add(d)
                      setMinusFormOffen(false)
                      setMinusVersion((v) => v + 1)
                    } catch (e) { setFehler(String(e)) }
                  }}
                  onAbbrechen={() => setMinusFormOffen(false)}
                />
              )}

              {minus.length === 0 && !minusFormOffen && (
                <div className="rounded-xl p-6 text-center bg-stone-50 dark:bg-neutral-800/50">
                  <p className="text-sm sf-text-2 mb-1">Keine Minusstunden eingetragen.</p>
                  <button onClick={() => setMinusFormOffen(true)}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                    Ersten eintragen →
                  </button>
                </div>
              )}

              {minus.map((e) => {
                const emp = arbeitgeber.find((a) => a.id === e.employerId)
                return (
                  <div key={e.id} className="sf-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium sf-text">
                          {new Date(e.datum + "T12:00:00").toLocaleDateString("de-DE", {
                            weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
                          })}
                          {"  "}
                          <span className="font-semibold text-red-600 dark:text-red-400 nums">
                            −{(e.minuten / 60).toFixed(1).replace(".", ",")} Std.
                          </span>
                        </p>
                        {emp && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: emp.farbe }}
                          >
                            {emp.name}
                          </span>
                        )}
                      </div>
                      {e.notiz && <p className="text-xs sf-text-2 truncate mt-0.5">{e.notiz}</p>}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Eintrag löschen?"))
                          minusRepo.remove(e.id)
                            .then(() => setMinusVersion((v) => v + 1))
                            .catch((err) => setFehler(String(err)))
                      }}
                      className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      Löschen
                    </button>
                  </div>
                )
              })}

              {/* PDF-Toggle pro Arbeitgeber */}
              {arbeitgeber.length > 0 && (
                <div className="border-t border-stone-100 dark:border-white/5 pt-3 mt-1">
                  <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide mb-2">PDF-Anzeige</p>
                  <div className="space-y-2">
                    {arbeitgeber.map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: emp.farbe }} />
                          <span className="text-sm sf-text">{emp.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sf-text-3">Minusstunden im PDF</span>
                          <Toggle
                            checked={emp.minusImPDFAnzeigen !== false}
                            onChange={() => toggleMinusImPDF(emp)}
                            label="Minusstunden im PDF anzeigen"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AkkordeonAbschnitt>

          {/* ── E-Mail-Vorlagen ──────────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="E-Mail-Vorlagen"
            symbol={<MailIcon />}
            badge={vorlagen.length > 0 ? String(vorlagen.length) : undefined}
            offen={offen.has("email")}
            onToggle={() => toggle("email")}
          >
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide">Vorlagen</p>
                <button
                  onClick={() => { setNeuVorlageOffen(true); setBearbeitenVorlageId(null) }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white text-lg font-light active:scale-90 transition-all"
                  style={{ backgroundColor: "#2563eb" }}
                  aria-label="Neue Vorlage"
                >+</button>
              </div>

              {neuVorlageOffen && (
                <VorlageFormular
                  onSpeichern={async (d) => {
                    try {
                      await emailVorlageRepo.add(d)
                      setNeuVorlageOffen(false)
                      ladeVorlagen()
                    } catch (e) { setFehler(String(e)) }
                  }}
                  onAbbrechen={() => setNeuVorlageOffen(false)}
                />
              )}

              {vorlagen.length === 0 && !neuVorlageOffen && (
                <div className="rounded-xl p-6 text-center bg-stone-50 dark:bg-neutral-800/50">
                  <p className="text-sm sf-text-2 mb-1">Noch keine Vorlagen.</p>
                  <button onClick={() => setNeuVorlageOffen(true)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Erste anlegen →
                  </button>
                </div>
              )}

              {vorlagen.map((v) =>
                bearbeitenVorlageId === v.id ? (
                  <VorlageFormular
                    key={v.id}
                    initial={v}
                    istBearbeitung
                    onSpeichern={async (d) => {
                      try {
                        await emailVorlageRepo.update(v.id, d)
                        setBearbeitenVorlageId(null)
                        ladeVorlagen()
                      } catch (e) { setFehler(String(e)) }
                    }}
                    onAbbrechen={() => setBearbeitenVorlageId(null)}
                  />
                ) : (
                  <div key={v.id} className="sf-card rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-semibold sf-text truncate">{v.name}</p>
                    <p className="text-xs sf-text-2 truncate mt-0.5">{v.betreff}</p>
                    <div className="flex gap-3 mt-2 pt-2 border-t border-stone-100 dark:border-white/5">
                      <button
                        onClick={() => { setBearbeitenVorlageId(v.id); setNeuVorlageOffen(false) }}
                        className="text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 transition-colors"
                      >Bearbeiten</button>
                      <span className="text-stone-200 dark:text-neutral-700">·</span>
                      <button
                        onClick={() => {
                          if (confirm(`„${v.name}" löschen?`))
                            emailVorlageRepo.remove(v.id).then(ladeVorlagen).catch((e) => setFehler(String(e)))
                        }}
                        className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                      >Löschen</button>
                    </div>
                  </div>
                )
              )}

              <div className="rounded-xl bg-stone-50 dark:bg-neutral-800/50 px-3 py-2.5">
                <p className="text-xs sf-text-3">
                  Platzhalter:{" "}
                  {["{{name}}", "{{personalnummer}}", "{{zeitraum_von}}", "{{zeitraum_bis}}"].map((p) => (
                    <code key={p} className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-neutral-700 text-xs font-mono">{p}</code>
                  ))}
                </p>
              </div>
            </div>
          </AkkordeonAbschnitt>

          {/* ── E-Mail-Versand (Konto) ──────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="E-Mail-Versand"
            symbol={<EmailKontoIcon />}
            badge={emailKonfiguriert ? "✓" : undefined}
            offen={offen.has("emailKonto")}
            onToggle={() => toggle("emailKonto")}
          >
            <div className="pt-3 space-y-3">
              <p className="text-xs sf-text-3 leading-relaxed">
                Verfügbarkeiten werden über dein eigenes Gmail-Konto versendet.
                Du benötigst ein{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  App-Passwort
                </a>
                {" "}(2FA aktivieren → myaccount.google.com/apppasswords).
              </p>

              {emailKonfiguriert && !emailFormOffen ? (
                <div className="sf-card rounded-2xl p-4 shadow-sm space-y-3">
                  <div>
                    <p className="text-xs sf-text-2 mb-0.5">Gmail-Adresse</p>
                    <p className="text-sm font-medium sf-text">{emailGmailUser}</p>
                  </div>
                  <div>
                    <p className="text-xs sf-text-2 mb-0.5">App-Passwort</p>
                    <p className="text-sm sf-text font-mono tracking-widest">••••••••••••••••</p>
                  </div>
                  <div className="flex gap-3 pt-1 border-t border-stone-100 dark:border-white/5">
                    <button
                      onClick={() => setEmailFormOffen(true)}
                      className="text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 transition-colors"
                    >Ändern</button>
                    <span className="text-stone-200 dark:text-neutral-700">·</span>
                    <button
                      onClick={entfernenEmailConfig}
                      disabled={emailLaden}
                      className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >Entfernen</button>
                  </div>
                </div>
              ) : (
                <EmailKontoFormular
                  initialGmailUser={emailGmailUser}
                  istBearbeitung={emailKonfiguriert}
                  laden={emailLaden}
                  onSpeichern={speichernEmailConfig}
                  onAbbrechen={emailKonfiguriert ? () => setEmailFormOffen(false) : undefined}
                />
              )}
            </div>
          </AkkordeonAbschnitt>

          {/* ── Steuer-Einstellungen ────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="Steuer-Einstellungen"
            symbol={<SteuerIcon />}
            offen={offen.has("steuer")}
            onToggle={() => toggle("steuer")}
          >
            <div className="pt-3 space-y-4">
              <div>
                <p className="text-xs sf-text-2 mb-2">Steuerklasse</p>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5, 6] as Steuerklasse[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSteuerDaten((d) => ({ ...d, steuerklasse: k }))}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                        steuerDaten.steuerklasse === k
                          ? "bg-blue-600 text-white"
                          : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm sf-text">Kirchensteuer</p>
                <Toggle
                  checked={steuerDaten.kirchensteuer}
                  onChange={(v) => setSteuerDaten((d) => ({ ...d, kirchensteuer: v }))}
                  label="Kirchensteuer"
                />
              </div>

              {arbeitgeber.filter((e) => e.art === "kurzfristig").length > 0 && (
                <div>
                  <p className="text-xs sf-text-2 mb-2">Lohnsteuer pauschal 25 % (§40a EStG)</p>
                  <div className="space-y-2">
                    {arbeitgeber.filter((e) => e.art === "kurzfristig").map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: emp.farbe }} />
                          <span className="text-sm sf-text">{emp.name}</span>
                        </div>
                        <Toggle
                          checked={emp.kurzfristigPauschal ?? false}
                          onChange={() => toggleKurzfristigPauschal(emp)}
                          label={`Lohnsteuer pauschal 25% für ${emp.name}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={speichernSteuer}
                disabled={steuerLaden}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.99] transition-all disabled:opacity-40"
              >
                {steuerLaden ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </AkkordeonAbschnitt>

          {/* ── Erscheinungsbild ──────────────────────────────────────────── */}
          <AkkordeonAbschnitt
            titel="Erscheinungsbild"
            symbol={<ErscheinungsbildIcon />}
            offen={offen.has("erscheinungsbild")}
            onToggle={() => toggle("erscheinungsbild")}
          >
            <div className="pt-1 pb-2">
              <p className="text-xs sf-text-3 mb-3">Farbschema</p>
              <ThemeToggle />
            </div>
          </AkkordeonAbschnitt>

          {/* ── Konto ────────────────────────────────────────────────────── */}
          <div className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400 flex-shrink-0">
                <KontoIcon />
              </span>
              <span className="text-sm font-semibold sf-text">Konto</span>
            </div>
            <div className="border-t border-stone-100 dark:border-white/5 pt-3 space-y-3">
              <div>
                <p className="text-xs sf-text-3 mb-0.5">Angemeldet als</p>
                <p className="text-sm sf-text font-medium break-all">{nutzerEmail || "–"}</p>
              </div>
              <button
                onClick={() => setAbmeldenOffen(true)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white active:scale-[.99] transition-all"
                style={{ backgroundColor: "#2563eb" }}
              >
                Abmelden
              </button>
              <button
                onClick={() => setExportOffen(true)}
                className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 active:scale-[.99] transition-all"
              >
                Daten exportieren
              </button>
              <button
                onClick={() => setLoeschenOffen(true)}
                className="w-full rounded-xl border border-red-200 dark:border-red-900/40 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[.99] transition-all"
              >
                Konto löschen
              </button>
              <div className="flex justify-center gap-4 pt-1">
                <Link href="/datenschutz" className="text-xs sf-text-3 hover:underline">
                  Datenschutz
                </Link>
                <span className="text-xs sf-text-3">·</span>
                <Link href="/impressum" className="text-xs sf-text-3 hover:underline">
                  Impressum
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {abmeldenOffen && (
        <AbmeldenDialog
          email={nutzerEmail}
          onBestaetigen={abmelden}
          onAbbrechen={() => setAbmeldenOffen(false)}
        />
      )}

      {loeschenOffen && (
        <KontoLoeschenDialog
          email={nutzerEmail}
          onLoeschen={kontoLoeschen}
          onAbbrechen={() => setLoeschenOffen(false)}
        />
      )}

      {exportOffen && (
        <DatenExportDialog
          onExportieren={exportiereDaten}
          onAbbrechen={() => setExportOffen(false)}
        />
      )}
    </main>
  )
}

// ─── AkkordeonAbschnitt ───────────────────────────────────────────────────────

function AkkordeonAbschnitt({
  titel,
  symbol,
  badge,
  offen,
  onToggle,
  children,
}: {
  titel: string
  symbol: React.ReactNode
  badge?: string
  offen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="sf-card rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-stone-50 dark:hover:bg-white/5 transition-colors active:bg-stone-100 dark:active:bg-white/10"
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400 flex-shrink-0">
          {symbol}
        </span>
        <span className="flex-1 text-sm font-semibold sf-text">{titel}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 sf-text-2 mr-1">
            {badge}
          </span>
        )}
        <span className={`text-stone-400 dark:text-neutral-500 text-lg leading-none transition-transform duration-150 ${offen ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {offen && (
        <div className="border-t border-stone-100 dark:border-white/5 px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function KalenderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="12" height="12" rx="1.5"/>
      <path d="M11 1v3M5 1v3M2 7h12"/>
    </svg>
  )
}

function ArbeitgeberIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="7" width="12" height="8" rx="1.5"/>
      <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="8" cy="8" r="6"/>
      <path d="M5 8h6"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="12" height="9" rx="1.5"/>
      <path d="M2 5l6 4.5L14 5"/>
    </svg>
  )
}

function EmailKontoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7.5" cy="7.5" r="2.5"/>
      <path d="M10 7.5a2.5 2.5 0 1 0-2.5 2.5c1 0 1.5-.4 1.5-1V7.5M13 7.5a5.5 5.5 0 1 0-1.5 3.8"/>
    </svg>
  )
}

function SteuerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 13L13 3"/>
      <circle cx="4.5" cy="4.5" r="1.5"/>
      <circle cx="11.5" cy="11.5" r="1.5"/>
    </svg>
  )
}

function ErscheinungsbildIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="3"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M11.2 4.8l-1.4 1.4M4.8 11.2l-1.4 1.4"/>
    </svg>
  )
}

function KontoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
    </svg>
  )
}

// ─── AbmeldenDialog ─────────────────────────────────────────────────────────────

function AbmeldenDialog({
  email,
  onBestaetigen,
  onAbbrechen,
}: {
  email: string
  onBestaetigen: () => void
  onAbbrechen: () => void
}) {
  return (
    <BaseDialog onBackdropClick={onAbbrechen} maxWidth="max-w-sm">
      <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h2 className="text-base font-bold sf-text mb-1">Wirklich abmelden?</h2>
        {email && (
          <p className="text-sm sf-text-2 mb-4 break-all">
            Du wirst als <span className="font-medium sf-text">{email}</span> abgemeldet.
            Lokale Daten (Kalender-Cache, Auswahl) werden gelöscht.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onAbbrechen}
            className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onBestaetigen}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white active:scale-[.98] transition-all"
            style={{ backgroundColor: "#2563eb" }}
          >
            Abmelden
          </button>
        </div>
      </div>
    </BaseDialog>
  )
}

// ─── KontoLoeschenDialog ─────────────────────────────────────────────────────────

function KontoLoeschenDialog({
  email,
  onLoeschen,
  onAbbrechen,
}: {
  email: string
  onLoeschen: () => Promise<void>
  onAbbrechen: () => void
}) {
  const [eingabe, setEingabe] = useState("")
  const [fehler, setFehler] = useState("")
  const [laden, setLaden] = useState(false)

  const bestaetigt = eingabe === email || eingabe === "LÖSCHEN"

  async function handleBestaetigen() {
    if (!bestaetigt) return
    setLaden(true)
    setFehler("")
    try {
      await onLoeschen()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e))
      setLaden(false)
    }
  }

  return (
    <BaseDialog onBackdropClick={laden ? undefined : onAbbrechen} maxWidth="max-w-sm">
      <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
        <div>
          <h2 className="text-base font-bold sf-text mb-2">Konto unwiderruflich löschen?</h2>
          <p className="text-sm sf-text-2 leading-relaxed mb-1.5">
            Diese Aktion kann nicht rückgängig gemacht werden. Gelöscht werden:
          </p>
          <ul className="text-sm sf-text-2 leading-relaxed list-disc list-inside space-y-0.5 pl-1">
            <li>Alle Schichten, Arbeitgeber und Einstellungen</li>
            <li>E-Mail-Vorlagen und Abrechnungsabgleiche</li>
            <li>Geplante Schichten und Minusstunden-Einträge</li>
            <li>Kalender-URLs (inkl. Token) und iCal-Cache</li>
            <li>Gmail-Zugangsdaten</li>
            <li>Dein Google-Konto-Zugang zu dieser App</li>
          </ul>
        </div>

        <p className="text-sm sf-text-2 leading-relaxed">
          Es öffnet sich ein Google-Popup zur Bestätigung deiner Identität.
        </p>

        <div>
          <label className="text-xs sf-text-2 mb-1.5 block">
            Gib deine E-Mail-Adresse oder <span className="font-mono">LÖSCHEN</span> ein
          </label>
          <input
            type="text"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            placeholder={email || "LÖSCHEN"}
            disabled={laden}
            className="sf-input w-full rounded-xl px-3 py-2.5 text-sm disabled:opacity-50"
            autoComplete="off"
          />
        </div>

        {fehler && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            {fehler}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onAbbrechen}
            disabled={laden}
            className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            Abbrechen
          </button>
          <button
            onClick={handleBestaetigen}
            disabled={!bestaetigt || laden}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[.98] transition-all disabled:opacity-40"
          >
            {laden ? "Wird gelöscht…" : "Konto löschen"}
          </button>
        </div>
      </div>
    </BaseDialog>
  )
}

// ─── DatenExportDialog ───────────────────────────────────────────────────────────

function DatenExportDialog({
  onExportieren,
  onAbbrechen,
}: {
  onExportieren: () => Promise<void>
  onAbbrechen: () => void
}) {
  const [fehler, setFehler] = useState("")
  const [laden, setLaden] = useState(false)
  const [fertig, setFertig] = useState(false)

  async function handleExportieren() {
    setLaden(true)
    setFehler("")
    try {
      await onExportieren()
      setFertig(true)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e))
    } finally {
      setLaden(false)
    }
  }

  return (
    <BaseDialog onBackdropClick={laden ? undefined : onAbbrechen} maxWidth="max-w-sm">
      <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
        <h2 className="text-base font-bold sf-text">Daten exportieren</h2>

        <div className="space-y-2">
          <p className="text-sm sf-text-2 leading-relaxed">
            Die Exportdatei enthält:
          </p>
          <ul className="text-sm sf-text-2 leading-relaxed list-disc list-inside space-y-0.5 pl-1">
            <li>Schichten, Arbeitgeber, Einstellungen</li>
            <li>Minusstunden, geplante Schichten, Abgleiche</li>
            <li>E-Mail-Vorlagen</li>
            <li>Gmail-Adresse (falls hinterlegt)</li>
            <li>Kalender-Liste (Name, Farbe – keine URLs)</li>
          </ul>
          <p className="text-sm sf-text-2 leading-relaxed">
            <span className="font-medium sf-text">Nicht enthalten:</span>{" "}
            Passwörter und iCal-URLs. iCal-URLs enthalten persönliche
            Authentifizierungstoken und werden nicht exportiert.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Die Datei enthält personenbezogene Daten — bitte sicher aufbewahren.
          </p>
        </div>

        {fehler && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            {fehler}
          </p>
        )}

        {fertig && (
          <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-lg px-3 py-2">
            Export heruntergeladen.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onAbbrechen}
            disabled={laden}
            className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {fertig ? "Schließen" : "Abbrechen"}
          </button>
          {!fertig && (
            <button
              onClick={handleExportieren}
              disabled={laden}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white active:scale-[.98] transition-all disabled:opacity-40"
              style={{ backgroundColor: "#2563eb" }}
            >
              {laden ? "Wird erstellt…" : "Herunterladen"}
            </button>
          )}
        </div>
      </div>
    </BaseDialog>
  )
}

// ─── KalenderKarte ─────────────────────────────────────────────────────────────

function KalenderKarte({
  kalender: k,
  onAktualisieren,
  onLoeschen,
}: {
  kalender: KalenderInfo
  onAktualisieren: (d: Partial<KalenderFormDaten>) => void
  onLoeschen: () => void
}) {
  const [bearbeiten, setBearbeiten] = useState(false)
  const [termineOffen, setTermineOffen] = useState(false)

  return (
    <div className="sf-card rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: k.farbe }} />
          <div className="flex-1 min-w-0">
            <p className="font-medium sf-text truncate">{k.name}</p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              k.defaultStatus === "LOCKED"
                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}>{k.defaultStatus}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-stone-100 dark:border-white/5">
          <button onClick={() => { setBearbeiten((b) => !b); setTermineOffen(false) }}
            className="text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 transition-colors">
            {bearbeiten ? "Abbrechen" : "Bearbeiten"}
          </button>
          <span className="text-stone-200 dark:text-neutral-700">·</span>
          <button onClick={() => { setTermineOffen((t) => !t); setBearbeiten(false) }}
            className="text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 transition-colors">
            {termineOffen ? "Schließen" : "Termine prüfen"}
          </button>
          <span className="text-stone-200 dark:text-neutral-700">·</span>
          <button onClick={onLoeschen}
            className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">
            Löschen
          </button>
        </div>
      </div>

      {bearbeiten && (
        <div className="border-t border-stone-100 dark:border-white/5 p-4">
          <KalenderFormular
            initial={{ name: k.name, farbe: k.farbe, defaultStatus: k.defaultStatus }}
            onSpeichern={(d) => { onAktualisieren(d); setBearbeiten(false) }}
            onAbbrechen={() => setBearbeiten(false)}
            istBearbeitung
          />
        </div>
      )}

      {termineOffen && (
        <div className="border-t border-stone-100 dark:border-white/5">
          <TerminPruefer kalendarId={k.id} defaultStatus={k.defaultStatus} />
        </div>
      )}
    </div>
  )
}

// ─── KalenderFormular ──────────────────────────────────────────────────────────

function KalenderFormular({
  initial,
  onSpeichern,
  onAbbrechen,
  istBearbeitung = false,
}: {
  initial?: Partial<KalenderFormDaten>
  onSpeichern: (d: KalenderFormDaten) => void
  onAbbrechen: () => void
  istBearbeitung?: boolean
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [farbe, setFarbe] = useState(initial?.farbe ?? "#3b82f6")
  const [status, setStatus] = useState<"LOCKED" | "FLEXIBLE">(initial?.defaultStatus ?? "LOCKED")
  const [url, setUrl] = useState("")

  const istGooglePublic = url.includes("calendar.google.com") && url.includes("/public/")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const daten: KalenderFormDaten = { name, farbe, defaultStatus: status }
    if (url) daten.url = url
    if (!istBearbeitung && !url) return
    onSpeichern(daten)
  }

  const inputKlasse = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Name (z.B. HAW Stundenplan)" required
          className={`flex-1 ${inputKlasse}`} />
        <input type="color" value={farbe} onChange={(e) => setFarbe(e.target.value)}
          className="w-10 h-10 rounded-xl border border-stone-200 dark:border-neutral-700 cursor-pointer p-0.5 sf-input" />
      </div>

      <div className="flex gap-4 items-center">
        <span className="text-xs sf-text-2">Standard-Status:</span>
        {(["FLEXIBLE", "LOCKED"] as const).map((s) => (
          <label key={s} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={`status-${istBearbeitung ? "edit" : "new"}`}
              value={s} checked={status === s} onChange={() => setStatus(s)} />
            <span className={`text-xs font-medium ${s === "LOCKED" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {s}
            </span>
          </label>
        ))}
      </div>

      <div>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder={istBearbeitung ? "Neue URL (leer lassen = unverändert)" : "https://calendar.google.com/calendar/ical/…"}
          required={!istBearbeitung}
          className={`${inputKlasse} font-mono text-xs`} />
        {istBearbeitung ? (
          <p className="text-xs sf-text-3 mt-1">URL nur ausfüllen wenn du sie ändern möchtest.</p>
        ) : (
          <p className="text-xs sf-text-3 mt-1">
            iCal-Link (Kalender-Export). Bei Google: &quot;Geheime Adresse im iCal-Format&quot;. Bei Uni-Portalen: der iCal-Export-Link.
            Die Adresse ist wie ein Passwort.
          </p>
        )}
        {istGooglePublic && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Das ist die öffentliche Adresse. Sie funktioniert nur, wenn dein Kalender öffentlich ist. Sonst nimm die geheime Adresse (…/private-…/basic.ics).
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onAbbrechen}
          className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
          Abbrechen
        </button>
        <button type="submit"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-all"
          style={{ backgroundColor: farbe }}>
          {istBearbeitung ? "Speichern" : "Hinzufügen"}
        </button>
      </div>
    </form>
  )
}

// ─── TerminPruefer ──────────────────────────────────────────────────────────────

function TerminPruefer({
  kalendarId,
  defaultStatus,
}: {
  kalendarId: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
}) {
  const heute = new Date().toISOString().slice(0, 10)
  const [von, setVon] = useState(heute)
  const [bis, setBis] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  })
  const [termine, setTermine] = useState<TerminRoh[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  async function ladTermine() {
    setFehler(""); setLaden(true)
    try {
      const d = await api(`/api/ical?id=${kalendarId}&von=${von}&bis=${bis}`) as { termine: TerminRoh[] }
      setTermine(d.termine)
    } catch (e) { setFehler(String(e)) }
    finally { setLaden(false) }
  }

  function uhrzeit(iso: string) {
    return new Date(iso).toLocaleTimeString("de-DE", { timeZone: BERLIN, hour: "2-digit", minute: "2-digit" })
  }
  function datumKurz(iso: string) {
    return new Date(iso).toLocaleDateString("de-DE", { timeZone: BERLIN, weekday: "short", day: "2-digit", month: "2-digit" })
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide">Termine prüfen</p>

      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <p className="text-xs sf-text-3 mb-1">Von</p>
          <input type="date" value={von} onChange={(e) => setVon(e.target.value)}
            className="rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-2 py-1.5 text-xs sf-text" />
        </div>
        <div>
          <p className="text-xs sf-text-3 mb-1">Bis</p>
          <input type="date" value={bis} onChange={(e) => setBis(e.target.value)}
            className="rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-2 py-1.5 text-xs sf-text" />
        </div>
        <button onClick={ladTermine} disabled={laden}
          className="rounded-lg bg-stone-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium sf-text hover:bg-stone-200 dark:hover:bg-neutral-700 disabled:opacity-50">
          {laden ? "Lädt…" : "Laden"}
        </button>
      </div>

      {fehler && <p className="text-xs text-red-500 break-all">{fehler}</p>}

      {termine.length > 0 && (
        <div className="space-y-0.5">
          {[...termine]
            .sort((a, b) => a.beginn.localeCompare(b.beginn))
            .map((t, i) => {
              const status = resolveStatus(t.titel, defaultStatus)
              return (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span className={`w-16 flex-shrink-0 font-medium ${
                    status === "LOCKED" ? "text-red-500" : "text-amber-500"
                  }`}>{status}</span>
                  {t.ganztaegig ? (
                    <span className="sf-text-3">{datumKurz(t.beginn)}</span>
                  ) : (
                    <span className="sf-text-3 font-mono whitespace-nowrap">
                      {datumKurz(t.beginn)} {uhrzeit(t.beginn)}–{uhrzeit(t.ende)}
                    </span>
                  )}
                  <span className="sf-text truncate">{t.titel}</span>
                </div>
              )
            })}
          <p className="text-xs sf-text-3 pt-1">
            {termine.length} Termine ·{" "}
            {termine.filter((t) => resolveStatus(t.titel, defaultStatus) === "LOCKED").length} LOCKED ·{" "}
            {termine.filter((t) => resolveStatus(t.titel, defaultStatus) === "FLEXIBLE").length} FLEXIBLE
          </p>
        </div>
      )}

      {termine.length === 0 && !laden && (
        <p className="text-xs sf-text-3">Noch keine Termine geladen.</p>
      )}
    </div>
  )
}

// ─── MinusFormular ─────────────────────────────────────────────────────────────

function MinusFormular({
  employers,
  onSpeichern,
  onAbbrechen,
}: {
  employers: Employer[]
  onSpeichern: (d: MinusEintragInput) => void
  onAbbrechen: () => void
}) {
  const [datum, setDatum] = useState(new Date().toLocaleDateString("sv", { timeZone: BERLIN }))
  const [stunden, setStunden] = useState("")
  const [notiz, setNotiz] = useState("")
  const [employerId, setEmployerId] = useState(employers[0]?.id ?? "")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const zahl = parseFloat(stunden.replace(",", "."))
    if (!datum || isNaN(zahl) || zahl <= 0 || !employerId) return
    onSpeichern({ datum, minuten: Math.round(zahl * 60), employerId, ...(notiz.trim() ? { notiz: notiz.trim() } : {}) })
  }

  const inputKlasse = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  return (
    <form onSubmit={submit} className="sf-card rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <p className="text-xs sf-text-2 mb-1">Arbeitgeber</p>
        {employers.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">Bitte zuerst einen Arbeitgeber anlegen.</p>
        ) : (
          <select
            required
            value={employerId}
            onChange={(e) => setEmployerId(e.target.value)}
            className={inputKlasse}
          >
            <option value="" disabled>Arbeitgeber wählen…</option>
            {employers.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs sf-text-2 mb-1">Datum</p>
          <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className={inputKlasse} />
        </div>
        <div>
          <p className="text-xs sf-text-2 mb-1">Stunden</p>
          <input type="number" required min="0.25" step="0.25" placeholder="z.B. 2" value={stunden}
            onChange={(e) => setStunden(e.target.value)} className={`${inputKlasse} nums`} />
        </div>
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">Grund <span className="text-stone-400 font-normal">optional</span></p>
        <input type="text" value={notiz} onChange={(e) => setNotiz(e.target.value)}
          placeholder="z.B. Krankmeldung, Korrektur" className={inputKlasse} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onAbbrechen}
          className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
          Abbrechen
        </button>
        <button type="submit" disabled={!employerId}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-500 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none">
          Speichern
        </button>
      </div>
    </form>
  )
}

// ─── VorlageFormular ────────────────────────────────────────────────────────────

const DEFAULT_VORLAGE = {
  name: "Standard",
  betreff: "Verfügbarkeit {{zeitraum_von}} – {{zeitraum_bis}}",
  text: `Sehr geehrte Damen und Herren,

anbei erhalten Sie meine Verfügbarkeit für den Zeitraum {{zeitraum_von}} bis {{zeitraum_bis}}.

Mit freundlichen Grüßen,
{{name}}
Personalnummer: {{personalnummer}}`,
  empfaenger: "",
  cc: "",
}

function VorlageFormular({
  initial,
  istBearbeitung = false,
  onSpeichern,
  onAbbrechen,
}: {
  initial?: { name: string; betreff: string; text: string; empfaenger?: string; cc?: string }
  istBearbeitung?: boolean
  onSpeichern: (d: { name: string; betreff: string; text: string; empfaenger: string; cc: string }) => void
  onAbbrechen: () => void
}) {
  const start = initial ?? DEFAULT_VORLAGE
  const [name, setName] = useState(start.name)
  const [betreff, setBetreff] = useState(start.betreff)
  const [text, setText] = useState(start.text)
  const [empfaenger, setEmpfaenger] = useState(start.empfaenger ?? "")
  const [cc, setCc] = useState(start.cc ?? "")

  const inputKlasse = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !betreff.trim()) return
    onSpeichern({ name: name.trim(), betreff: betreff.trim(), text: text.trim(), empfaenger: empfaenger.trim(), cc: cc.trim() })
  }

  return (
    <form onSubmit={submit} className="sf-card rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <p className="text-xs sf-text-2 mb-1">Name der Vorlage</p>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Standard, Jumia, HAW" className={inputKlasse} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">
          Empfänger (An) <span className="text-stone-400 font-normal">optional, mehrere durch Komma</span>
        </p>
        <input type="text" value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value)}
          placeholder="planung@arbeitgeber.de" className={inputKlasse} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">
          CC <span className="text-stone-400 font-normal">optional, mehrere durch Komma</span>
        </p>
        <input type="text" value={cc} onChange={(e) => setCc(e.target.value)}
          placeholder="leitung@example.de" className={inputKlasse} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">Betreff</p>
        <input type="text" required value={betreff} onChange={(e) => setBetreff(e.target.value)}
          placeholder="Verfügbarkeit {{zeitraum_von}} – {{zeitraum_bis}}" className={inputKlasse} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">Text</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className={`${inputKlasse} resize-none leading-relaxed`}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onAbbrechen}
          className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
          Abbrechen
        </button>
        <button type="submit"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 active:scale-95 transition-all">
          {istBearbeitung ? "Speichern" : "Anlegen"}
        </button>
      </div>
    </form>
  )
}

// ─── EmailKontoFormular ────────────────────────────────────────────────────────

function EmailKontoFormular({
  initialGmailUser,
  istBearbeitung,
  laden,
  onSpeichern,
  onAbbrechen,
}: {
  initialGmailUser?: string
  istBearbeitung?: boolean
  laden?: boolean
  onSpeichern: (gmailUser: string, gmailAppPassword: string) => void
  onAbbrechen?: () => void
}) {
  const [gmailUser, setGmailUser] = useState(initialGmailUser ?? "")
  const [gmailAppPassword, setGmailAppPassword] = useState("")

  const inputKlasse = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!gmailUser.trim() || !gmailAppPassword.trim()) return
    onSpeichern(gmailUser.trim(), gmailAppPassword.trim())
  }

  return (
    <form onSubmit={submit} className="sf-card rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <p className="text-xs sf-text-2 mb-1">Gmail-Adresse</p>
        <input
          type="email"
          required
          value={gmailUser}
          onChange={(e) => setGmailUser(e.target.value)}
          placeholder="deine@gmail.com"
          className={inputKlasse}
        />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-1">
          App-Passwort{" "}
          {istBearbeitung && <span className="text-stone-400 font-normal">neu eingeben</span>}
        </p>
        <input
          type="password"
          required
          value={gmailAppPassword}
          onChange={(e) => setGmailAppPassword(e.target.value)}
          placeholder="xxxx xxxx xxxx xxxx"
          autoComplete="new-password"
          className={`${inputKlasse} font-mono tracking-widest`}
        />
      </div>
      <div className="flex gap-2">
        {onAbbrechen && (
          <button
            type="button"
            onClick={onAbbrechen}
            disabled={laden}
            className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            Abbrechen
          </button>
        )}
        <button
          type="submit"
          disabled={laden || !gmailUser.trim() || !gmailAppPassword.trim()}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {laden ? "Speichert…" : istBearbeitung ? "Aktualisieren" : "Speichern"}
        </button>
      </div>
    </form>
  )
}
