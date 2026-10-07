"use client"

import { useState } from "react"
import { BaseDialog } from "./BaseDialog"
import type { Bundesland, Employer, VerfuegbarkeitsEinstellungenArbeitgeber } from "@/lib/types"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { employers as employersRepo } from "@/lib/storage"

export { sollDialogOeffnen } from "@/lib/verfuegbarkeit/einrichtungsUtils"

// ─── Typen ────────────────────────────────────────────────────────────────────

interface FormDaten {
  bundesland: Bundesland
  wochentage: number[]
  wochenStart: "montag" | "sonntag"
  fruehestens: string
  spaetestens: string
  mindestdauerMin: number
  rundungMin: 15 | 30 | 60
  pufferStandardMin: number
  pufferOrte: { suchtext: string; vorMin: number; nachMin: number }[]
  kwSystem: "keine" | "iso" | "tkmaxx"
  kwAnker: string
  personalnummer: string
  fusszeilenText: string
  festeSperrzeiten: { wochentag: number; von: string; bis: string; bezeichnung: string }[]
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

const BUNDESLAENDER: { value: Bundesland; label: string }[] = [
  { value: "BB", label: "Brandenburg" }, { value: "BE", label: "Berlin" },
  { value: "BW", label: "Baden-Württemberg" }, { value: "BY", label: "Bayern" },
  { value: "HB", label: "Bremen" }, { value: "HE", label: "Hessen" },
  { value: "HH", label: "Hamburg" }, { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" }, { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" }, { value: "SH", label: "Schleswig-Holstein" },
  { value: "SL", label: "Saarland" }, { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" }, { value: "TH", label: "Thüringen" },
]

const WOCHENTAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
const WOCHENTAGE_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
const SCHRITT_TITEL = ["Bundesland", "Wochentage", "Zeitfenster", "Wegezeiten", "PDF-Einstellungen", "Sperrzeiten"]
const TOTAL_STEPS = 6

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function uhrzeitZuMin(s: string): number {
  const [h, m] = s.split(":").map(Number)
  return h * 60 + m
}

function initialForm(employer: Employer): FormDaten {
  const einst = employer.verfuegbarkeit ?? NEUTRALE_EINSTELLUNGEN
  return {
    bundesland: employer.bundesland,
    wochentage: einst.wochentage,
    wochenStart: einst.wochenStart,
    fruehestens: einst.fruehestens,
    spaetestens: einst.spaetestens,
    mindestdauerMin: einst.mindestdauerMin,
    rundungMin: ([15, 30, 60].includes(einst.rundungMin) ? einst.rundungMin : 30) as 15 | 30 | 60,
    pufferStandardMin: einst.pufferStandardMin,
    pufferOrte: einst.pufferOrte,
    kwSystem: einst.kwSystem,
    kwAnker: einst.kwAnker ?? "",
    personalnummer: employer.personalnummer ?? "",
    fusszeilenText: einst.pdf?.fusszeilenText ?? "",
    festeSperrzeiten: einst.festeSperrzeiten,
  }
}

// ─── Validierung ──────────────────────────────────────────────────────────────

function validiereSchritt(step: number, form: FormDaten): string | null {
  switch (step) {
    case 0:
      if (!form.bundesland) return "Bitte ein Bundesland wählen."
      break
    case 1:
      if (form.wochentage.length === 0) return "Mindestens ein Wochentag muss ausgewählt sein."
      break
    case 2: {
      const start = uhrzeitZuMin(form.fruehestens)
      const ende = uhrzeitZuMin(form.spaetestens)
      if (start >= ende) return "Frühestens muss vor Spätestens liegen."
      if (form.mindestdauerMin <= 0) return "Mindestdauer muss größer als 0 Minuten sein."
      if (form.mindestdauerMin > ende - start)
        return `Mindestdauer (${form.mindestdauerMin} min) überschreitet das Zeitfenster (${ende - start} min).`
      if (![15, 30, 60].includes(form.rundungMin)) return "Rundung muss 15, 30 oder 60 Minuten sein."
      break
    }
    case 3:
      for (const p of form.pufferOrte) {
        if (!p.suchtext.trim()) return "Ortstext darf nicht leer sein."
        if (p.vorMin < 0 || p.nachMin < 0) return "Pufferzeiten müssen 0 oder größer sein."
      }
      break
    case 4:
      if (form.kwSystem === "tkmaxx" && !form.kwAnker.trim())
        return "Bitte ein Ankerdatum für das TK-Maxx-KW-System eingeben."
      break
    case 5:
      for (const s of form.festeSperrzeiten) {
        if (!s.bezeichnung.trim() || !s.von || !s.bis)
          return "Alle Felder einer Sperrzeit müssen ausgefüllt sein."
        if (uhrzeitZuMin(s.von) >= uhrzeitZuMin(s.bis))
          return "Anfangszeit einer Sperrzeit muss vor der Endzeit liegen."
      }
      break
  }
  return null
}

// ─── Schritt-Komponenten ──────────────────────────────────────────────────────

const INPUT = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
const INPUT_SM = "w-full rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-3 py-1.5 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-shadow"

function SchrittBundesland({ form, set }: { form: FormDaten; set: SetFn }) {
  return (
    <div className="space-y-3">
      <p className="text-sm sf-text-2">In welchem Bundesland arbeitest du bei diesem Arbeitgeber? (Für Feiertagsberechnung)</p>
      <select value={form.bundesland} onChange={e => set("bundesland", e.target.value as Bundesland)} className={INPUT}>
        <option value="" disabled>Bundesland wählen…</option>
        {BUNDESLAENDER.map(bl => <option key={bl.value} value={bl.value}>{bl.label} ({bl.value})</option>)}
      </select>
    </div>
  )
}

function SchrittWochentage({ form, set }: { form: FormDaten; set: SetFn }) {
  function toggleTag(tag: number) {
    const next = form.wochentage.includes(tag)
      ? form.wochentage.filter(t => t !== tag)
      : [...form.wochentage, tag].sort((a, b) => a - b)
    set("wochentage", next)
  }
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm sf-text-2 mb-3">An welchen Tagen kannst du prinzipiell arbeiten?</p>
        <div className="grid grid-cols-7 gap-1.5">
          {WOCHENTAGE_KURZ.map((tag, i) => (
            <button key={i} type="button" onClick={() => toggleTag(i)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.wochentage.includes(i)
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{tag}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm sf-text-2 mb-2">Wochenbeginn in der PDF-Anzeige</p>
        <div className="flex gap-2">
          {(["montag", "sonntag"] as const).map(ws => (
            <button key={ws} type="button" onClick={() => set("wochenStart", ws)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.wochenStart === ws
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{ws === "montag" ? "Montag" : "Sonntag (z. B. TK Maxx)"}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchrittZeitfenster({ form, set }: { form: FormDaten; set: SetFn }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs sf-text-2 mb-1">Frühestens</label>
          <input type="time" value={form.fruehestens} onChange={e => set("fruehestens", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs sf-text-2 mb-1">Spätestens</label>
          <input type="time" value={form.spaetestens} onChange={e => set("spaetestens", e.target.value)} className={INPUT} />
        </div>
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">Mindestdauer eines Blocks (Minuten)</label>
        <input type="number" inputMode="numeric" min="15" step="15" value={form.mindestdauerMin}
          onChange={e => set("mindestdauerMin", Number(e.target.value))} className={`${INPUT} nums`} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-2">Runden auf (Start auf-, Ende abrunden)</p>
        <div className="flex gap-2">
          {([15, 30, 60] as const).map(r => (
            <button key={r} type="button" onClick={() => set("rundungMin", r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.rundungMin === r
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{r === 60 ? "1 h" : `${r} min`}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchrittPuffer({ form, set }: { form: FormDaten; set: SetFn }) {
  function addOrt() { set("pufferOrte", [...form.pufferOrte, { suchtext: "", vorMin: 30, nachMin: 30 }]) }
  function removeOrt(i: number) { set("pufferOrte", form.pufferOrte.filter((_, j) => j !== i)) }
  function updateOrt(i: number, field: string, value: string | number) {
    set("pufferOrte", form.pufferOrte.map((p, j) => j === i ? { ...p, [field]: value } : p))
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs sf-text-2 mb-1">Standard-Pufferzeit (Minuten, für unbekannte Orte)</label>
        <input type="number" inputMode="numeric" min="0" step="5" value={form.pufferStandardMin}
          onChange={e => set("pufferStandardMin", Number(e.target.value))} className={`${INPUT} nums`} />
        <p className="text-xs sf-text-3 mt-1">0 = kein Puffer. Gilt wenn kein Ortstext erkannt wird.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs sf-text-2 font-semibold uppercase tracking-wide">Ortsabhängige Wegezeiten</p>
          <button type="button" onClick={addOrt} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            + Hinzufügen
          </button>
        </div>
        {form.pufferOrte.length === 0
          ? <p className="text-xs sf-text-3">Keine eingetragen — Standard-Puffer gilt überall.</p>
          : (
            <div className="space-y-2">
              {form.pufferOrte.map((p, i) => (
                <div key={i} className="sf-card rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={p.suchtext} onChange={e => updateOrt(i, "suchtext", e.target.value)}
                      placeholder="Ortstext (z. B. Berliner Tor)" className={`flex-1 ${INPUT_SM}`} />
                    <button onClick={() => removeOrt(i)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs sf-text-3 mb-0.5">Vor Termin (min)</p>
                      <input type="number" min="0" step="5" value={p.vorMin}
                        onChange={e => updateOrt(i, "vorMin", Number(e.target.value))} className={`${INPUT_SM} nums`} />
                    </div>
                    <div>
                      <p className="text-xs sf-text-3 mb-0.5">Nach Termin (min)</p>
                      <input type="number" min="0" step="5" value={p.nachMin}
                        onChange={e => updateOrt(i, "nachMin", Number(e.target.value))} className={`${INPUT_SM} nums`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

function SchrittPdf({ form, set }: { form: FormDaten; set: SetFn }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs sf-text-2 font-semibold uppercase tracking-wide mb-2">Kalenderwochen-System</p>
        <div className="space-y-1.5">
          {([
            { value: "keine",  label: "Kein KW-Label" },
            { value: "iso",    label: "ISO-Wochen (Montag–Sonntag)" },
            { value: "tkmaxx", label: "TK Maxx (Sonntag–Samstag, mit Ankerdatum)" },
          ] as const).map(o => (
            <button key={o.value} type="button" onClick={() => set("kwSystem", o.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.kwSystem === o.value
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{o.label}</button>
          ))}
        </div>
        {form.kwSystem === "tkmaxx" && (
          <div className="mt-3">
            <label className="block text-xs sf-text-2 mb-1">Ankerdatum (Sonntag der ersten KW)</label>
            <input type="date" value={form.kwAnker} onChange={e => set("kwAnker", e.target.value)} className={INPUT} />
            <p className="text-xs sf-text-3 mt-1">Muss ein Sonntag sein, z. B. 2026-02-01.</p>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">
          Personalnummer <span className="font-normal text-stone-400 dark:text-neutral-500">optional</span>
        </label>
        <input type="text" value={form.personalnummer} onChange={e => set("personalnummer", e.target.value)}
          placeholder="z. B. 123456" className={`${INPUT} nums`} />
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">
          PDF-Fußzeile <span className="font-normal text-stone-400 dark:text-neutral-500">optional</span>
        </label>
        <input type="text" value={form.fusszeilenText} onChange={e => set("fusszeilenText", e.target.value)}
          placeholder="z. B. Stundenfassen" className={INPUT} />
      </div>
    </div>
  )
}

function SchrittSperrzeiten({ form, set }: { form: FormDaten; set: SetFn }) {
  function add() {
    set("festeSperrzeiten", [...form.festeSperrzeiten, { wochentag: 5, von: "12:00", bis: "14:00", bezeichnung: "" }])
  }
  function remove(i: number) { set("festeSperrzeiten", form.festeSperrzeiten.filter((_, j) => j !== i)) }
  function update(i: number, field: string, value: string | number) {
    set("festeSperrzeiten", form.festeSperrzeiten.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }
  return (
    <div className="space-y-3">
      <p className="text-sm sf-text-2">Gibt es regelmäßige Termine, die immer gesperrt sind (Vorlesung, Gebet o. ä.)? Leer lassen, wenn keine gelten.</p>
      <div className="flex justify-end">
        <button type="button" onClick={add} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
          + Hinzufügen
        </button>
      </div>
      <div className="space-y-3">
        {form.festeSperrzeiten.map((s, i) => (
          <div key={i} className="sf-card rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <select value={s.wochentag} onChange={e => update(i, "wochentag", Number(e.target.value))}
                className={`flex-1 ${INPUT_SM}`}>
                {WOCHENTAGE_LANG.map((tag, j) => <option key={j} value={j}>{tag}</option>)}
              </select>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none flex-shrink-0">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs sf-text-3 mb-0.5">Von</p>
                <input type="time" value={s.von} onChange={e => update(i, "von", e.target.value)} className={INPUT_SM} />
              </div>
              <div>
                <p className="text-xs sf-text-3 mb-0.5">Bis</p>
                <input type="time" value={s.bis} onChange={e => update(i, "bis", e.target.value)} className={INPUT_SM} />
              </div>
            </div>
            <input type="text" value={s.bezeichnung} onChange={e => update(i, "bezeichnung", e.target.value)}
              placeholder="Bezeichnung (z. B. Vorlesung, Freitagsgebet)" className={INPUT_SM} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Hilfstypes für set ───────────────────────────────────────────────────────

type SetFn = <K extends keyof FormDaten>(key: K, value: FormDaten[K]) => void

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export interface EinrichtungsDialogProps {
  employer: Employer
  onBestaetigt: () => void
  onSchliessen: () => void
}

export function EinrichtungsDialog({ employer, onBestaetigt, onSchliessen }: EinrichtungsDialogProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormDaten>(() => initialForm(employer))
  const [fehler, setFehler] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  function set<K extends keyof FormDaten>(key: K, value: FormDaten[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setFehler(null)
  }

  function weiter() {
    const err = validiereSchritt(step, form)
    if (err) { setFehler(err); return }
    setFehler(null)
    setStep(s => s + 1)
  }

  function zurueck() {
    setFehler(null)
    setStep(s => s - 1)
  }

  async function bestaetigen() {
    const err = validiereSchritt(step, form)
    if (err) { setFehler(err); return }
    setLaden(true)
    try {
      const verfuegbarkeit: VerfuegbarkeitsEinstellungenArbeitgeber = {
        wochentage:        form.wochentage,
        wochenStart:       form.wochenStart,
        fruehestens:       form.fruehestens,
        spaetestens:       form.spaetestens,
        mindestdauerMin:   form.mindestdauerMin,
        rundungMin:        form.rundungMin,
        pufferStandardMin: form.pufferStandardMin,
        pufferOrte:        form.pufferOrte,
        kwSystem:          form.kwSystem,
        kwAnker:           form.kwSystem === "tkmaxx" ? form.kwAnker : undefined,
        pdf:               { fusszeilenText: form.fusszeilenText },
        festeSperrzeiten:  form.festeSperrzeiten,
        einrichtungBestaetigt: true,
      }
      await employersRepo.update(employer.id, {
        bundesland:    form.bundesland,
        personalnummer: form.personalnummer || undefined,
        verfuegbarkeit,
      })
      onBestaetigt()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Speichern fehlgeschlagen.")
    } finally {
      setLaden(false)
    }
  }

  const istLetzterSchritt = step === TOTAL_STEPS - 1

  return (
    <BaseDialog onBackdropClick={onSchliessen} maxWidth="max-w-lg">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-stone-100 dark:border-white/5">
        <p className="text-xs sf-text-3 mb-0.5">Schritt {step + 1} von {TOTAL_STEPS}</p>
        <h2 className="text-base font-bold sf-text">{SCHRITT_TITEL[step]}</h2>
        <p className="text-xs sf-text-2 mt-0.5">
          Welche Einschränkungen gelten bei <span className="font-medium">{employer.name}</span>?
        </p>
      </div>

      {/* Scrollbarer Inhalt */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {fehler && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2 mb-4">
            {fehler}
          </p>
        )}
        {step === 0 && <SchrittBundesland form={form} set={set} />}
        {step === 1 && <SchrittWochentage form={form} set={set} />}
        {step === 2 && <SchrittZeitfenster form={form} set={set} />}
        {step === 3 && <SchrittPuffer form={form} set={set} />}
        {step === 4 && <SchrittPdf form={form} set={set} />}
        {step === 5 && <SchrittSperrzeiten form={form} set={set} />}
      </div>

      {/* Sticky Footer */}
      <div
        className="flex-shrink-0 border-t border-stone-100 dark:border-white/5 px-5 pt-4 flex items-center gap-2"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={onSchliessen}
          className="text-sm text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors mr-auto"
        >
          Später
        </button>
        {step > 0 && (
          <button onClick={zurueck} disabled={laden}
            className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40">
            ← Zurück
          </button>
        )}
        {istLetzterSchritt ? (
          <button onClick={bestaetigen} disabled={laden}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-60"
            style={{ backgroundColor: "#2563eb" }}>
            {laden ? "Speichert…" : "Bestätigen"}
          </button>
        ) : (
          <button onClick={weiter}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-all"
            style={{ backgroundColor: "#2563eb" }}>
            Weiter →
          </button>
        )}
      </div>
    </BaseDialog>
  )
}
