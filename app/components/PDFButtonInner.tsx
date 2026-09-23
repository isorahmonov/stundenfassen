"use client"

// Direkter Import — diese Datei wird nur client-seitig geladen (via dynamic in PDFButton)
import { PDFDownloadLink } from "@react-pdf/renderer"
import type { Abgleich, Employer, Settings, Shift } from "@/lib/types"
import type { Bundesland } from "@/lib/types"
import { MonatsPDF } from "./MonatsPDF"

const MONATE = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
]

export interface PDFButtonProps {
  employer: Employer
  monat: number
  jahr: number
  schichten: Shift[]
  settings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">
  bundesland: Bundesland
  abgleich: Abgleich | null
}

export default function PDFButtonInner(props: PDFButtonProps) {
  const { employer, monat, jahr } = props
  const dateiname = `${employer.name.replace(/\s+/g, "-")}_${MONATE[monat - 1]}-${jahr}.pdf`

  return (
    <PDFDownloadLink
      document={<MonatsPDF {...props} />}
      fileName={dateiname}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-stone-50 hover:border-stone-300 active:scale-95 transition-all duration-100 cursor-pointer select-none">
          {loading ? "…" : "↓ PDF"}
        </span>
      )}
    </PDFDownloadLink>
  )
}
