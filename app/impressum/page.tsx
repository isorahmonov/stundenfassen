import Link from "next/link"
import { LEGAL, assertKeinePlatzhalter } from "@/lib/legal"

export const metadata = { title: "Impressum – Stundenfassen" }

export default function ImpressumSeite() {
  assertKeinePlatzhalter()

  return (
    <main className="sf-page min-h-screen px-4 py-8 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            ← Zurück
          </Link>
        </div>

        <h1 className="text-xl font-bold sf-text">Impressum</h1>

        {/* TODO: Prüfen, ob Rechtsform/Inhaber im Impressum ergänzt werden muss (§ 5 DDG) */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <p className="text-sm sf-text-2 leading-relaxed">
            Angaben gemäß § 5 DDG:
          </p>
          <p className="text-sm sf-text leading-relaxed whitespace-pre-line">
            {LEGAL.NAME}{"\n"}{LEGAL.ANSCHRIFT}{"\n"}{LEGAL.EMAIL}
          </p>
        </section>

        <div className="flex justify-center gap-4 pt-2">
          <Link href="/datenschutz" className="text-xs sf-text-3 hover:underline">
            Datenschutz
          </Link>
          <span className="text-xs sf-text-3">·</span>
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            Zurück zur App
          </Link>
        </div>

      </div>
    </main>
  )
}
