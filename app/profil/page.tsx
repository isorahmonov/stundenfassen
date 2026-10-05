"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"
import { resolveStatus } from "@/lib/verfuegbarkeit/status"
import type { TerminRoh } from "@/lib/verfuegbarkeit/eventCache"
import type { Employer, MinusEintrag, EmailVorlage } from "@/lib/types"
import { minusEintraege as minusRepo, employers as employersRepo, emailVorlagen as emailVorlageRepo } from "@/lib/storage"
import type { MinusEintragInput } from "@/lib/storage"

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

type Sektion = "kalender" | "arbeitgeber" | "minus" | "email"

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

  const [fehler, setFehler] = useState("")

  useEffect(() => { ladeKalender() }, [])
  useEffect(() => { minusRepo.findAlle().then(setMinus).catch(() => {}) }, [minusVersion])
  useEffect(() => { ladeArbeitgeber() }, [])
  useEffect(() => { ladeVorlagen() }, [])

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

  async function toggleMinusImPDF(emp: Employer) {
    try {
      await employersRepo.update(emp.id, { minusImPDFAnzeigen: emp.minusImPDFAnzeigen !== false ? false : true })
      ladeArbeitgeber()
    } catch (e) { setFehler(String(e)) }
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
                          <button
                            role="switch"
                            aria-checked={emp.minusImPDFAnzeigen !== false}
                            onClick={() => toggleMinusImPDF(emp)}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                              emp.minusImPDFAnzeigen !== false
                                ? "bg-blue-500"
                                : "bg-stone-300 dark:bg-neutral-600"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                emp.minusImPDFAnzeigen !== false ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
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

        </div>
      </div>
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
        {istBearbeitung && (
          <p className="text-xs sf-text-3 mt-1">URL nur ausfüllen wenn du sie ändern möchtest.</p>
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
