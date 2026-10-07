"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { uid } from "@/lib/storage/firestore/shared"
import { CURRENT_UPDATE } from "@/lib/updates"
import { sollEinrichtenZeigen } from "@/lib/verfuegbarkeit/einrichtungsUtils"
import { BaseDialog } from "./BaseDialog"

export function UpdateHinweis() {
  const router = useRouter()
  const [sichtbar, setSichtbar] = useState(false)
  const [seite, setSeite] = useState(0)
  const [hatUnbestaetigte, setHatUnbestaetigte] = useState(false)

  useEffect(() => {
    async function pruefen() {
      try {
        const userId = uid()

        // Neue Nutzer ohne Arbeitgeber sehen den Hinweis nicht
        const empSnap = await getDocs(collection(db, "users", userId, "employers"))
        if (empSnap.empty) return

        setHatUnbestaetigte(sollEinrichtenZeigen(empSnap.docs.map((d) => d.data() as { verfuegbarkeit?: { einrichtungBestaetigt?: boolean } })))

        const snap = await getDoc(doc(db, "users", userId))
        if (snap.data()?.lastSeenUpdateVersion !== CURRENT_UPDATE.version) {
          setSichtbar(true)
        }
      } catch { /* Auth noch nicht bereit oder kein Netz */ }
    }
    pruefen()
  }, [])

  async function speichereVersion() {
    try {
      await setDoc(
        doc(db, "users", uid()),
        { lastSeenUpdateVersion: CURRENT_UPDATE.version },
        { merge: true },
      )
    } catch { /* best effort */ }
  }

  async function verstanden() {
    setSichtbar(false)
    await speichereVersion()
  }

  async function jetztEinrichten() {
    setSichtbar(false)
    await speichereVersion()
    router.push("/verfuegbarkeit")
  }

  async function spaeter() {
    setSichtbar(false)
    await speichereVersion()
  }

  function schliessenOhneSpeichern() {
    // Schließt ohne Version zu speichern → Hinweis erscheint beim nächsten Öffnen wieder
    setSichtbar(false)
  }

  if (!sichtbar) return null

  const page = CURRENT_UPDATE.pages[seite]
  const istLetzte = seite === CURRENT_UPDATE.pages.length - 1

  return (
    <BaseDialog maxWidth="max-w-sm" onBackdropClick={schliessenOhneSpeichern}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
          {page.kicker}
        </p>
        <h2 className="text-base font-bold sf-text leading-snug">
          {page.title}
        </h2>
      </div>

      {/* Scrollbarer Inhalt */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {page.text && (
          <p className="text-sm sf-text-2 leading-relaxed">{page.text}</p>
        )}
        {page.points && (
          <ul className="space-y-2.5">
            {page.points.map((punkt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="10 3 5 9 2 6" />
                  </svg>
                </span>
                <span className="text-sm sf-text-2 leading-relaxed">{punkt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Seitenanzeige */}
      <div className="flex justify-center gap-1.5 pt-2 pb-1">
        {CURRENT_UPDATE.pages.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === seite
                ? "bg-blue-600 dark:bg-blue-400"
                : "bg-stone-300 dark:bg-neutral-600"
            }`}
          />
        ))}
      </div>

      {/* Sticky Footer */}
      <div
        className="flex-shrink-0 px-6 pt-3 flex gap-2 justify-end"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {seite > 0 && (
          <button
            onClick={() => setSeite((s) => s - 1)}
            className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
          >
            Zurück
          </button>
        )}
        {istLetzte && hatUnbestaetigte ? (
          <>
            <button
              onClick={spaeter}
              className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
            >
              Später
            </button>
            <button
              onClick={jetztEinrichten}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
            >
              Jetzt einrichten
            </button>
          </>
        ) : istLetzte ? (
          <button
            onClick={verstanden}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
          >
            Verstanden
          </button>
        ) : (
          <button
            onClick={() => setSeite((s) => s + 1)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
          >
            Weiter
          </button>
        )}
      </div>
    </BaseDialog>
  )
}
