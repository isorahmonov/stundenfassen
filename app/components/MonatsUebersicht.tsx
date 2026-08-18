"use client"

import { useState, useEffect } from "react"
import type { Abgleich, Bundesland, Employer, Settings, Shift, Steuerklasse } from "@/lib/types"
import { db } from "@/lib/storage/dexie/db"
import { seedDatabase } from "@/lib/storage/seed"
import { berechneMonatsSumme, type MonatsSumme } from "@/lib/calc/aggregate"
import { formatEuroCent, formatStundenDezimal } from "@/lib/calc/format"
import { SchichtTabelle } from "./SchichtTabelle"
import { SchnellEingabe } from "./SchnellEingabe"
import { AbgleichAnzeige } from "./AbgleichAnzeige"
import { WarnungsAnzeige } from "./WarnungsAnzeige"
import { PDFButton } from "./PDFButton"

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

const FALLBACK_SETTINGS = {
  steuerklasse: 1 as Steuerklasse,
  kirchensteuer: false,
  kurzfristigPauschal: false,
}

interface EmployerSumme {
  employer: Employer
  summe: MonatsSumme
}

export default function MonatsUebersicht() {
  const heute = new Date()
  const [monat, setMonat] = useState(heute.getMonth() + 1)
  const [jahr, setJahr] = useState(heute.getFullYear())
  const [aktivId, setAktivId] = useState<string | null>(null)
  const [summen, setSummen] = useState<EmployerSumme[]>([])
  const [schichten, setSchichten] = useState<Shift[]>([])
  const [bundesland, setBundesland] = useState<Bundesland>("BY")
  const [abgleichMap, setAbgleichMap] = useState<Map<string, Abgleich>>(new Map())
  const [jahresSchichten, setJahresSchichten] = useState<Shift[]>([])
  const [settings, setSettings] = useState<Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">>(FALLBACK_SETTINGS)
  const [laedt, setLaedt] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let abgebrochen = false

    async function laden() {
      setLaedt(true)
      try {
        await seedDatabase(db)
        const mm = String(monat).padStart(2, "0")
        const [emps, cfg, schichten, abgleichListe, jahresSch] = await Promise.all([
          db.employers.toArray(),
          db.settings.get("default"),
          db.shifts
            .where("datum")
            .between(`${jahr}-${mm}-01`, `${jahr}-${mm}-31`, true, true)
            .toArray(),
          db.abgleich.where("[monat+jahr]").equals([monat, jahr]).toArray(),
          db.shifts.where("datum").between(`${jahr}-01-01`, `${jahr}-12-31`, true, true).toArray(),
        ])

        if (abgebrochen) return

        const aktiveEmps = emps.filter((e) => !e.archiviert)
        const geladeneSettings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal"> =
          cfg ?? FALLBACK_SETTINGS

        const ergebnis: EmployerSumme[] = aktiveEmps.map((employer) => ({
          employer,
          summe: berechneMonatsSumme(
            schichten.filter((s) => s.employerId === employer.id),
            employer,
            geladeneSettings,
          ),
        }))

        setSummen(ergebnis)
        setSchichten(schichten)
        setAbgleichMap(new Map(abgleichListe.map((a) => [a.employerId, a])))
        setJahresSchichten(jahresSch)
        setSettings(geladeneSettings)
        if (cfg?.bundesland) setBundesland(cfg.bundesland)
        setAktivId((prev) =>
          prev && aktiveEmps.some((e) => e.id === prev) ? prev : (aktiveEmps[0]?.id ?? null),
        )
      } finally {
        if (!abgebrochen) setLaedt(false)
      }
    }

    laden()
    return () => {
      abgebrochen = true
    }
  }, [monat, jahr, version])

  function zumVormonat() {
    if (monat === 1) {
      setJahr((j) => j - 1)
      setMonat(12)
    } else {
      setMonat((m) => m - 1)
    }
  }

  function zumNaechstenMonat() {
    if (monat === 12) {
      setJahr((j) => j + 1)
      setMonat(1)
    } else {
      setMonat((m) => m + 1)
    }
  }

  const aktivSumme = summen.find((es) => es.employer.id === aktivId)

  if (laedt) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <span className="text-sm text-stone-400">Lade…</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-24">
        {/* Monatsnavigation */}
        <header className="flex items-center justify-between mb-8">
          <NavButton onClick={zumVormonat} label="Vormonat">‹</NavButton>
          <h1 className="text-base font-semibold tracking-tight text-stone-900 select-none">
            {MONATE[monat - 1]} {jahr}
          </h1>
          <NavButton onClick={zumNaechstenMonat} label="Nächster Monat">›</NavButton>
        </header>

        {/* Arbeitgeber-Tabs */}
        {summen.length > 0 && (
          <nav role="tablist" aria-label="Arbeitgeber" className="flex gap-2 mb-6 flex-wrap">
            {summen.map(({ employer }) => {
              const istAktiv = employer.id === aktivId
              return (
                <button
                  key={employer.id}
                  role="tab"
                  aria-selected={istAktiv}
                  onClick={() => setAktivId(employer.id)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
                  style={{
                    backgroundColor: istAktiv ? employer.farbe : "transparent",
                    borderColor: istAktiv ? employer.farbe : "#d6d3d1",
                    color: istAktiv ? "#fff" : "#78716c",
                    transform: istAktiv ? "scale(1.04)" : "scale(1)",
                    transition: [
                      "background-color 130ms ease-out",
                      "border-color 130ms ease-out",
                      "color 120ms ease-out",
                      "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                    ].join(", "),
                  }}
                >
                  {employer.name}
                </button>
              )
            })}
          </nav>
        )}

        {/* Summen-Kacheln */}
        {aktivSumme ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <Kachel
                label="Stunden"
                wert={formatStundenDezimal(aktivSumme.summe.nettoMinuten)}
                akzent={aktivSumme.employer.farbe}
              />
              <Kachel
                label="Brutto"
                wert={formatEuroCent(aktivSumme.summe.bruttoCent)}
              />
              <Kachel
                label="Netto geschätzt"
                wert={formatEuroCent(aktivSumme.summe.nettoGeschaetztCent)}
                klasse="col-span-2 sm:col-span-1"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-stone-400">
                {aktivSumme.summe.anzahlSchichten === 0
                  ? "Keine Schichten in diesem Monat"
                  : `${aktivSumme.summe.anzahlSchichten} Schicht${aktivSumme.summe.anzahlSchichten === 1 ? "" : "en"}`}
              </p>
              <PDFButton
                employer={aktivSumme.employer}
                monat={monat}
                jahr={jahr}
                schichten={schichten.filter((s) => s.employerId === aktivId)}
                settings={settings}
                bundesland={bundesland}
                abgleich={aktivId ? (abgleichMap.get(aktivId) ?? null) : null}
              />
            </div>

            <AbgleichAnzeige
              monatsSumme={aktivSumme.summe}
              abgleich={aktivId ? (abgleichMap.get(aktivId) ?? null) : null}
            />

            <WarnungsAnzeige
              jahresSchichten={jahresSchichten}
              employers={summen.map((es) => es.employer)}
              aktiverEmployer={aktivSumme.employer}
              jahr={jahr}
            />

            <SchichtTabelle
              schichten={schichten.filter((s) => s.employerId === aktivId)}
              employer={aktivSumme.employer}
              bundesland={bundesland}
            />

            <SchnellEingabe
              employer={aktivSumme.employer}
              onSaved={() => setVersion((v) => v + 1)}
            />
          </>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-stone-400">Keine Arbeitgeber vorhanden.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-stone-400 select-none transition-all duration-100 hover:bg-stone-200 hover:text-stone-700 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
    >
      {children}
    </button>
  )
}

function Kachel({
  label,
  wert,
  akzent,
  klasse = "",
}: {
  label: string
  wert: string
  akzent?: string
  klasse?: string
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] ${klasse}`}
    >
      <p className="text-xs font-medium text-stone-500 mb-1.5">{label}</p>
      <p
        className="text-xl font-semibold leading-tight nums"
        style={{ color: akzent ?? "#1c1917" }}
      >
        {wert}
      </p>
    </div>
  )
}
