"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Bundesland, Employer, EmployerArt } from "@/lib/types"
import { employers as employersRepo } from "@/lib/storage"
import { formatEuroCent } from "@/lib/calc/format"

const ART_LABEL: Record<EmployerArt, string> = {
  werkstudent: "Werkstudent",
  kurzfristig: "Kurzfristig",
  minijob: "Minijob",
  sonstiges: "Sonstiges",
}

const BUNDESLAENDER: { value: Bundesland; label: string }[] = [
  { value: "BB", label: "Brandenburg" },
  { value: "BE", label: "Berlin" },
  { value: "BW", label: "Baden-Württemberg" },
  { value: "BY", label: "Bayern" },
  { value: "HB", label: "Bremen" },
  { value: "HE", label: "Hessen" },
  { value: "HH", label: "Hamburg" },
  { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" },
  { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" },
  { value: "SH", label: "Schleswig-Holstein" },
  { value: "SL", label: "Saarland" },
  { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" },
  { value: "TH", label: "Thüringen" },
]

interface FormDaten {
  name: string
  farbe: string
  art: EmployerArt
  bundesland: Bundesland
  stundenlohnEur: string
  zuschlagSonntag: string
  zuschlagFeiertag: string
  zuschlagNacht: string
}

const LEER_FORM: FormDaten = {
  name: "",
  farbe: "#2563eb",
  art: "werkstudent",
  bundesland: "HH",
  stundenlohnEur: "",
  zuschlagSonntag: "50",
  zuschlagFeiertag: "100",
  zuschlagNacht: "25",
}

function formZuEmployer(f: FormDaten): Omit<Employer, "id"> {
  return {
    name: f.name.trim(),
    farbe: f.farbe,
    art: f.art,
    bundesland: f.bundesland,
    stundenlohnCent: Math.round(parseFloat(f.stundenlohnEur.replace(",", ".")) * 100),
    zuschlagSonntagProzent: parseFloat(f.zuschlagSonntag) || 0,
    zuschlagFeiertagProzent: parseFloat(f.zuschlagFeiertag) || 0,
    zuschlagNachtProzent: parseFloat(f.zuschlagNacht) || 0,
  }
}

function employerZuForm(e: Employer): FormDaten {
  return {
    name: e.name,
    farbe: e.farbe,
    art: e.art,
    bundesland: e.bundesland ?? "HH",
    stundenlohnEur: (e.stundenlohnCent / 100).toFixed(2).replace(".", ","),
    zuschlagSonntag: String(e.zuschlagSonntagProzent),
    zuschlagFeiertag: String(e.zuschlagFeiertagProzent),
    zuschlagNacht: String(e.zuschlagNachtProzent),
  }
}

export default function ArbeitgeberVerwaltung() {
  const [employers, setEmployers] = useState<Employer[]>([])
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [neuFormOffen, setNeuFormOffen] = useState(false)
  const [laedt, setLaedt] = useState(true)

  async function laden() {
    const alle = await employersRepo.findAlle()
    alle.sort((a, b) => (a.archiviert ? 1 : 0) - (b.archiviert ? 1 : 0) || a.name.localeCompare(b.name))
    setEmployers(alle)
    setLaedt(false)
  }

  useEffect(() => { laden() }, [])

  async function speichernNeu(form: FormDaten) {
    await employersRepo.add(formZuEmployer(form))
    setNeuFormOffen(false)
    laden()
  }

  async function speichernBearbeiten(id: string, form: FormDaten) {
    await employersRepo.update(id, formZuEmployer(form))
    setBearbeitenId(null)
    laden()
  }

  async function archivieren(id: string, archiviert: boolean) {
    await employersRepo.update(id, { archiviert })
    laden()
  }

  const aktive = employers.filter((e) => !e.archiviert)
  const archivierte = employers.filter((e) => e.archiviert)

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-neutral-200 active:scale-90 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            aria-label="Zurück"
          >
            ‹
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-stone-900 dark:text-neutral-100">
            Arbeitgeber
          </h1>
          <button
            onClick={() => { setNeuFormOffen(true); setBearbeitenId(null) }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl font-light transition-all duration-100 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-stone-400 text-white"
            style={{ backgroundColor: "#2563eb" }}
            aria-label="Neuer Arbeitgeber"
          >
            +
          </button>
        </header>

        {laedt ? (
          <p className="text-center text-sm text-stone-400 dark:text-neutral-500">Lade…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Formular neuer Arbeitgeber */}
            {neuFormOffen && (
              <ArbeitgeberForm
                initial={LEER_FORM}
                onSpeichern={speichernNeu}
                onAbbrechen={() => setNeuFormOffen(false)}
              />
            )}

            {/* Aktive Arbeitgeber */}
            {aktive.length === 0 && !neuFormOffen && (
              <div className="sf-card rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-stone-400 dark:text-neutral-500 mb-1">Noch keine Arbeitgeber.</p>
                <button
                  onClick={() => setNeuFormOffen(true)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ersten anlegen →
                </button>
              </div>
            )}

            {aktive.map((e) =>
              bearbeitenId === e.id ? (
                <ArbeitgeberForm
                  key={e.id}
                  initial={employerZuForm(e)}
                  onSpeichern={(f) => speichernBearbeiten(e.id, f)}
                  onAbbrechen={() => setBearbeitenId(null)}
                />
              ) : (
                <ArbeitgeberKarte
                  key={e.id}
                  employer={e}
                  onBearbeiten={() => { setBearbeitenId(e.id); setNeuFormOffen(false) }}
                  onArchivieren={() => archivieren(e.id, true)}
                />
              )
            )}

            {/* Archivierte Arbeitgeber */}
            {archivierte.length > 0 && (
              <details className="mt-4 group">
                <summary className="text-xs font-medium text-stone-400 dark:text-neutral-500 cursor-pointer select-none list-none flex items-center gap-1.5 mb-2">
                  <span className="transition-transform duration-150 group-open:rotate-90 inline-block">›</span>
                  {archivierte.length} archiviert
                </summary>
                <div className="flex flex-col gap-2">
                  {archivierte.map((e) => (
                    <ArbeitgeberKarte
                      key={e.id}
                      employer={e}
                      onBearbeiten={() => { setBearbeitenId(e.id); setNeuFormOffen(false) }}
                      onArchivieren={() => archivieren(e.id, false)}
                      archiviert
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ArbeitgeberKarte({
  employer: e,
  onBearbeiten,
  onArchivieren,
  archiviert = false,
}: {
  employer: Employer
  onBearbeiten: () => void
  onArchivieren: () => void
  archiviert?: boolean
}) {
  return (
    <div className={`sf-card rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] ${archiviert ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Farbkreis */}
        <div
          className="w-8 h-8 rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: e.farbe }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-stone-900 dark:text-neutral-100 truncate">{e.name}</p>
            <p className="text-sm font-medium nums text-stone-700 dark:text-neutral-300 shrink-0">
              {formatEuroCent(e.stundenlohnCent)}/h
            </p>
          </div>
          <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
            {ART_LABEL[e.art]}
            <span className="mx-1.5 text-stone-300 dark:text-neutral-600">·</span>
            {e.bundesland}
            <span className="mx-1.5 text-stone-300 dark:text-neutral-600">·</span>
            So {e.zuschlagSonntagProzent}%
            <span className="mx-1.5 text-stone-300 dark:text-neutral-600">·</span>
            FT {e.zuschlagFeiertagProzent}%
            <span className="mx-1.5 text-stone-300 dark:text-neutral-600">·</span>
            Nacht {e.zuschlagNachtProzent}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-white/5">
        <button
          onClick={onBearbeiten}
          className="text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 transition-colors duration-100"
        >
          Bearbeiten
        </button>
        <span className="text-stone-200 dark:text-neutral-700">·</span>
        <button
          onClick={onArchivieren}
          className="text-xs font-medium text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-300 transition-colors duration-100"
        >
          {archiviert ? "Reaktivieren" : "Archivieren"}
        </button>
      </div>
    </div>
  )
}

function ArbeitgeberForm({
  initial,
  onSpeichern,
  onAbbrechen,
}: {
  initial: FormDaten
  onSpeichern: (f: FormDaten) => void
  onAbbrechen: () => void
}) {
  const [form, setForm] = useState<FormDaten>(initial)

  function set(key: keyof FormDaten, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSpeichern(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sf-card rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.04)]"
      style={{ borderTop: `3px solid ${form.farbe}` }}
    >
      {/* Name + Farbe */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <input
            type="color"
            value={form.farbe}
            onChange={(e) => set("farbe", e.target.value)}
            className="w-10 h-10 rounded-full cursor-pointer border-0 p-0.5 bg-transparent"
            aria-label="Farbe"
          />
        </div>
        <div className="flex-1">
          <FormLabel>Name</FormLabel>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="z.B. TechCorp GmbH"
            className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 placeholder:text-stone-300 dark:placeholder:text-neutral-600 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
          />
        </div>
      </div>

      {/* Art + Stundenlohn */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <FormLabel>Beschäftigungsart</FormLabel>
          <select
            value={form.art}
            onChange={(e) => set("art", e.target.value as EmployerArt)}
            className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
          >
            {(Object.keys(ART_LABEL) as EmployerArt[]).map((art) => (
              <option key={art} value={art}>{ART_LABEL[art]}</option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>Stundenlohn (EUR)</FormLabel>
          <input
            type="text"
            required
            inputMode="decimal"
            value={form.stundenlohnEur}
            onChange={(e) => set("stundenlohnEur", e.target.value)}
            placeholder="15,00"
            className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 placeholder:text-stone-300 dark:placeholder:text-neutral-600 nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
          />
        </div>
      </div>

      {/* Bundesland */}
      <div className="mb-4">
        <FormLabel>Bundesland (für Feiertage)</FormLabel>
        <select
          value={form.bundesland}
          onChange={(e) => set("bundesland", e.target.value as Bundesland)}
          className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
        >
          {BUNDESLAENDER.map((bl) => (
            <option key={bl.value} value={bl.value}>{bl.label} ({bl.value})</option>
          ))}
        </select>
      </div>

      {/* Zuschläge */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {([
          ["zuschlagSonntag", "Sonntag %"],
          ["zuschlagFeiertag", "Feiertag %"],
          ["zuschlagNacht", "Nacht %"],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <FormLabel>{label}</FormLabel>
            <input
              type="number"
              min="0"
              max="200"
              step="5"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
            />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAbbrechen}
          className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-100 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
          style={{ backgroundColor: form.farbe }}
        >
          Speichern
        </button>
      </div>
    </form>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">{children}</p>
}
