"use client"

import Link from "next/link"
import { useLang } from "@/app/components/LangProvider"
import { getDatenschutzStrings } from "@/lib/legal/datenschutz"
import { LEGAL } from "@/lib/legal"

export function DatenschutzContent() {
  const { locale: lang } = useLang()
  const s = getDatenschutzStrings(lang)

  return (
    <main className="sf-page min-h-screen px-4 py-8 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            {s.back}
          </Link>
        </div>

        <h1 className="text-xl font-bold sf-text">{s.title}</h1>
        <p className="text-xs sf-text-3">{s.standLine}</p>

        {s.govNote && (
          <div className="sf-card rounded-xl px-4 py-3 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30">
            <p className="text-xs sf-text-2 leading-relaxed">{s.govNote}</p>
          </div>
        )}

        {/* 1 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s1heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s1intro}</p>
          <p className="text-sm sf-text leading-relaxed whitespace-pre-line">
            {LEGAL.NAME}{"\n"}{LEGAL.ANSCHRIFT}{"\n"}{LEGAL.EMAIL}
          </p>
        </section>

        {/* 2 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <h2 className="text-sm font-semibold sf-text">{s.s2heading}</h2>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2loginHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2loginBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2appHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2appBody}</p>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2appBody2}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2icalHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2icalBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2gmailHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2gmailBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2logsHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2logsBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s2settingsHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s2settingsBody}</p>
          </div>
        </section>

        {/* 3 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s3heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s3body}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s3body2}</p>
        </section>

        {/* 4 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <h2 className="text-sm font-semibold sf-text">{s.s4heading}</h2>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s4firebaseHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s4firebaseBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s4vercelHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s4vercelBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s4smtpHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s4smtpBody}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">{s.s4calendarHeading}</h3>
            <p className="text-sm sf-text-2 leading-relaxed">{s.s4calendarBody}</p>
          </div>
        </section>

        {/* 5 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s5heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s5body}</p>
        </section>

        {/* 6 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s6heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s6body}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s6body2}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s6body3}</p>
        </section>

        {/* 7 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s7heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s7intro}</p>
          <ul className="text-sm sf-text-2 leading-relaxed list-disc list-inside space-y-1 pl-1">
            <li>
              <span className="font-mono text-xs">sf_ical2_*</span>{" – "}{s.s7item1desc}
            </li>
            <li>
              <span className="font-mono text-xs">sf_sel_*</span>{" – "}{s.s7item2desc}
            </li>
            <li>
              <span className="font-mono text-xs">sf_theme</span>{" – "}{s.s7item3desc}
            </li>
            <li>
              <span className="font-mono text-xs">sf_lang</span>{" – "}{s.s7item4desc}
            </li>
            <li>
              <span className="font-mono text-xs">sf_seen_version</span>{" – "}{s.s7item5desc}
            </li>
          </ul>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s7body2}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s7body3}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s7fontsNote}</p>
        </section>

        {/* 8 */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">{s.s8heading}</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            {s.s8body1}{" "}<span className="font-mono text-xs sf-text">{LEGAL.EMAIL}</span>{s.s8body1post}
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s8body2}</p>
          <p className="text-sm sf-text-2 leading-relaxed">{s.s8body3}</p>
        </section>

        <div className="flex justify-center gap-4 pt-2">
          <Link href="/impressum" className="text-xs sf-text-3 hover:underline">
            {s.impressumLink}
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
