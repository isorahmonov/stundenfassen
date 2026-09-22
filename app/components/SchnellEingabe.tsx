"use client"

import { useState } from "react"
import type { Employer } from "@/lib/types"
import { shifts as shiftsRepo, minusEintraege as minusRepo } from "@/lib/storage"
import { formatWochentag } from "@/lib/calc/format"

function heuteISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseLokalDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 12)
}

interface Props {
  employer: Employer
  onSaved: () => void
}

type Typ = "arbeitszeit" | "minus"

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function SchnellEingabe({ employer, onSaved }: Props) {
  const [typ, setTyp] = useState<Typ>("arbeitszeit")

  return (
    <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Typ-Toggle */}
      <div className="flex border-b border-stone-100 dark:border-white/5">
        {(["arbeitszeit", "minus"] as Typ[]).map((t) => (
          <button
            key={t}
            onClick={() => setTyp(t)}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
              typ === t
                ? t === "minus"
                  ? "text-red-600 dark:text-red-400 border-b-2 border-red-500"
                  : "text-stone-800 dark:text-neutral-100 border-b-2 border-stone-800 dark:border-neutral-100"
                : "text-stone-400 dark:text-neutral-500"
            }`}
          >
            {t === "arbeitszeit" ? "Arbeitszeit" : "Minusstunden"}
          </button>
        ))}
      </div>

      <div className="p-5">
        {typ === "arbeitszeit" ? (
          <ArbeitszeitFormular employer={employer} onSaved={onSaved} />
        ) : (
          <MinusFormular employer={employer} onSaved={onSaved} />
        )}
      </div>
    </div>
  )
}

// ─── ArbeitszeitFormular ──────────────────────────────────────────────────────

function ArbeitszeitFormular({ employer, onSaved }: Props) {
  const [datum, setDatum] = useState(heuteISO)
  const [start, setStart] = useState("")
  const [ende, setEnde] = useState("")
  const [pauseVon, setPauseVon] = useState("")
  const [pauseBis, setPauseBis] = useState("")
  const [speichert, setSpeichert] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const wochentag = datum ? formatWochentag(parseLokalDatum(datum)) : ""
  const kannSpeichern = datum && start && ende && !speichert

  async function letztSchichtKopieren() {
    const alle = await shiftsRepo.findByEmployer(employer.id)
    if (alle.length === 0) return
    alle.sort((a, b) => a.datum.localeCompare(b.datum) || a.start.localeCompare(b.start))
    const letzte = alle[alle.length - 1]
    setStart(letzte.start)
    setEnde(letzte.ende)
    setPauseVon(letzte.pauseVon ?? "")
    setPauseBis(letzte.pauseBis ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    if ((pauseVon && !pauseBis) || (!pauseVon && pauseBis)) {
      setFehler("Pause von und Pause bis müssen beide angegeben oder beide leer sein.")
      return
    }
    setSpeichert(true)
    try {
      await shiftsRepo.add({
        employerId: employer.id, datum, start, ende,
        ...(pauseVon && pauseBis ? { pauseVon, pauseBis } : {}),
      })
      setStart(""); setEnde(""); setPauseVon(""); setPauseBis(""); setDatum(heuteISO())
      onSaved()
    } catch {
      setFehler("Schicht konnte nicht gespeichert werden.")
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold text-stone-800 dark:text-neutral-100 mb-4">Neue Schicht</h2>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Label>Datum</Label>
          <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)}
            className={inputKlasse} />
        </div>
        {wochentag && <p className="mt-5 text-sm font-medium text-stone-500 whitespace-nowrap">{wochentag}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><Label>Start</Label><TimeInput value={start} onChange={setStart} required /></div>
        <div><Label>Ende</Label><TimeInput value={ende} onChange={setEnde} required /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div><Label optional>Pause von</Label><TimeInput value={pauseVon} onChange={setPauseVon} /></div>
        <div><Label optional>Pause bis</Label><TimeInput value={pauseBis} onChange={setPauseBis} /></div>
      </div>

      {fehler && <p className="mb-4 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{fehler}</p>}

      <div className="flex items-center gap-2">
        <button type="button" onClick={letztSchichtKopieren}
          className="flex-1 sm:flex-none rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          ↩ Letzte kopieren
        </button>
        <button type="submit" disabled={!kannSpeichern}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
          style={{ backgroundColor: employer.farbe }}>
          {speichert ? "Speichert…" : "Schicht speichern"}
        </button>
      </div>
    </form>
  )
}

// ─── MinusFormular ────────────────────────────────────────────────────────────

function MinusFormular({ employer, onSaved }: Props) {
  const [datum, setDatum] = useState(heuteISO)
  const [stunden, setStunden] = useState("")
  const [notiz, setNotiz] = useState("")
  const [speichert, setSpeichert] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const stundenZahl = parseFloat(stunden.replace(",", "."))
  const kannSpeichern = datum && stunden && !isNaN(stundenZahl) && stundenZahl > 0 && !speichert

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    const minuten = Math.round(stundenZahl * 60)
    if (minuten <= 0) { setFehler("Bitte eine positive Stundenanzahl eingeben."); return }
    setSpeichert(true)
    try {
      await minusRepo.add({
        employerId: employer.id, datum, minuten,
        ...(notiz.trim() ? { notiz: notiz.trim() } : {}),
      })
      setStunden(""); setNotiz(""); setDatum(heuteISO())
      onSaved()
    } catch {
      setFehler("Eintrag konnte nicht gespeichert werden.")
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Minusstunden eintragen</h2>
      <p className="text-xs text-stone-400 mb-4">Werden von der Monatssumme abgezogen.</p>

      <div className="mb-4">
        <Label>Datum</Label>
        <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)}
          className={inputKlasse} />
      </div>

      <div className="mb-4">
        <Label>Stunden (positiv eingeben)</Label>
        <input
          type="number"
          required
          min="0.25"
          step="0.25"
          placeholder="z.B. 2 oder 1.5"
          value={stunden}
          onChange={(e) => setStunden(e.target.value)}
          className={`${inputKlasse} nums`}
        />
      </div>

      <div className="mb-5">
        <Label optional>Grund / Notiz</Label>
        <input
          type="text"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          placeholder="z.B. Krankmeldung, Korrektur"
          className={inputKlasse}
        />
      </div>

      {fehler && <p className="mb-4 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{fehler}</p>}

      <button type="submit" disabled={!kannSpeichern}
        className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-500 disabled:opacity-40 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400">
        {speichert ? "Speichert…" : "Minusstunden speichern"}
      </button>
    </form>
  )
}

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

const inputKlasse =
  "w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-xs font-medium text-stone-500 mb-1.5">
      {children}
      {optional && <span className="ml-1 text-stone-400 font-normal">optional</span>}
    </p>
  )
}

function TimeInput({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <input type="time" required={required} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow" />
  )
}
