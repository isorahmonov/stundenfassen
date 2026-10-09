"use client"

import { useEffect, useRef, useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { ShiftslotLoader } from "./ShiftslotLoader"
import { VerfuegbarkeitPDF } from "./VerfuegbarkeitPDF"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Bundesland, Employer, EmailVorlage } from "@/lib/types"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { minusEintraege as minusRepo, emailVorlagen as emailVorlageRepo } from "@/lib/storage"
import { auth } from "@/lib/firebase/client"
import { wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"
import { NEUTRALE_EINSTELLUNGEN } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { BaseDialog } from "./BaseDialog"

export interface EmailVerfuegbarkeitProps {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  employer: Employer | null
  onNachExport: () => Promise<void>
  onEinrichten?: () => void
}

async function blobZuBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function ersetzePlatzhalter(vorlage: string, von: string, bis: string, name: string, personalnummer: string): string {
  let text = vorlage
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{zeitraum_von\}\}/g, von)
    .replace(/\{\{zeitraum_bis\}\}/g, bis)

  if (personalnummer) {
    text = text.replace(/\{\{personalnummer\}\}/g, personalnummer)
  } else {
    text = text.replace(/\s*\([^()]*\{\{personalnummer\}\}[^()]*\)/g, "")
    text = text.replace(/[^\n]*\{\{personalnummer\}\}[^\n]*\n?/g, "")
  }
  return text
}

function formatDE(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`
}

function istGueltigeEmailListe(eingabe: string): boolean {
  if (!eingabe.trim()) return true
  return eingabe.split(",").map((s) => s.trim()).filter(Boolean)
    .every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
}

// ─── Erfolgsansicht ───────────────────────────────────────────────────────────

function ErfolgView({ an, cc, onSchliessen }: { an: string; cc: string; onSchliessen: () => void }) {
  const [sichtbar, setSichtbar] = useState(false)
  const [sekunden, setSekunden] = useState(5)
  const ref = useRef(onSchliessen)
  ref.current = onSchliessen

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSichtbar(true))
    const interval = setInterval(() => {
      setSekunden((s) => {
        if (s <= 1) { ref.current(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => { cancelAnimationFrame(frame); clearInterval(interval) }
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-2">
      <div className={`transition-all duration-300 ${sichtbar ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}>
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-all duration-300 delay-150 ${sichtbar ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <div className={`text-center transition-all duration-300 delay-200 ${sichtbar ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <p className="text-sm font-semibold sf-text mb-1">Gesendet!</p>
        <p className="text-xs sf-text-2">An: {an}</p>
        {cc && <p className="text-xs sf-text-2">CC: {cc}</p>}
      </div>
      <button
        onClick={onSchliessen}
        className={`text-xs sf-text-3 hover:sf-text transition-all duration-300 delay-300 ${sichtbar ? "opacity-100" : "opacity-0"}`}
      >
        Schließen ({sekunden}s)
      </button>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function EmailVerfuegbarkeitButtonInner({
  startSonntagStr,
  anzahlWochen,
  ausgewaehlt,
  bundesland,
  employer,
  onNachExport,
  onEinrichten,
}: EmailVerfuegbarkeitProps) {
  const [dialogOffen, setDialogOffen] = useState(false)
  const [zeigeWarnung, setZeigeWarnung] = useState(false)
  const [laden, setLaden] = useState(false)
  const [empfaenger, setEmpfaenger] = useState("")
  const [cc, setCc] = useState("")
  const [vorlagen, setVorlagen] = useState<EmailVorlage[]>([])
  const [aktivVorlageId, setAktivVorlageId] = useState("")
  const [fehler, setFehler] = useState("")
  const [gesendeteAn, setGesendeteAn] = useState("")
  const [gesendeteCC, setGesendeteCC] = useState("")

  const einst = employer?.verfuegbarkeit ?? NEUTRALE_EINSTELLUNGEN
  const mitarbeiterName = einst.pdf?.deinName ?? auth.currentUser?.displayName ?? auth.currentUser?.email ?? ""
  const personalnummer = employer?.personalnummer ?? ""

  const wochen = wochenDaten(startSonntagStr, anzahlWochen)
  const vonDatum = formatDE(wochen[0][0])
  const bisDatum = formatDE(wochen[wochen.length - 1][6])

  const dateiname = (() => {
    const letzterSo = new Date(startSonntagStr + "T00:00:00Z")
    letzterSo.setUTCDate(letzterSo.getUTCDate() + (anzahlWochen - 1) * 7)
    const letzterSoStr = letzterSo.toISOString().slice(0, 10)
    if (einst.kwSystem === "tkmaxx" && einst.kwAnker) {
      const kwVon = tkWoche(startSonntagStr, einst.kwAnker)
      const kwBis = tkWoche(letzterSoStr, einst.kwAnker)
      return anzahlWochen === 1 ? `Verfuegbarkeit_KW${kwVon}.pdf` : `Verfuegbarkeit_KW${kwVon}-KW${kwBis}.pdf`
    }
    const bis = new Date(letzterSo)
    bis.setUTCDate(bis.getUTCDate() + 6)
    return `Verfuegbarkeit_${startSonntagStr}_${bis.toISOString().slice(0, 10)}.pdf`
  })()

  const aktivVorlage = vorlagen.find((v) => v.id === aktivVorlageId)
  const vorschauBetreff = aktivVorlage ? ersetzePlatzhalter(aktivVorlage.betreff, vonDatum, bisDatum, mitarbeiterName, personalnummer) : ""
  const vorschauText = aktivVorlage ? ersetzePlatzhalter(aktivVorlage.text, vonDatum, bisDatum, mitarbeiterName, personalnummer) : ""

  const ccFehler = cc.trim() && !istGueltigeEmailListe(cc)
  const kannSenden = !laden && istGueltigeEmailListe(empfaenger) && empfaenger.trim().length > 0 && istGueltigeEmailListe(cc)

  function waehleVorlage(id: string) {
    const v = vorlagen.find((vl) => vl.id === id)
    if (!v) return
    setAktivVorlageId(id)
    if (v.empfaenger) setEmpfaenger(v.empfaenger)
    setCc(v.cc ?? "")
  }

  async function oeffneEmailDialog() {
    setFehler("")
    setGesendeteAn("")
    setGesendeteCC("")
    setEmpfaenger("")
    setCc("")
    const vl = await emailVorlageRepo.findAlle().catch(() => [])
    setVorlagen(vl)
    const erste = vl[0]
    setAktivVorlageId(erste?.id ?? "")
    setEmpfaenger(erste?.empfaenger ?? "")
    setCc(erste?.cc ?? "")
    setDialogOffen(true)
  }

  function oeffneDialog() {
    if (employer?.verfuegbarkeit?.einrichtungBestaetigt !== true) {
      setZeigeWarnung(true)
      return
    }
    oeffneEmailDialog()
  }

  async function senden() {
    if (!kannSenden || !aktivVorlageId) return
    setLaden(true)
    setFehler("")
    try {
      const alleMinus = await minusRepo.findAlle()
      const blob = await pdf(
        <VerfuegbarkeitPDF
          startSonntagStr={startSonntagStr}
          anzahlWochen={anzahlWochen}
          ausgewaehlt={ausgewaehlt}
          bundesland={bundesland}
          kwSystem={einst.kwSystem}
          kwAnker={einst.kwAnker}
          wochenStart={einst.wochenStart}
          minusEintraege={alleMinus}
          mitarbeiterName={mitarbeiterName}
          personalnummer={personalnummer || undefined}
          fusszeilenText={einst.pdf?.fusszeilenText}
        />,
      ).toBlob()

      const pdfBase64 = await blobZuBase64(blob)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("Nicht angemeldet")

      const res = await fetch("/api/verfuegbarkeit/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          to: empfaenger.trim(),
          cc: cc.trim() || undefined,
          betreff: vorschauBetreff,
          text: vorschauText,
          pdfBase64,
          dateiname,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { fehler?: string }).fehler ?? `Fehler ${res.status}`)
      }

      await onNachExport()
      setGesendeteAn(empfaenger.trim())
      setGesendeteCC(cc.trim())
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e))
    } finally {
      setLaden(false)
    }
  }

  const zeigeErfolg = gesendeteAn.length > 0

  function schliesseDialog() {
    setDialogOffen(false)
    setGesendeteAn("")
    setGesendeteCC("")
  }

  return (
    <>
      <button
        onClick={oeffneDialog}
        disabled={ausgewaehlt.length === 0}
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-stone-600 dark:text-neutral-300 shadow-sm hover:bg-stone-50 dark:hover:bg-neutral-700 active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ✉ Per E-Mail
      </button>

      {zeigeWarnung && (
        <BaseDialog maxWidth="max-w-sm" onBackdropClick={() => setZeigeWarnung(false)}>
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <h2 className="text-base font-bold sf-text">Verfügbarkeit nicht eingerichtet</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <p className="text-sm sf-text-2 leading-relaxed">
              Du hast die Verfügbarkeit für diesen Arbeitgeber noch nicht eingerichtet.
              Es gelten Standardwerte (06:00–20:30, Mo–Sa, keine festen Sperrzeiten).
            </p>
          </div>
          <div
            className="flex-shrink-0 px-6 pt-3 flex gap-2 justify-end"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => { setZeigeWarnung(false); onEinrichten?.() }}
              className="rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
            >
              Jetzt einrichten
            </button>
            <button
              onClick={() => { setZeigeWarnung(false); oeffneEmailDialog() }}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] transition-all"
            >
              Trotzdem fortfahren
            </button>
          </div>
        </BaseDialog>
      )}

      {dialogOffen && (
        <BaseDialog
          maxWidth="max-w-md"
          onBackdropClick={() => { if (!laden && !zeigeErfolg) schliesseDialog() }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-white/5">
            <h2 className="text-sm font-semibold sf-text">Per E-Mail senden</h2>
            <button
              onClick={() => { if (!laden) schliesseDialog() }}
              disabled={laden}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-700 transition-colors text-sm"
            >✕</button>
          </div>

          {/* Scrollbarer Inhalt */}
          <div className="flex-1 overflow-y-auto">
            {zeigeErfolg ? (
              <ErfolgView an={gesendeteAn} cc={gesendeteCC} onSchliessen={schliesseDialog} />
            ) : vorlagen.length === 0 ? (
              <div className="px-5 pb-5 pt-4">
                <p className="text-sm sf-text-2 text-center py-4">
                  Bitte zuerst eine Vorlage im{" "}
                  <a href="/profil" className="text-blue-600 dark:text-blue-400 underline">Profil-Tab</a>
                  {" "}anlegen.
                </p>
              </div>
            ) : (
              <div className="px-5 pt-4 pb-4 space-y-4">
                {vorlagen.length > 1 && (
                  <div>
                    <label className="block text-xs sf-text-2 mb-1">Vorlage</label>
                    <select
                      value={aktivVorlageId}
                      onChange={(e) => waehleVorlage(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-shadow"
                    >
                      {vorlagen.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs sf-text-2 mb-1">An</label>
                  <input
                    type="text"
                    value={empfaenger}
                    onChange={(e) => setEmpfaenger(e.target.value)}
                    placeholder="planung@arbeitgeber.de"
                    className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs sf-text-2 mb-1">
                    CC <span className="text-stone-400 font-normal">optional, mehrere durch Komma</span>
                  </label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="kollege@example.de"
                    className={`w-full rounded-xl border px-3 py-2 text-sm sf-text sf-input outline-none focus:ring-2 transition-shadow ${
                      ccFehler
                        ? "border-red-400 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900"
                        : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-stone-200 dark:focus:ring-neutral-700"
                    }`}
                  />
                  {ccFehler && (
                    <p className="text-xs text-red-500 mt-1">Ungültige E-Mail-Adresse(n) — Komma zwischen mehreren.</p>
                  )}
                </div>

                {aktivVorlage && (
                  <div className="rounded-xl bg-stone-50 dark:bg-neutral-800/50 p-3 space-y-2">
                    <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide">Vorschau</p>
                    <p className="text-xs sf-text">
                      <span className="font-medium">Betreff:</span>{" "}{vorschauBetreff}
                    </p>
                    <pre className="text-xs sf-text-2 whitespace-pre-wrap font-sans leading-relaxed border-t border-stone-200 dark:border-neutral-700 pt-2">
                      {vorschauText}
                    </pre>
                    <p className="text-xs sf-text-3 border-t border-stone-200 dark:border-neutral-700 pt-2">
                      📎 {dateiname}
                    </p>
                  </div>
                )}

                {fehler === "KEIN_EMAIL_KONTO" ? (
                  <div className="text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2.5">
                    <p className="text-amber-800 dark:text-amber-300 font-medium mb-0.5">Kein E-Mail-Konto hinterlegt</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      Bitte zuerst eigenes Gmail-Konto im{" "}
                      <a href="/profil" className="underline font-medium">Profil-Tab einrichten →</a>
                    </p>
                  </div>
                ) : fehler ? (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2">
                    {fehler}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Sticky Footer — nur im Formular-Zustand */}
          {!zeigeErfolg && vorlagen.length > 0 && (
            <div
              className="flex-shrink-0 border-t border-stone-100 dark:border-white/5 px-5 pt-4 flex gap-2"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={() => setDialogOffen(false)}
                disabled={laden}
                className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Abbrechen
              </button>
              <button
                onClick={senden}
                disabled={!kannSenden}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {laden ? <ShiftslotLoader size="sm" label="Sendet…" /> : "✉ Senden"}
              </button>
            </div>
          )}
        </BaseDialog>
      )}
    </>
  )
}
