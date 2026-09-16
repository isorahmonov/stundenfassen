"use client"

import dynamic from "next/dynamic"
import type { PDFVerfuegbarkeitProps } from "./PDFVerfuegbarkeitButtonInner"

const Inner = dynamic(() => import("./PDFVerfuegbarkeitButtonInner"), { ssr: false })

export function PDFVerfuegbarkeitButton(props: PDFVerfuegbarkeitProps) {
  return <Inner {...props} />
}
