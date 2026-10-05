"use client"

import dynamic from "next/dynamic"
import type { EmailVerfuegbarkeitProps } from "./EmailVerfuegbarkeitButtonInner"

const EmailVerfuegbarkeitButtonInner = dynamic(
  () => import("./EmailVerfuegbarkeitButtonInner"),
  { ssr: false },
)

export function EmailVerfuegbarkeitButton(props: EmailVerfuegbarkeitProps) {
  return <EmailVerfuegbarkeitButtonInner {...props} />
}
