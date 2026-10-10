"use client"

import Link from "next/link"
import { useLang } from "@/app/components/LangProvider"
import { getImpressumStrings } from "@/lib/legal/impressum"
import { LEGAL } from "@/lib/legal"

export function ImpressumContent() {
  const { locale: lang } = useLang()
  const s = getImpressumStrings(lang)

  return (
    <main className="sf-page min-h-screen px-4 py-8 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            {s.back}
          </Link>
        </div>

        <h1 className="text-xl font-bold sf-text">{s.title}</h1>

        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <h2 className="text-sm font-semibold sf-text">{s.ddgHeading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.ddgIntro}</p>
          <p className="text-sm sf-text leading-relaxed whitespace-pre-line">
            {LEGAL.NAME}{"\n"}{LEGAL.ANSCHRIFT}{"\n"}{s.emailLabel}: {LEGAL.EMAIL}
          </p>
        </section>

        <div className="flex justify-center gap-4 pt-2">
          <Link href="/datenschutz" className="text-xs sf-text-3 hover:underline">
            {s.datenschutzLink}
          </Link>
          <span className="text-xs sf-text-3">·</span>
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            {s.backToApp}
          </Link>
        </div>

      </div>
    </main>
  )
}
