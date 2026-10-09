"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { ShiftslotLoader } from "./ShiftslotLoader"
import { VerfuegbarkeitPDF } from "./VerfuegbarkeitPDF"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Bundesland, Employer } from "@/lib/types"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { minusEintraege as minusRepo } from "@/lib/storage"
import { auth } from "@/lib/firebase/client"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { BaseDialog } from "./BaseDialog"

export interface PDFVerfuegbarkeitProps {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  employer: Employer | null
  onNachExport: () => Promise<void>
  onEinrichten?: () => void
}

function letzterSonntagStr(startSonntagStr: string, anzahlWochen: number): string {
  const d = new Date(startSonntagStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + (anzahlWochen - 1) * 7)
  return d.toISOString().slice(0, 10)
}

export default function PDFVerfuegbarkeitButtonInner({
  startSonntagStr,
  anzahlWochen,
  ausgewaehlt,
  bundesland,
  employer,
  onNachExport,
  onEinrichten,
}: PDFVerfuegbarkeitProps) {
  const [laden, setLaden] = useState(false)
  const [zeigeWarnung, setZeigeWarnung] = useState(false)

  async function erstellePDF() {
    setLaden(true)
    try {
      const alleMinus = await minusRepo.findAlle()
      const einst = employer?.verfuegbarkeit ?? NEUTRALE_EINSTELLUNGEN
      const mitarbeiterName = einst.pdf?.deinName ?? auth.currentUser?.displayName ?? auth.currentUser?.email ?? ""
      const kwSystem = einst.kwSystem
      const kwAnker = einst.kwAnker
      const wochenStart = einst.wochenStart
      const personalnummer = employer?.personalnummer
      const fusszeilenText = einst.pdf?.fusszeilenText

      const blob = await pdf(
        <VerfuegbarkeitPDF
          startSonntagStr={startSonntagStr}
          anzahlWochen={anzahlWochen}
          ausgewaehlt={ausgewaehlt}
          bundesland={bundesland}
          kwSystem={kwSystem}
          kwAnker={kwAnker}
          wochenStart={wochenStart}
          minusEintraege={alleMinus}
          mitarbeiterName={mitarbeiterName}
          personalnummer={personalnummer}
          fusszeilenText={fusszeilenText}
        />,
      ).toBlob()

      const letzterSo = letzterSonntagStr(startSonntagStr, anzahlWochen)
      let dateiname: string
      if (kwSystem === "tkmaxx" && kwAnker) {
        const kwVon = tkWoche(startSonntagStr, kwAnker)
        const kwBis = tkWoche(letzterSo, kwAnker)
        dateiname = anzahlWochen === 1 ? `Verfuegbarkeit_KW${kwVon}.pdf` : `Verfuegbarkeit_KW${kwVon}-KW${kwBis}.pdf`
      } else {
        const bis = new Date(letzterSo + "T00:00:00Z")
        bis.setUTCDate(bis.getUTCDate() + 6)
        dateiname = `Verfuegbarkeit_${startSonntagStr}_${bis.toISOString().slice(0, 10)}.pdf`
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = dateiname
      a.click()
      URL.revokeObjectURL(url)

      await onNachExport()
    } finally {
      setLaden(false)
    }
  }

  function handleClick() {
    if (employer?.verfuegbarkeit?.einrichtungBestaetigt !== true) {
      setZeigeWarnung(true)
      return
    }
    erstellePDF()
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={laden || ausgewaehlt.length === 0}
        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {laden ? <ShiftslotLoader size="sm" label="Erstelle PDF…" /> : "↓ PDF erstellen"}
      </button>

      {zeigeWarnung && (
        <BaseDialog maxWidth="max-w-sm" onBackdropClick={() => setZeigeWarnung(false)}>
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <h2 className="text-base font-bold sf-text">Verfügbarkeit nicht eingerichtet</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <p className="text-sm sf-text-2 leading-relaxed">
              Du hast die Verfügbarkeit für diesen Arbeitgeber noch nicht eingerichtet.
              Es gelten Standardwerte (06:00–20:30, Mo–Sa, keine festen Sperrzeiten).
            </p>
          </div>
          <div
            className="flex-shrink-0 px-6 pt-3 flex gap-2 justify-end"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => { setZeigeWarnung(false); onEinrichten?.() }}
              className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
            >
              Jetzt einrichten
            </button>
            <button
              onClick={() => { setZeigeWarnung(false); erstellePDF() }}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
            >
              Trotzdem fortfahren
            </button>
          </div>
        </BaseDialog>
      )}
    </>
  )
}
