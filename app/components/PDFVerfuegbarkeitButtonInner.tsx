"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { VerfuegbarkeitPDF } from "./VerfuegbarkeitPDF"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Bundesland } from "@/lib/types"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { minusEintraege as minusRepo } from "@/lib/storage"

export interface PDFVerfuegbarkeitProps {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  kwAnker: string
  onNachExport: () => Promise<void>
}

export default function PDFVerfuegbarkeitButtonInner({
  startSonntagStr,
  anzahlWochen,
  ausgewaehlt,
  bundesland,
  kwAnker,
  onNachExport,
}: PDFVerfuegbarkeitProps) {
  const [laden, setLaden] = useState(false)

  async function handleClick() {
    setLaden(true)
    try {
      const alleMinus = await minusRepo.findAlle()

      const blob = await pdf(
        <VerfuegbarkeitPDF
          startSonntagStr={startSonntagStr}
          anzahlWochen={anzahlWochen}
          ausgewaehlt={ausgewaehlt}
          bundesland={bundesland}
          kwAnker={kwAnker}
          minusEintraege={alleMinus}
        />,
      ).toBlob()

      const kwVon = tkWoche(startSonntagStr, kwAnker)
      const letzterSo = new Date(startSonntagStr + "T00:00:00Z")
      letzterSo.setUTCDate(letzterSo.getUTCDate() + (anzahlWochen - 1) * 7)
      const kwBis = tkWoche(letzterSo.toISOString().slice(0, 10), kwAnker)
      const dateiname = anzahlWochen === 1
        ? `Verfuegbarkeit_KW${kwVon}.pdf`
        : `Verfuegbarkeit_KW${kwVon}-KW${kwBis}.pdf`

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
