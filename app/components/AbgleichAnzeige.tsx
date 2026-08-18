"use client"

import { useState } from "react"
import type { Abgleich } from "@/lib/types"
import { vergleicheAbgleich, type MonatsSumme } from "@/lib/calc/aggregate"
import type { Ampel } from "@/lib/calc/warnings"
import { formatEuroCent, formatStundenDezimal } from "@/lib/calc/format"
import { db } from "@/lib/storage/dexie/db"

const AMPEL_DOT: Record<Ampel, string> = {
  gruen: "bg-emerald-500",
  gelb: "bg-amber-400",
  rot: "bg-red-500",
}
const AMPEL_TEXT: Record<Ampel, string> = {
  gruen: "text-emerald-700",
  gelb: "text-amber-700",
  rot: "text-red-700",
}
const AMPEL_BG: Record<Ampel, string> = {
  gruen: "bg-emerald-50",
  gelb: "bg-amber-50",
  rot: "bg-red-50",
}

function Dot({ ampel }: { ampel: Ampel }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 mt-0.5 ${AMPEL_DOT[ampel]}`} />
}

function DeltaStunden({ delta }: { delta: number }) {
  const v = delta >= 0 ? "+" : ""
  return <span>{v}{formatStundenDezimal(Math.round(Math.abs(delta) * 60) * (delta < 0 ? -1 : 1))}</span>
}

function DeltaBetrag({ delta }: { delta: number }) {
  return <span>{delta >= 0 ? "+" : "−"}{formatEuroCent(Math.abs(delta))}</span>
}

function parseEurInput(s: string): number {
  return Math.round(parseFloat(s.replace(",", ".")) * 100)
}

function centToEurInput(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",")
}

export function AbgleichAnzeige({
  monatsSumme,
  abgleich,
  employerId,
  monat,
  jahr,
  onGeaendert,
}: {
  monatsSumme: MonatsSumme
  abgleich: Abgleich | null
  employerId: string
  monat: number
  jahr: number
  onGeaendert: () => void
}) {
  const [formOffen, setFormOffen] = useState(false)
  const [stunden, setStunden] = useState("")
  const [betrag, setBetrag] = useState("")
  const [speichert, setSpeichert] = useState(false)

  function oeffneForm() {
    setStunden(
      abgleich?.lautAbrechnungStunden != null
        ? String(abgleich.lautAbrechnungStunden).replace(".", ",")
        : "",
    )
    setBetrag(
      abgleich?.tatsaechlichAusgezahltCent != null
        ? centToEurInput(abgleich.tatsaechlichAusgezahltCent)
        : "",
    )
    setFormOffen(true)
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setSpeichert(true)
    try {
      const lautAbrechnungStunden = stunden ? parseFloat(stunden.replace(",", ".")) : undefined
      const tatsaechlichAusgezahltCent = betrag ? parseEurInput(betrag) : undefined

      if (abgleich) {
        await db.abgleich.update(abgleich.id, { lautAbrechnungStunden, tatsaechlichAusgezahltCent })
      } else {
        await db.abgleich.add({
          id: crypto.randomUUID(),
          employerId,
          monat,
          jahr,
          lautAbrechnungStunden,
          tatsaechlichAusgezahltCent,
        })
      }
      setFormOffen(false)
      onGeaendert()
    } finally {
      setSpeichert(false)
    }
  }

  const hatDaten = abgleich?.lautAbrechnungStunden != null || abgleich?.tatsaechlichAusgezahltCent != null
  const ergebnis = hatDaten ? vergleicheAbgleich(monatsSumme, abgleich!) : null

  return (
    <div className="mt-4 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="sf-card px-4 py-2.5 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-400 tracking-wide uppercase">
          Abgleich
        </p>
        <button
          onClick={formOffen ? () => setFormOffen(false) : oeffneForm}
          className="text-xs font-medium text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-300 transition-colors"
        >
          {formOffen ? "Abbrechen" : hatDaten ? "Bearbeiten" : "Eintragen"}
        </button>
      </div>

      {/* Eingabe-Formular */}
      {formOffen && (
        <form onSubmit={speichern} className="sf-card px-4 py-3 border-b border-stone-100 dark:border-white/5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">
                Laut Abrechnung (h)
              </p>
              <input
                type="text"
                inputMode="decimal"
                value={stunden}
                onChange={(e) => setStunden(e.target.value)}
                placeholder="34,50"
                className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 placeholder:text-stone-300 dark:placeholder:text-neutral-600 nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">
                Ausgezahlt (EUR)
              </p>
              <input
                type="text"
                inputMode="decimal"
                value={betrag}
                onChange={(e) => setBetrag(e.target.value)}
                placeholder="502,50"
                className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm text-stone-900 dark:text-neutral-100 placeholder:text-stone-300 dark:placeholder:text-neutral-600 nums outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={speichert || (!stunden && !betrag)}
            className="w-full rounded-xl bg-stone-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold py-2 disabled:opacity-40 active:scale-[.99] transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            {speichert ? "Speichert…" : "Speichern"}
          </button>
        </form>
      )}

      {/* Kein Eintrag + kein Formular */}
      {!hatDaten && !formOffen && (
        <div className="sf-card px-4 py-4 text-center">
          <p className="text-xs text-stone-400 dark:text-neutral-500">
            Noch kein Abgleich — Lohnabrechnung eintragen um Abweichungen zu sehen.
          </p>
        </div>
      )}

      {/* Abgleich-Anzeige */}
      {hatDaten && ergebnis && (
        <>
          {abgleich!.lautAbrechnungStunden != null && (
            <div
              className={`flex items-start gap-3 px-4 py-3 ${AMPEL_BG[ergebnis.ampelStunden]} ${abgleich!.tatsaechlichAusgezahltCent != null ? "border-b border-white/60" : ""}`}
            >
              <Dot ampel={ergebnis.ampelStunden} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500 mb-0.5">Stunden</p>
                <p className="text-sm text-stone-800 flex flex-wrap gap-x-1">
                  <span className="font-medium nums">
                    {formatStundenDezimal(abgleich!.lautAbrechnungStunden! * 60)}
                  </span>
                  <span className="text-stone-400">laut Abr. ·</span>
                  <span className="font-medium nums">{formatStundenDezimal(monatsSumme.nettoMinuten)}</span>
                  <span className="text-stone-400">erfasst</span>
                </p>
              </div>
              {ergebnis.differenzStunden != null && (
                <p className={`text-sm font-semibold shrink-0 nums ${AMPEL_TEXT[ergebnis.ampelStunden]}`}>
                  <DeltaStunden delta={ergebnis.differenzStunden} />
                </p>
              )}
            </div>
          )}
          {abgleich!.tatsaechlichAusgezahltCent != null && (
            <div className={`flex items-start gap-3 px-4 py-3 ${AMPEL_BG[ergebnis.ampelBetrag]}`}>
              <Dot ampel={ergebnis.ampelBetrag} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500 mb-0.5">Betrag</p>
                <p className="text-sm text-stone-800 flex flex-wrap gap-x-1">
                  <span className="font-medium nums">
                    {formatEuroCent(abgleich!.tatsaechlichAusgezahltCent!)}
                  </span>
                  <span className="text-stone-400">ausgez. ·</span>
                  <span className="font-medium nums">
                    {formatEuroCent(monatsSumme.nettoGeschaetztCent)}
                  </span>
                  <span className="text-stone-400">gesch.</span>
                </p>
              </div>
              {ergebnis.differenzCent != null && (
                <p className={`text-sm font-semibold shrink-0 nums ${AMPEL_TEXT[ergebnis.ampelBetrag]}`}>
                  <DeltaBetrag delta={ergebnis.differenzCent} />
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
