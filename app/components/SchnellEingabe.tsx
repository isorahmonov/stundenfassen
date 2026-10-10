"use client"

import { useState } from "react"
import type { Employer } from "@/lib/types"
import { shifts as shiftsRepo, minusEintraege as minusRepo } from "@/lib/storage"
import { formatWochentagLokal } from "@/lib/calc/format"
import { useLang, useT } from "@/app/components/LangProvider"

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

export function SchnellEingabe({ employer, onSaved }: Props) {
  const t = useT()
  const [typ, setTyp] = useState<Typ>("arbeitszeit")

  return (
    <div className="mt-6 sf-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Tab-Switcher */}
      <div className="flex border-b border-stone-100 dark:border-white/5">
        {(["arbeitszeit", "minus"] as Typ[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTyp(tab)}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
              typ === tab
                ? tab === "minus"
                  ? "text-red-600 dark:text-red-400 border-b-2 border-red-500"
                  : "sf-text border-b-2 border-stone-800 dark:border-neutral-100"
                : "text-stone-400 dark:text-neutral-500"
            }`}
          >
            {tab === "arbeitszeit" ? t("SE_TAB_ARBEITSZEIT") : t("SE_TAB_MINUS")}
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
  const t = useT()
  const { locale } = useLang()
  const [datum, setDatum] = useState(heuteISO)
  const [start, setStart] = useState("")
  const [ende, setEnde] = useState("")
  const [pauseVon, setPauseVon] = useState("")
  const [pauseBis, setPauseBis] = useState("")
  const [speichert, setSpeichert] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const wochentag = datum ? formatWochentagLokal(parseLokalDatum(datum), locale) : ""
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
      setFehler(t("SE_FEHLER_PAUSE"))
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
      setFehler(t("SE_FEHLER_SCHICHT"))
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold sf-text mb-4">{t("SE_NEUE_SCHICHT")}</h2>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Label>{t("DATUM_LABEL")}</Label>
          <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className={inputKlasse} />
        </div>
        {wochentag && <p className="mt-5 text-sm font-medium text-stone-500 whitespace-nowrap">{wochentag}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><Label>{t("SCHICHTEN_FORM_START")}</Label><TimeInput value={start} onChange={setStart} required /></div>
        <div><Label>{t("SCHICHTEN_FORM_ENDE")}</Label><TimeInput value={ende} onChange={setEnde} required /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div><Label optional>{t("SE_PAUSE_VON")}</Label><TimeInput value={pauseVon} onChange={setPauseVon} /></div>
        <div><Label optional>{t("SE_PAUSE_BIS")}</Label><TimeInput value={pauseBis} onChange={setPauseBis} /></div>
      </div>

      {fehler && <p className="mb-4 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{fehler}</p>}

      <div className="flex items-center gap-2">
        <button type="button" onClick={letztSchichtKopieren}
          className="flex-1 sm:flex-none rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:border-stone-300 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          {t("SE_LETZTE_KOPIEREN")}
        </button>
        <button type="submit" disabled={!kannSpeichern}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
          style={{ backgroundColor: employer.farbe }}>
          {speichert ? t("SPEICHERT") : t("SE_SCHICHT_SPEICHERN")}
        </button>
      </div>
    </form>
  )
}

// ─── MinusFormular ────────────────────────────────────────────────────────────

function MinusFormular({ employer, onSaved }: { employer: Employer; onSaved: () => void }) {
  const t = useT()
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
    if (minuten <= 0) { setFehler(t("SE_FEHLER_STUNDEN")); return }
    setSpeichert(true)
    try {
      await minusRepo.add({
        datum, minuten, employerId: employer.id,
        ...(notiz.trim() ? { notiz: notiz.trim() } : {}),
      })
      setStunden(""); setNotiz(""); setDatum(heuteISO())
      onSaved()
    } catch {
      setFehler(t("SE_FEHLER_EINTRAG"))
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{t("SE_MINUS_EINTRAGEN")}</h2>
      <p className="text-xs sf-text-3 mb-4">{t("SE_MINUS_HINWEIS")}</p>

      <div className="mb-4">
        <Label>{t("DATUM_LABEL")}</Label>
        <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className={inputKlasse} />
      </div>

      <div className="mb-4">
        <Label>{t("MINUS_STUNDEN")}</Label>
        <input type="number" required min="0.25" step="0.25" placeholder={t("SE_PH_STUNDEN")}
          value={stunden} onChange={(e) => setStunden(e.target.value)} className={`${inputKlasse} nums`} />
      </div>

      <div className="mb-5">
        <Label optional>{t("SE_GRUND_NOTIZ")}</Label>
        <input type="text" value={notiz} onChange={(e) => setNotiz(e.target.value)}
          placeholder={t("SE_PH_NOTIZ")} className={inputKlasse} />
      </div>

      {fehler && <p className="mb-4 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{fehler}</p>}

      <button type="submit" disabled={!kannSpeichern}
        className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-500 disabled:opacity-40 active:scale-95 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400">
        {speichert ? t("SPEICHERT") : t("SE_MINUS_SPEICHERN")}
      </button>
    </form>
  )
}

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

const inputKlasse =
  "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  const t = useT()
  return (
    <p className="text-xs font-medium sf-text-2 mb-1.5">
      {children}
      {optional && <span className="ml-1 sf-text-3 font-normal">{t("OPTIONAL")}</span>}
    </p>
  )
}

function TimeInput({ value, onChange, required }: {
  value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <input type="time" required={required} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow" />
  )
}
