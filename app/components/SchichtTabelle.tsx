"use client"

import { parseISO } from "date-fns"
import type { Bundesland, Employer, Shift } from "@/lib/types"
import { feiertagName, istSonntag } from "@/lib/calc/holidays"
import { berechneSchicht } from "@/lib/calc/lohn"
import {
  bruttoMinuten as calcBrutto,
  pauseMinuten as calcPause,
  schichtIntervall,
} from "@/lib/calc/time"
import { pruefePause } from "@/lib/calc/pause"
import {
  formatDatum,
  formatEuroCent,
  formatStundenDezimal,
  formatWochentag,
} from "@/lib/calc/format"

interface ShiftZeile {
  shift: Shift
  datum: Date
  feiertag: string | null
  sonntag: boolean
  zuKurzePause: boolean
  nettoMinuten: number
  bruttoCent: number
}

function berechneZeile(shift: Shift, employer: Employer, bundesland: Bundesland): ShiftZeile {
  const datum = parseISO(shift.datum)
  const intervall = schichtIntervall(shift)
  const brutto = calcBrutto(intervall)
  const pause = calcPause(intervall)
  const { ausreichend } = pruefePause(brutto, pause)
  const { nettoMinuten, bruttoCent } = berechneSchicht(shift, employer)

  return {
    shift,
    datum,
    feiertag: feiertagName(datum, bundesland),
    sonntag: istSonntag(datum),
    zuKurzePause: !ausreichend,
    nettoMinuten,
    bruttoCent,
  }
}

function zeilenBg(z: ShiftZeile): string {
  if (z.feiertag) return "bg-red-50"
  if (z.sonntag) return "bg-stone-100"
  if (z.zuKurzePause) return "bg-amber-50"
  return "bg-white"
}

function zeilenBorder(z: ShiftZeile): string {
  if (z.feiertag) return "border-red-100"
  if (z.sonntag) return "border-stone-200"
  if (z.zuKurzePause) return "border-amber-100"
  return "border-stone-100"
}

const SPALTEN = ["Datum", "Wochentag", "Start", "Pause von", "Pause bis", "Ende", "Std", "Brutto"]
const RECHTS = new Set(["Std", "Brutto"])

export function SchichtTabelle({
  schichten,
  employer,
  bundesland,
}: {
  schichten: Shift[]
  employer: Employer
  bundesland: Bundesland
}) {
  if (schichten.length === 0) return null

  const zeilen = [...schichten]
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map((s) => berechneZeile(s, employer, bundesland))

  return (
    <div className="mt-6">
      {/* Mobile: Karten */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {zeilen.map((z) => (
          <SchichtKarte key={z.shift.id} zeile={z} />
        ))}
      </div>

      {/* Desktop: Tabelle */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[580px]">
          <thead>
            <tr className="border-b border-stone-200 bg-white">
              {SPALTEN.map((h) => (
                <th
                  key={h}
                  className={`py-2.5 px-3 text-xs font-medium text-stone-500 whitespace-nowrap ${
                    RECHTS.has(h) ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <TabellenZeile key={z.shift.id} zeile={z} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabellenZeile({ zeile: z }: { zeile: ShiftZeile }) {
  return (
    <tr className={`border-b ${zeilenBorder(z)} ${zeilenBg(z)}`}>
      <td className="py-2.5 px-3 text-sm text-stone-900 nums whitespace-nowrap">
        {formatDatum(z.shift.datum)}
      </td>
      <td className="py-2.5 px-3 text-sm text-stone-700 whitespace-nowrap">
        {formatWochentag(z.datum)}
        {z.feiertag && (
          <span className="ml-1.5 text-xs text-red-600 font-medium">({z.feiertag})</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm text-stone-700 nums">{z.shift.start}</td>
      <td className="py-2.5 px-3 text-sm text-stone-500 nums">{z.shift.pauseVon ?? "—"}</td>
      <td className="py-2.5 px-3 text-sm text-stone-500 nums">{z.shift.pauseBis ?? "—"}</td>
      <td className="py-2.5 px-3 text-sm text-stone-700 nums">{z.shift.ende}</td>
      <td className="py-2.5 px-3 text-sm text-right text-stone-900 font-medium nums whitespace-nowrap">
        {formatStundenDezimal(z.nettoMinuten)}
      </td>
      <td className="py-2.5 px-3 text-sm text-right text-stone-700 nums whitespace-nowrap">
        {formatEuroCent(z.bruttoCent)}
      </td>
    </tr>
  )
}

function SchichtKarte({ zeile: z }: { zeile: ShiftZeile }) {
  const bg = zeilenBg(z)
  return (
    <div
      className={`${bg} rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-medium text-stone-900">
          {formatWochentag(z.datum, true)}, {formatDatum(z.datum)}
        </span>
        {z.feiertag && (
          <span className="text-xs font-medium text-red-600">{z.feiertag}</span>
        )}
      </div>
      <p className="text-sm text-stone-600 mb-1.5">
        {z.shift.start}–{z.shift.ende}
        {z.shift.pauseVon && z.shift.pauseBis && (
          <span className="text-stone-400">
            {" "}
            · Pause {z.shift.pauseVon}–{z.shift.pauseBis}
          </span>
        )}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold nums text-stone-900">
          {formatStundenDezimal(z.nettoMinuten)}
        </span>
        <span className="text-stone-300">·</span>
        <span className="nums text-stone-700">{formatEuroCent(z.bruttoCent)}</span>
        {z.zuKurzePause && (
          <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            Pause zu kurz
          </span>
        )}
      </div>
    </div>
  )
}
