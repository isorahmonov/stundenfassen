"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"
import { LOCKED_KEYWORDS, resolveStatus } from "@/lib/verfuegbarkeit/status"
import type { TerminRoh } from "@/lib/verfuegbarkeit/eventCache"
import type { MinusEintrag } from "@/lib/types"
import { minusEintraege as minusRepo } from "@/lib/storage"

const BERLIN = "Europe/Berlin"

// ─── Typen ───────────────────────────────────────────────────────────────────

interface KalenderInfo {
  id: string
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
}

// ─── API-Helfer ───────────────────────────────────────────────────────────────

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

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function uhrzeit(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { timeZone: BERLIN, hour: "2-digit", minute: "2-digit" })
}
function datumKurz(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { timeZone: BERLIN, weekday: "short", day: "2-digit", month: "2-digit" })
}

const BUNDESLAENDER = [
  "BB","BE","BW","BY","HB","HE","HH","MV","NI","NW","RP","SH","SL","SN","ST","TH",
] as const

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function EinstellungenSeite() {
  const [kalender, setKalender] = useState<KalenderInfo[]>([])
  const [minus, setMinus] = useState<MinusEintrag[]>([])
  const [fehler, setFehler] = useState("")
  const [neuOffen, setNeuOffen] = useState(false)
  const [minusOffen, setMinusOffen] = useState(false)
  const [minusVersion, setMinusVersion] = useState(0)

  useEffect(() => { ladeKalender() }, [])
  useEffect(() => { minusRepo.findAlle().then(setMinus).catch(() => {}) }, [minusVersion])

  async function ladeKalender() {
    try {
      const d = await api("/api/ical") as { kalender: KalenderInfo[] }
      setKalender(d.kalender)
    } catch (e) { setFehler(String(e)) }
  }

  async function erstellen(data: KalenderFormDaten) {
    await api("/api/ical", { method: "POST", body: JSON.stringify(data) })
    setNeuOffen(false)
    ladeKalender()
  }

  async function aktualisieren(id: string, data: Partial<KalenderFormDaten>) {
    await api(`/api/ical/${id}`, { method: "PUT", body: JSON.stringify(data) })
    ladeKalender()
  }

  async function loeschen(id: string) {
    await api(`/api/ical/${id}`, { method: "DELETE" })
    ladeKalender()
  }

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-10">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/verfuegbarkeit"
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Zurück"
          >‹</Link>
          <h1 className="text-base font-semibold sf-text">Einstellungen</h1>
          <div className="w-10" />
        </header>

        {/* Fehler */}
        {fehler && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        {/* ── Kalender verwalten ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold sf-text">Kalender verwalten</h2>
            <button
              onClick={() => setNeuOffen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white text-lg font-light active:scale-90 transition-all"
              style={{ backgroundColor: "#2563eb" }}
              aria-label="Neuen Kalender hinzufügen"
            >+</button>
          </div>

          <div className="space-y-3">
            {/* Neu-Formular */}
            {neuOffen && (
              <KalenderFormular
                onSpeichern={(d) => erstellen(d).catch((e) => setFehler(String(e)))}
                onAbbrechen={() => setNeuOffen(false)}
              />
            )}

            {/* Leerzustand */}
            {kalender.length === 0 && !neuOffen && (
              <div className="sf-card rounded-2xl p-8 text-center shadow-sm">
                <p className="text-sm sf-text-2 mb-1">Noch keine Kalender.</p>
                <button onClick={() => setNeuOffen(true)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Ersten anlegen →
                </button>
              </div>
            )}

            {/* Kalender-Liste */}
            {kalender.map((k) => (
              <KalenderKarte
                key={k.id}
                kalender={k}
                onAktualisieren={(d) => aktualisieren(k.id, d).catch((e) => setFehler(String(e)))}
                onLoeschen={() => {
                  if (confirm(`„${k.name}" wirklich löschen?`))
                    loeschen(k.id).catch((e) => setFehler(String(e)))
                }}
              />
            ))}
          </div>
        </section>

        {/* ── Minusstunden ─────────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold sf-text">Minusstunden</h2>
            <button
              onClick={() => setMinusOffen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white text-lg font-light active:scale-90 transition-all"
              style={{ backgroundColor: "#dc2626" }}
              aria-label="Minusstunden eintragen"
            >+</button>
          </div>

          <div className="space-y-3">
            {minusOffen && (
              <MinusFormular
                onSpeichern={async (d) => {
                  try {
                    await minusRepo.add(d)
                    setMinusOffen(false)
                    setMinusVersion((v) => v + 1)
                  } catch (e) { setFehler(String(e)) }
                }}
                onAbbrechen={() => setMinusOffen(false)}
              />
            )}

            {minus.length === 0 && !minusOffen && (
              <div className="sf-card rounded-2xl p-8 text-center shadow-sm">
                <p className="text-sm sf-text-2 mb-1">Keine Minusstunden eingetragen.</p>
                <button onClick={() => setMinusOffen(true)}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                  Ersten eintragen →
                </button>
              </div>
            )}

            {minus.map((e) => (
              <div key={e.id} className="sf-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium sf-text">
                    {new Date(e.datum + "T12:00:00").toLocaleDateString("de-DE", {
                      weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                    {"  "}
                    <span className="font-semibold text-red-600 dark:text-red-400 nums">
                      −{(e.minuten / 60).toFixed(1).replace(".", ",")} Std.
                    </span>
                  </p>
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
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}

// ─── KalenderKarte ────────────────────────────────────────────────────────────

interface KalenderFormDaten {
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
  url?: string
}

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
      {/* Kopf */}
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

      {/* Bearbeitungsformular */}
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

      {/* Termin-Prüfer */}
      {termineOffen && (
        <div className="border-t border-stone-100 dark:border-white/5">
          <TerminPruefer kalendarId={k.id} defaultStatus={k.defaultStatus} />
        </div>
      )}
    </div>
  )
}

// ─── KalenderFormular ─────────────────────────────────────────────────────────

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
    if (!istBearbeitung && !url) return // URL beim Anlegen Pflicht
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

// ─── TerminPruefer ────────────────────────────────────────────────────────────

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

  async function laden_() {
    setFehler(""); setLaden(true)
    try {
      const d = await api(`/api/ical?id=${kalendarId}&von=${von}&bis=${bis}`) as { termine: TerminRoh[] }
      setTermine(d.termine)
    } catch (e) { setFehler(String(e)) }
    finally { setLaden(false) }
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
        <button onClick={laden_} disabled={laden}
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

// ─── MinusFormular ────────────────────────────────────────────────────────────

function MinusFormular({
  onSpeichern,
  onAbbrechen,
}: {
  onSpeichern: (d: { datum: string; minuten: number; notiz?: string }) => void
  onAbbrechen: () => void
}) {
  const [datum, setDatum] = useState(new Date().toLocaleDateString("sv", { timeZone: BERLIN }))
  const [stunden, setStunden] = useState("")
  const [notiz, setNotiz] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const zahl = parseFloat(stunden.replace(",", "."))
    if (!datum || isNaN(zahl) || zahl <= 0) return
    onSpeichern({ datum, minuten: Math.round(zahl * 60), ...(notiz.trim() ? { notiz: notiz.trim() } : {}) })
  }

  const inputKlasse = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  return (
    <form onSubmit={submit} className="sf-card rounded-2xl p-4 shadow-sm space-y-3">
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
        <button type="submit"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-500 active:scale-95 transition-all">
          Speichern
        </button>
      </div>
    </form>
  )
}
