"use client"

import type { Abgleich } from "@/lib/types"
import { vergleicheAbgleich, type MonatsSumme } from "@/lib/calc/aggregate"
import type { Ampel } from "@/lib/calc/warnings"
import { formatEuroCent, formatStundenDezimal } from "@/lib/calc/format"

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
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 mt-0.5 ${AMPEL_DOT[ampel]}`}
      aria-label={ampel}
    />
  )
}

function DeltaStunden({ delta }: { delta: number }) {
  const vorzeichen = delta >= 0 ? "+" : ""
  return <span>{vorzeichen}{formatStundenDezimal(Math.round(Math.abs(delta) * 60) * (delta < 0 ? -1 : 1))}</span>
}

function DeltaBetrag({ delta }: { delta: number }) {
  const vorzeichen = delta >= 0 ? "+" : "−"
  return <span>{vorzeichen}{formatEuroCent(Math.abs(delta))}</span>
}

export function AbgleichAnzeige({
  monatsSumme,
  abgleich,
}: {
  monatsSumme: MonatsSumme
  abgleich: Abgleich | null
}) {
  if (!abgleich) return null

  const ergebnis = vergleicheAbgleich(monatsSumme, abgleich)
  const keineStunden = ergebnis.differenzStunden === null
  const keinBetrag = ergebnis.differenzCent === null

  if (keineStunden && keinBetrag) return null

  return (
    <div className="mt-4 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="bg-white px-4 py-2.5 border-b border-stone-100">
        <p className="text-xs font-semibold text-stone-500 tracking-wide uppercase">Abgleich</p>
      </div>

      {!keineStunden && (
        <div
          className={`flex items-start gap-3 px-4 py-3 ${AMPEL_BG[ergebnis.ampelStunden]} ${!keinBetrag ? "border-b border-white/60" : ""}`}
        >
          <Dot ampel={ergebnis.ampelStunden} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-500 mb-0.5">Stunden</p>
            <p className="text-sm text-stone-800">
              <span className="font-medium">{formatStundenDezimal(abgleich.lautAbrechnungStunden! * 60)}</span>
              <span className="text-stone-400 mx-1.5">laut Abr. ·</span>
              <span className="font-medium">{formatStundenDezimal(monatsSumme.nettoMinuten)}</span>
              <span className="text-stone-400 mx-1.5">erfasst</span>
            </p>
          </div>
          {ergebnis.differenzStunden !== null && (
            <p className={`text-sm font-semibold shrink-0 nums ${AMPEL_TEXT[ergebnis.ampelStunden]}`}>
              <DeltaStunden delta={ergebnis.differenzStunden} />
            </p>
          )}
        </div>
      )}

      {!keinBetrag && (
        <div className={`flex items-start gap-3 px-4 py-3 ${AMPEL_BG[ergebnis.ampelBetrag]}`}>
          <Dot ampel={ergebnis.ampelBetrag} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-500 mb-0.5">Betrag</p>
            <p className="text-sm text-stone-800">
              <span className="font-medium">{formatEuroCent(abgleich.tatsaechlichAusgezahltCent!)}</span>
              <span className="text-stone-400 mx-1.5">ausgez. ·</span>
              <span className="font-medium">{formatEuroCent(monatsSumme.nettoGeschaetztCent)}</span>
              <span className="text-stone-400 mx-1.5">gesch.</span>
            </p>
          </div>
          {ergebnis.differenzCent !== null && (
            <p className={`text-sm font-semibold shrink-0 nums ${AMPEL_TEXT[ergebnis.ampelBetrag]}`}>
              <DeltaBetrag delta={ergebnis.differenzCent} />
            </p>
          )}
        </div>
      )}
    </div>
  )
}
