"use client"

import dynamic from "next/dynamic"
import type { PDFButtonProps } from "./PDFButtonInner"

// SSR ausschalten — react-pdf nutzt Browser-APIs (canvas, Blob)
const PDFButtonInner = dynamic(() => import("./PDFButtonInner"), { ssr: false })

export function PDFButton(props: PDFButtonProps) {
  return <PDFButtonInner {...props} />
}
