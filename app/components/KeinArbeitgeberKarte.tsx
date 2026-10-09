"use client"

import Link from "next/link"
import { STRINGS } from "@/lib/ui-strings"

/**
 * Shown on any page when the user has no active employer.
 * Guides them to /profil/arbeitgeber to create one.
 */
export function KeinArbeitgeberKarte() {
  return (
    <div className="mx-auto max-w-sm w-full rounded-2xl bg-white dark:bg-neutral-900 p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-semibold text-stone-700 dark:text-neutral-200 mb-2">
        {STRINGS.KEIN_ARBEITGEBER_TITEL}
      </p>
      <p className="text-sm text-stone-400 dark:text-neutral-500 mb-5 leading-relaxed">
        {STRINGS.KEIN_ARBEITGEBER_TEXT}
      </p>
      <Link
        href="/profil/arbeitgeber"
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
      >
        {STRINGS.KEIN_ARBEITGEBER_CTA}
      </Link>
    </div>
  )
}
