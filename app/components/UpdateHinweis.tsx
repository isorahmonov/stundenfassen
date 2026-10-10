"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"
import { uid } from "@/lib/storage/firestore/shared"
import { entscheideAnzeige, type ChangelogEintrag } from "@/lib/changelog"
import { APP_VERSION, APP_DOMAINS } from "@/lib/brand"
import { BaseDialog } from "./BaseDialog"
import { ShiftslotLogo } from "./ShiftslotLogo"
import { useT } from "@/app/components/LangProvider"
import type { UiStrings } from "@/lib/i18n"

const LS_KEY = "sf_seen_version"

async function speichereVersion(userId: string) {
  try {
    await setDoc(
      doc(db, "users", userId),
      { lastSeenUpdateVersion: APP_VERSION },
      { merge: true },
    )
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LS_KEY, APP_VERSION)
    }
  } catch { /* best effort */ }
}

export function UpdateHinweis() {
  const t = useT()
  const [eintraege, setEintraege] = useState<ChangelogEintrag[]>([])
  const titelId = "upd-dialog-titel"
  const ersterFokusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    async function pruefen() {
      try {
        const userId = uid()

        // Read user doc and employers subcollection in parallel
        const [snap, empSnap] = await Promise.all([
          getDoc(doc(db, "users", userId)),
          getDocs(collection(db, "users", userId, "employers")),
        ])

        // Stored version: Firestore first, localStorage fallback
        const gespeichertFirestore: string | undefined = snap.data()?.lastSeenUpdateVersion
        const gespeichertLocal =
          typeof localStorage !== "undefined" ? (localStorage.getItem(LS_KEY) ?? undefined) : undefined
        const gespeichert = gespeichertFirestore ?? gespeichertLocal

        // Account < 10 min old counts as new even when employers exist (e.g. invitation flow)
        const creationTime = auth.currentUser?.metadata?.creationTime
        const istNeu = creationTime
          ? Date.now() - new Date(creationTime).getTime() < 10 * 60 * 1000
          : false

        const entscheidung = entscheideAnzeige(gespeichert, empSnap, istNeu)

        if (entscheidung.aktion === "speichern") {
          await speichereVersion(userId)
        } else if (entscheidung.aktion === "zeigen") {
          setEintraege(entscheidung.eintraege)
        }
      } catch { /* Auth not ready or no network */ }
    }
    pruefen()
  }, [])

  useEffect(() => {
    if (eintraege.length > 0) {
      ersterFokusRef.current?.focus()
    }
  }, [eintraege])

  async function schliessen() {
    setEintraege([])
    try {
      await speichereVersion(uid())
    } catch { /* best effort */ }
  }

  if (eintraege.length === 0) return null

  return (
    <BaseDialog maxWidth="max-w-sm" onBackdropClick={schliessen}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titelId}
        className="contents"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-6 pb-4">
          <ShiftslotLogo size={28} mode="mark" />
          <h2 id={titelId} className="text-base font-bold sf-text leading-snug">
            {t("UPD_DIALOG_TITEL")}
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {eintraege.map((eintrag, ei) => (
            <div key={eintrag.version} className={ei > 0 ? "mt-5" : ""}>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2.5">
                {t("UPD_VERSION_PREFIX")} {eintrag.version}
              </p>
              <ul className="space-y-2.5">
                {eintrag.itemKeys.map((key) => {
                  const text = t(key as keyof UiStrings).replace("{url}", APP_DOMAINS.current[0])
                  return (
                    <li key={key} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="10 3 5 9 2 6" />
                        </svg>
                      </span>
                      <span className="text-sm sf-text-2 leading-relaxed">{text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 pt-4 flex flex-col gap-2"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <button
            ref={ersterFokusRef}
            onClick={schliessen}
            className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] motion-safe:transition-all"
          >
            {t("UPD_LOSGEH")}
          </button>
          <Link
            href="/profil"
            onClick={schliessen}
            className="py-1 text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("UPD_ZUM_PROFIL")}
          </Link>
        </div>
      </div>
    </BaseDialog>
  )
}
