"use client"

import { useState } from "react"
import { BaseDialog } from "./BaseDialog"
import { ShiftslotLoader } from "./ShiftslotLoader"
import { useT } from "./LangProvider"
import type { Bundesland, Employer, VerfuegbarkeitsEinstellungenArbeitgeber } from "@/lib/types"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { employers as employersRepo } from "@/lib/storage"
import { auth } from "@/lib/firebase/client"

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
  deinName: string
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
    deinName: einst.pdf?.deinName ?? auth.currentUser?.displayName ?? "",
    fusszeilenText: einst.pdf?.fusszeilenText ?? "",
    festeSperrzeiten: einst.festeSperrzeiten,
  }
}

// ─── Validierung ──────────────────────────────────────────────────────────────

type TFn = ReturnType<typeof useT>

function validiereSchritt(step: number, form: FormDaten, t: TFn): string | null {
  switch (step) {
    case 0:
      if (!form.bundesland) return t("EINR_VAL_BUNDESLAND")
      break
    case 1:
      if (form.wochentage.length === 0) return t("EINR_VAL_WOCHENTAGE")
      break
    case 2: {
      const start = uhrzeitZuMin(form.fruehestens)
      const ende = uhrzeitZuMin(form.spaetestens)
      if (start >= ende) return t("EINR_VAL_ZEITFENSTER")
      if (form.mindestdauerMin <= 0) return t("EINR_VAL_MINDESTDAUER")
      if (form.mindestdauerMin > ende - start)
        return t("EINR_VAL_MINDESTDAUER_FENSTER")
          .replace("{mindest}", String(form.mindestdauerMin))
          .replace("{fenster}", String(ende - start))
      if (![15, 30, 60].includes(form.rundungMin)) return t("EINR_VAL_RUNDUNG")
      break
    }
    case 3:
      for (const p of form.pufferOrte) {
        if (!p.suchtext.trim()) return t("EINR_VAL_ORT_LEER")
        if (p.vorMin < 0 || p.nachMin < 0) return t("EINR_VAL_PUFFER_NEGATIV")
      }
      break
    case 4:
      if (!form.deinName.trim()) return t("EINR_VAL_PDF_NAME")
      if (form.kwSystem === "tkmaxx" && !form.kwAnker.trim())
        return t("EINR_VAL_ANKERDATUM")
      break
    case 5:
      for (const sz of form.festeSperrzeiten) {
        if (!sz.bezeichnung.trim() || !sz.von || !sz.bis)
          return t("EINR_VAL_SPERRZEIT_FELDER")
        if (uhrzeitZuMin(sz.von) >= uhrzeitZuMin(sz.bis))
          return t("EINR_VAL_SPERRZEIT_ZEITEN")
      }
      break
  }
  return null
}

// ─── Schritt-Komponenten ──────────────────────────────────────────────────────

const INPUT = "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
const INPUT_SM = "w-full rounded-lg border border-stone-200 dark:border-neutral-700 sf-input px-3 py-1.5 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-shadow"

function SchrittBundesland({ form, set }: { form: FormDaten; set: SetFn }) {
  const t = useT()
  return (
    <div className="space-y-3">
      <p className="text-sm sf-text-2">{t("EINR_BUNDESLAND_FRAGE")}</p>
      <select value={form.bundesland} onChange={e => set("bundesland", e.target.value as Bundesland)} className={INPUT}>
        <option value="" disabled>{t("EINR_BUNDESLAND_PLACEHOLDER")}</option>
        {BUNDESLAENDER.map(bl => <option key={bl.value} value={bl.value}>{bl.label} ({bl.value})</option>)}
      </select>
    </div>
  )
}

function SchrittWochentage({ form, set }: { form: FormDaten; set: SetFn }) {
  const t = useT()
  const wochentageKurz = [
    t("TAG_SO"), t("TAG_MO"), t("TAG_DI"), t("TAG_MI"), t("TAG_DO"), t("TAG_FR"), t("TAG_SA"),
  ]
  function toggleTag(tag: number) {
    const next = form.wochentage.includes(tag)
      ? form.wochentage.filter(d => d !== tag)
      : [...form.wochentage, tag].sort((a, b) => a - b)
    set("wochentage", next)
  }
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm sf-text-2 mb-3">{t("EINR_WOCHENTAGE_FRAGE")}</p>
        <div className="grid grid-cols-7 gap-1.5">
          {wochentageKurz.map((tag, i) => (
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
        <p className="text-sm sf-text-2 mb-2">{t("EINR_WOCHENSTART")}</p>
        <div className="flex gap-2">
          {(["montag", "sonntag"] as const).map(ws => (
            <button key={ws} type="button" onClick={() => set("wochenStart", ws)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.wochenStart === ws
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{ws === "montag" ? t("TAG_LANG_MO") : t("EINR_WOCHENSTART_SO")}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchrittZeitfenster({ form, set }: { form: FormDaten; set: SetFn }) {
  const t = useT()
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs sf-text-2 mb-1">{t("EINR_FRUEHESTENS")}</label>
          <input type="time" value={form.fruehestens} onChange={e => set("fruehestens", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs sf-text-2 mb-1">{t("EINR_SPAETESTENS")}</label>
          <input type="time" value={form.spaetestens} onChange={e => set("spaetestens", e.target.value)} className={INPUT} />
        </div>
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">{t("EINR_MINDESTDAUER")}</label>
        <input type="number" inputMode="numeric" min="15" step="15" value={form.mindestdauerMin}
          onChange={e => set("mindestdauerMin", Number(e.target.value))} className={`${INPUT} nums`} />
      </div>
      <div>
        <p className="text-xs sf-text-2 mb-2">{t("EINR_RUNDUNG")}</p>
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
  const t = useT()
  function addOrt() { set("pufferOrte", [...form.pufferOrte, { suchtext: "", vorMin: 30, nachMin: 30 }]) }
  function removeOrt(i: number) { set("pufferOrte", form.pufferOrte.filter((_, j) => j !== i)) }
  function updateOrt(i: number, field: string, value: string | number) {
    set("pufferOrte", form.pufferOrte.map((p, j) => j === i ? { ...p, [field]: value } : p))
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs sf-text-2 mb-1">{t("EINR_PUFFER_STD")}</label>
        <input type="number" inputMode="numeric" min="0" step="5" value={form.pufferStandardMin}
          onChange={e => set("pufferStandardMin", Number(e.target.value))} className={`${INPUT} nums`} />
        <p className="text-xs sf-text-3 mt-1">{t("EINR_PUFFER_STD_HINT")}</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs sf-text-2 font-semibold uppercase tracking-wide">{t("EINR_PUFFER_ORTE_TITEL")}</p>
          <button type="button" onClick={addOrt} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            + {t("HINZUFUEGEN")}
          </button>
        </div>
        {form.pufferOrte.length === 0
          ? <p className="text-xs sf-text-3">{t("EINR_PUFFER_LEER")}</p>
          : (
            <div className="space-y-2">
              {form.pufferOrte.map((p, i) => (
                <div key={i} className="sf-card rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={p.suchtext} onChange={e => updateOrt(i, "suchtext", e.target.value)}
                      placeholder={t("EINR_PUFFER_ORT_PLACEHOLDER")} className={`flex-1 ${INPUT_SM}`} />
                    <button onClick={() => removeOrt(i)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs sf-text-3 mb-0.5">{t("EINR_PUFFER_VOR")}</p>
                      <input type="number" min="0" step="5" value={p.vorMin}
                        onChange={e => updateOrt(i, "vorMin", Number(e.target.value))} className={`${INPUT_SM} nums`} />
                    </div>
                    <div>
                      <p className="text-xs sf-text-3 mb-0.5">{t("EINR_PUFFER_NACH")}</p>
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
  const t = useT()
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs sf-text-2 mb-1">
          {t("EINR_PDF_NAME")} <span className="text-red-500">*</span>
        </label>
        <input type="text" value={form.deinName} onChange={e => set("deinName", e.target.value)}
          placeholder={t("EINR_PDF_NAME_PLACEHOLDER")} className={INPUT} />
      </div>
      <div>
        <p className="text-xs sf-text-2 font-semibold uppercase tracking-wide mb-2">{t("EINR_KW_SYSTEM")}</p>
        <div className="space-y-1.5">
          {([
            { value: "keine",  labelKey: "EINR_KW_KEINE" },
            { value: "iso",    labelKey: "EINR_KW_ISO" },
            { value: "tkmaxx", labelKey: "EINR_KW_TKMAXX" },
          ] as const).map(o => (
            <button key={o.value} type="button" onClick={() => set("kwSystem", o.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.kwSystem === o.value
                  ? "bg-blue-600 text-white"
                  : "bg-stone-100 dark:bg-neutral-800 sf-text hover:bg-stone-200 dark:hover:bg-neutral-700"
              }`}>{t(o.labelKey)}</button>
          ))}
        </div>
        {form.kwSystem === "tkmaxx" && (
          <div className="mt-3">
            <label className="block text-xs sf-text-2 mb-1">{t("EINR_ANKERDATUM")}</label>
            <input type="date" value={form.kwAnker} onChange={e => set("kwAnker", e.target.value)} className={INPUT} />
            <p className="text-xs sf-text-3 mt-1">{t("EINR_ANKERDATUM_HINT")}</p>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">
          {t("AG_PERSONALNUMMER")} <span className="font-normal text-stone-400 dark:text-neutral-500">{t("OPTIONAL")}</span>
        </label>
        <input type="text" value={form.personalnummer} onChange={e => set("personalnummer", e.target.value)}
          placeholder={t("AG_PLACEHOLDER_PERSONALNR")} className={`${INPUT} nums`} />
      </div>
      <div>
        <label className="block text-xs sf-text-2 mb-1">
          {t("EINR_PDF_FUSSZEILE")} <span className="font-normal text-stone-400 dark:text-neutral-500">{t("OPTIONAL")}</span>
        </label>
        <input type="text" value={form.fusszeilenText} onChange={e => set("fusszeilenText", e.target.value)}
          placeholder={t("EINR_PDF_FUSSZEILE_PLACEHOLDER")} className={INPUT} />
      </div>
    </div>
  )
}

function SchrittSperrzeiten({ form, set }: { form: FormDaten; set: SetFn }) {
  const t = useT()
  const wochentageLog = [
    t("TAG_LANG_SO"), t("TAG_LANG_MO"), t("TAG_LANG_DI"), t("TAG_LANG_MI"),
    t("TAG_LANG_DO"), t("TAG_LANG_FR"), t("TAG_LANG_SA"),
  ]
  function add() {
    set("festeSperrzeiten", [...form.festeSperrzeiten, { wochentag: 5, von: "12:00", bis: "14:00", bezeichnung: "" }])
  }
  function remove(i: number) { set("festeSperrzeiten", form.festeSperrzeiten.filter((_, j) => j !== i)) }
  function update(i: number, field: string, value: string | number) {
    set("festeSperrzeiten", form.festeSperrzeiten.map((sz, j) => j === i ? { ...sz, [field]: value } : sz))
  }
  return (
    <div className="space-y-3">
      <p className="text-sm sf-text-2">{t("EINR_SPERR_FRAGE")}</p>
      <div className="flex justify-end">
        <button type="button" onClick={add} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
          + {t("HINZUFUEGEN")}
        </button>
      </div>
      <div className="space-y-3">
        {form.festeSperrzeiten.map((sz, i) => (
          <div key={i} className="sf-card rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <select value={sz.wochentag} onChange={e => update(i, "wochentag", Number(e.target.value))}
                className={`flex-1 ${INPUT_SM}`}>
                {wochentageLog.map((tag, j) => <option key={j} value={j}>{tag}</option>)}
              </select>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none flex-shrink-0">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs sf-text-3 mb-0.5">{t("TERMIN_VON")}</p>
                <input type="time" value={sz.von} onChange={e => update(i, "von", e.target.value)} className={INPUT_SM} />
              </div>
              <div>
                <p className="text-xs sf-text-3 mb-0.5">{t("TERMIN_BIS")}</p>
                <input type="time" value={sz.bis} onChange={e => update(i, "bis", e.target.value)} className={INPUT_SM} />
              </div>
            </div>
            <input type="text" value={sz.bezeichnung} onChange={e => update(i, "bezeichnung", e.target.value)}
              placeholder={t("EINR_SPERR_BEZEICHNUNG_PLACEHOLDER")} className={INPUT_SM} />
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
  /** Wird nach erfolgreichem Setzen von einrichtungUebersprungen aufgerufen (statt onSchliessen). */
  onNachSpaeter?: () => void
}

export function EinrichtungsDialog({ employer, onBestaetigt, onSchliessen, onNachSpaeter }: EinrichtungsDialogProps) {
  const t = useT()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormDaten>(() => initialForm(employer))
  const [fehler, setFehler] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  const schrittTitel = [
    t("EINR_TITEL_BUNDESLAND"),
    t("EINR_TITEL_WOCHENTAGE"),
    t("EINR_TITEL_ZEITFENSTER"),
    t("EINR_TITEL_WEGEZEITEN"),
    t("EINR_TITEL_PDF"),
    t("EINR_TITEL_SPERRZEITEN"),
  ]

  function set<K extends keyof FormDaten>(key: K, value: FormDaten[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setFehler(null)
  }

  function weiter() {
    const err = validiereSchritt(step, form, t)
    if (err) { setFehler(err); return }
    setFehler(null)
    setStep(s => s + 1)
  }

  function zurueck() {
    setFehler(null)
    setStep(s => s - 1)
  }

  async function bestaetigen() {
    const err = validiereSchritt(step, form, t)
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
        pdf:               { deinName: form.deinName, fusszeilenText: form.fusszeilenText || undefined },
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
      setFehler(e instanceof Error ? e.message : t("EINR_SPEICHERN_FEHLER"))
    } finally {
      setLaden(false)
    }
  }

  async function spaeter() {
    try {
      const bestehende = employer.verfuegbarkeit ?? NEUTRALE_EINSTELLUNGEN
      await employersRepo.update(employer.id, {
        verfuegbarkeit: { ...bestehende, einrichtungUebersprungen: true },
      })
    } catch { /* best effort */ }
    ;(onNachSpaeter ?? onSchliessen)()
  }

  const istLetzterSchritt = step === TOTAL_STEPS - 1

  return (
    <BaseDialog onBackdropClick={onSchliessen} maxWidth="max-w-lg">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-stone-100 dark:border-white/5">
        <p className="text-xs sf-text-3 mb-0.5">
          {t("EINR_SCHRITT_VON").replace("{step}", String(step + 1)).replace("{total}", String(TOTAL_STEPS))}
        </p>
        <h2 className="text-base font-bold sf-text">{schrittTitel[step]}</h2>
        <p className="text-xs sf-text-2 mt-0.5">
          {t("EINR_EINSCHRAENKUNGEN").replace("{name}", employer.name)}
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
          onClick={spaeter}
          disabled={laden}
          className="text-sm text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors mr-auto disabled:opacity-40"
        >
          {t("SPAETER")}
        </button>
        {step > 0 && (
          <button onClick={zurueck} disabled={laden}
            className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40">
            ← {t("ZURUECK")}
          </button>
        )}
        {istLetzterSchritt ? (
          <button onClick={bestaetigen} disabled={laden}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-60"
            style={{ backgroundColor: "#2563eb" }}>
            {laden ? <ShiftslotLoader size="sm" label={t("SPEICHERT")} /> : t("BESTAETIGEN")}
          </button>
        ) : (
          <button onClick={weiter}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-all"
            style={{ backgroundColor: "#2563eb" }}>
            {t("WEITER")}
          </button>
        )}
      </div>
    </BaseDialog>
  )
}
