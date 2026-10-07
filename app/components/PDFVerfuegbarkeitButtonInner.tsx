"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { VerfuegbarkeitPDF } from "./VerfuegbarkeitPDF"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Bundesland, Employer } from "@/lib/types"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { minusEintraege as minusRepo } from "@/lib/storage"
import { auth } from "@/lib/firebase/client"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"

export interface PDFVerfuegbarkeitProps {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  employer: Employer | null
  onNachExport: () => Promise<void>
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
}: PDFVerfuegbarkeitProps) {
  const [laden, setLaden] = useState(false)

  async function handleClick() {
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

  return (
    <button
      onClick={handleClick}
      disabled={laden || ausgewaehlt.length === 0}
      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {laden ? "Erstelle PDF…" : "↓ PDF erstellen"}
    </button>
  )
}
