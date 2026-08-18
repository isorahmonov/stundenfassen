"use client"

import type { Employer, Shift } from "@/lib/types"
import {
  zaehleKurzfristigTage,
  werkstudentWochenstunden,
  KURZFRISTIG_TAGE_ROT,
  type WochenstundenEintrag,
  type Ampel,
} from "@/lib/calc/warnings"
import { formatStundenDezimal } from "@/lib/calc/format"

const AMPEL_DOT: Record<Ampel, string> = {
  gruen: "bg-emerald-500",
  gelb: "bg-amber-400",
  rot: "bg-red-500",
}
const AMPEL_LABEL: Record<Ampel, string> = {
  gruen: "text-emerald-700",
  gelb: "text-amber-700",
  rot: "text-red-700",
}
const AMPEL_BG: Record<Ampel, string> = {
  gruen: "bg-emerald-50",
  gelb: "bg-amber-50",
  rot: "bg-red-50",
}
const AMPEL_BAR: Record<Ampel, string> = {
  gruen: "bg-emerald-400",
  gelb: "bg-amber-400",
  rot: "bg-red-500",
}

function Dot({ ampel }: { ampel: Ampel }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${AMPEL_DOT[ampel]}`} />
}

export function WarnungsAnzeige({
  jahresSchichten,
  employers,
  aktiverEmployer,
  jahr,
}: {
  jahresSchichten: Shift[]
  employers: Employer[]
  aktiverEmployer: Employer | null
  jahr: number
}) {
  const kurzfristig = zaehleKurzfristigTage(jahresSchichten, employers, jahr)
  const hatKurzfristig = employers.some((e) => e.art === "kurzfristig")

  const werkstudentWochen: WochenstundenEintrag[] =
    aktiverEmployer?.art === "werkstudent"
      ? werkstudentWochenstunden(
          jahresSchichten.filter((s) => s.employerId === aktiverEmployer.id),
        )
      : []

  const maxWoche = werkstudentWochen.length
    ? werkstudentWochen.reduce((a, b) => (a.minuten >= b.minuten ? a : b))
    : null

  const auffaelligeWochen = werkstudentWochen.filter((w) => w.ampel !== "gruen")

  // Nichts anzeigen wenn alles grün und keine kurzfristigen Arbeitgeber
  if (!hatKurzfristig && werkstudentWochen.length === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      {/* Kurzfristig-Tagezähler */}
      {hatKurzfristig && (
        <div className={`rounded-2xl px-4 py-3 ${AMPEL_BG[kurzfristig.ampel]} shadow-[0_1px_2px_rgba(0,0,0,0.05)]`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Dot ampel={kurzfristig.ampel} />
              <p className="text-xs font-semibold text-stone-700">Kurzfristig-Tage {jahr}</p>
            </div>
            <p className={`text-sm font-bold nums ${AMPEL_LABEL[kurzfristig.ampel]}`}>
              {kurzfristig.tage} / {KURZFRISTIG_TAGE_ROT}
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${AMPEL_BAR[kurzfristig.ampel]}`}
              style={{ width: `${Math.min((kurzfristig.tage / KURZFRISTIG_TAGE_ROT) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Werkstudent-Wochenstunden */}
      {aktiverEmployer?.art === "werkstudent" && werkstudentWochen.length > 0 && (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-stone-500 tracking-wide uppercase">
              Wochenstunden
            </p>
            {maxWoche && (
              <div className="flex items-center gap-1.5">
                <Dot ampel={maxWoche.ampel} />
                <span className={`text-xs font-medium ${AMPEL_LABEL[maxWoche.ampel]}`}>
                  max. {formatStundenDezimal(maxWoche.minuten)}
                </span>
              </div>
            )}
          </div>

          {auffaelligeWochen.length > 0 ? (
            <div className="flex flex-col gap-1">
              {auffaelligeWochen.map((w) => (
                <div
                  key={w.kalenderwoche}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${AMPEL_BG[w.ampel]}`}
                >
                  <span className="text-xs text-stone-600">{w.kalenderwoche}</span>
                  <span className={`text-xs font-semibold nums ${AMPEL_LABEL[w.ampel]}`}>
                    {formatStundenDezimal(w.minuten)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {werkstudentWochen.map((w) => (
                <div
                  key={w.kalenderwoche}
                  className="flex items-center gap-1 rounded-lg bg-stone-50 px-2.5 py-1"
                >
                  <Dot ampel={w.ampel} />
                  <span className="text-xs text-stone-500">{w.kalenderwoche}</span>
                  <span className="text-xs font-medium text-stone-700 nums ml-0.5">
                    {formatStundenDezimal(w.minuten)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
