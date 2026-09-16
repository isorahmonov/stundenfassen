"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Abgleich, Bundesland, Employer, Settings, Shift, Steuerklasse } from "@/lib/types"
import { employers as employersRepo, shifts as shiftsRepo, settings as settingsRepo, abgleich as abgleichRepo } from "@/lib/storage"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { uid } from "@/lib/storage/firestore/shared"
import { berechneMonatsSumme, type MonatsSumme } from "@/lib/calc/aggregate"
import { formatEuroCent, formatStundenDezimal } from "@/lib/calc/format"
import { SchichtTabelle } from "./SchichtTabelle"
import { SchnellEingabe } from "./SchnellEingabe"
import { AbgleichAnzeige } from "./AbgleichAnzeige"
import { WarnungsAnzeige } from "./WarnungsAnzeige"
import { PDFButton } from "./PDFButton"
import { HeatmapAbschnitt } from "./HeatmapAbschnitt"

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
  const [settingsBundesland, setSettingsBundesland] = useState<Bundesland>("HH")
  const [abgleichMap, setAbgleichMap] = useState<Map<string, Abgleich>>(new Map())
  const [jahresSchichten, setJahresSchichten] = useState<Shift[]>([])
  const [settings, setSettings] = useState<Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">>(FALLBACK_SETTINGS)
  const [laedt, setLaedt] = useState(true)
  const [version, setVersion] = useState(0)
  const [verfHinweis, setVerfHinweis] = useState<string | null>(null)

  // Archiv-Check: Hinweis wenn Verfügbarkeit in < 3 Wochen ausläuft
  useEffect(() => {
    async function pruefeArchiv() {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users", uid(), "verfuegbarkeit_archiv"),
            orderBy("erstelltAm", "desc"),
            limit(1),
          ),
        )
        if (snap.empty) return
        const datumBis = snap.docs[0].data().datumBis as string
        const bisDate = new Date(datumBis + "T00:00:00")
        const heute = new Date()
        heute.setHours(0, 0, 0, 0)
        const restTage = Math.round((bisDate.getTime() - heute.getTime()) / 86_400_000)
        if (restTage < 21) {
          const formatted = bisDate.toLocaleDateString("de-DE", {
            day: "2-digit", month: "long", year: "numeric",
          })
          setVerfHinweis(formatted)
        }
      } catch { /* still keine Anzeige */ }
    }
    pruefeArchiv()
  }, [])

  useEffect(() => {
    let abgebrochen = false

    async function laden() {
      setLaedt(true)
      try {
        const [emps, cfg, schichten, abgleichListe, alleSchichten] = await Promise.all([
          employersRepo.findAlle(),
          settingsRepo.get(),
          shiftsRepo.findByMonat(monat, jahr),
          abgleichRepo.findByMonatJahr(monat, jahr),
          shiftsRepo.findAlle(),
        ])
        const jahresSch = alleSchichten.filter((s) => s.datum.startsWith(String(jahr)))

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
        if (cfg?.bundesland) setSettingsBundesland(cfg.bundesland)
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
  // Bundesland: Arbeitgeber hat Vorrang, Settings dienen als Fallback für ältere Datensätze
  const bundesland: Bundesland = aktivSumme?.employer.bundesland ?? settingsBundesland

  if (laedt) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center">
        <span className="text-sm text-stone-400">Lade…</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-24">
        {/* Monatsnavigation */}
        <header className="flex items-center justify-between mb-8">
          <NavButton onClick={zumVormonat} label="Vormonat">‹</NavButton>
          <h1 className="text-base font-semibold tracking-tight text-stone-900 dark:text-neutral-100 select-none">
            {MONATE[monat - 1]} {jahr}
          </h1>
          <div className="flex items-center gap-1">
            <Link
              href="/arbeitgeber"
              className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 active:scale-90 transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              aria-label="Arbeitgeber verwalten"
              title="Arbeitgeber"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="5" r="2.5"/>
                <path d="M2.5 14c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5"/>
              </svg>
            </Link>
            <NavButton onClick={zumNaechstenMonat} label="Nächster Monat">›</NavButton>
          </div>
        </header>

        {/* Verfügbarkeits-Erinnerung */}
        {verfHinweis && (
          <Link
            href="/verfuegbarkeit"
            className="flex items-start gap-3 mb-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            <span className="text-amber-500 mt-px flex-shrink-0" aria-hidden>⏳</span>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
              Deine letzte Verfügbarkeit deckt nur noch bis{" "}
              <span className="font-semibold">{verfHinweis}</span> ab — Zeit für die nächste Runde.
            </p>
          </Link>
        )}

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
              employerId={aktivId ?? ""}
              monat={monat}
              jahr={jahr}
              onGeaendert={() => setVersion((v) => v + 1)}
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
              onGeloescht={() => setVersion((v) => v + 1)}
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

        <HeatmapAbschnitt />
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
