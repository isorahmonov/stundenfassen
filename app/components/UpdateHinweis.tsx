"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { uid } from "@/lib/storage/firestore/shared"
import { CURRENT_UPDATE } from "@/lib/updates"

export function UpdateHinweis() {
  const [sichtbar, setSichtbar] = useState(false)
  const [animiert, setAnimiert] = useState(false)

  useEffect(() => {
    async function pruefen() {
      try {
        const snap = await getDoc(doc(db, "users", uid()))
        if (snap.data()?.lastSeenUpdateVersion !== CURRENT_UPDATE.version) {
          setSichtbar(true)
          requestAnimationFrame(() => setAnimiert(true))
        }
      } catch { /* Auth noch nicht bereit oder kein Netz — ignorieren */ }
    }
    pruefen()
  }, [])

  async function schliessen() {
    setAnimiert(false)
    setTimeout(() => setSichtbar(false), 200)
    try {
      await setDoc(
        doc(db, "users", uid()),
        { lastSeenUpdateVersion: CURRENT_UPDATE.version },
        { merge: true },
      )
    } catch { /* best effort */ }
  }

  if (!sichtbar) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${animiert ? "opacity-100" : "opacity-0"}`}
        onClick={schliessen}
      />
      <div
        className={`relative w-full max-w-sm sf-card rounded-2xl shadow-2xl p-6 transition-all duration-200 ${
          animiert ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              Was ist neu
            </p>
            <h2 className="text-base font-bold sf-text leading-snug">
              {CURRENT_UPDATE.title}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        </div>

        {/* Stichpunkte */}
        <ul className="space-y-2.5 mb-6">
          {CURRENT_UPDATE.points.map((punkt, i) => (
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

        <button
          onClick={schliessen}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
