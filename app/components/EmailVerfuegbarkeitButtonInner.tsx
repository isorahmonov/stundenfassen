"use client"

import { useEffect, useRef, useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { VerfuegbarkeitPDF } from "./VerfuegbarkeitPDF"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { Bundesland, EmailVorlage } from "@/lib/types"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { minusEintraege as minusRepo, emailVorlagen as emailVorlageRepo, employers as employersRepo } from "@/lib/storage"
import { auth } from "@/lib/firebase/client"
import { wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"

export interface EmailVerfuegbarkeitProps {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  kwAnker: string
  onNachExport: () => Promise<void>
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
    // Klammern entfernen, z.B. "(Personalnummer {{personalnummer}})"
    text = text.replace(/\s*\([^()]*\{\{personalnummer\}\}[^()]*\)/g, "")
    // Ganze Zeile entfernen, z.B. "Personalnummer: {{personalnummer}}\n"
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
      {/* Animierter Haken-Kreis */}
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

      {/* Empfängerinfo */}
      <div className={`text-center space-y-1 transition-all duration-300 delay-200 ${sichtbar ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <p className="text-sm font-semibold sf-text">Gesendet!</p>
        <p className="text-xs sf-text-2">An: {an}</p>
        {cc && <p className="text-xs sf-text-2">CC: {cc}</p>}
      </div>

      {/* Schließen mit Countdown */}
      <button
        onClick={() => ref.current()}
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
  kwAnker,
  onNachExport,
}: EmailVerfuegbarkeitProps) {
  const [dialogOffen, setDialogOffen] = useState(false)
  const [laden, setLaden] = useState(false)
  const [empfaenger, setEmpfaenger] = useState("")
  const [cc, setCc] = useState("")
  const [vorlagen, setVorlagen] = useState<EmailVorlage[]>([])
  const [aktivVorlageId, setAktivVorlageId] = useState("")
  const [fehler, setFehler] = useState("")
  const [gesendeteAn, setGesendeteAn] = useState("")
  const [gesendeteCC, setGesendeteCC] = useState("")
  const [personalnummer, setPersonalnummer] = useState("")

  const mitarbeiterName = auth.currentUser?.displayName ?? auth.currentUser?.email ?? ""

  const wochen = wochenDaten(startSonntagStr, anzahlWochen)
  const vonDatum = formatDE(wochen[0][0])
  const bisDatum = formatDE(wochen[wochen.length - 1][6])

  const kwVon = tkWoche(startSonntagStr, kwAnker)
  const letzterSo = (() => {
    const d = new Date(startSonntagStr + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + (anzahlWochen - 1) * 7)
    return d.toISOString().slice(0, 10)
  })()
  const kwBis = tkWoche(letzterSo, kwAnker)
  const dateiname = anzahlWochen === 1
    ? `Verfuegbarkeit_KW${kwVon}.pdf`
    : `Verfuegbarkeit_KW${kwVon}-KW${kwBis}.pdf`

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

  async function oeffneDialog() {
    setFehler("")
    setGesendeteAn("")
    setGesendeteCC("")
    setEmpfaenger("")
    setCc("")
    const [vl, aktiveEmps] = await Promise.all([
      emailVorlageRepo.findAlle().catch(() => []),
      employersRepo.findAktive().catch(() => []),
    ])
    setVorlagen(vl)
    setPersonalnummer(aktiveEmps[0]?.personalnummer ?? "")
    const erste = vl[0]
    setAktivVorlageId(erste?.id ?? "")
    setEmpfaenger(erste?.empfaenger ?? "")
    setCc(erste?.cc ?? "")
    setDialogOffen(true)
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
          kwAnker={kwAnker}
          minusEintraege={alleMinus}
          mitarbeiterName={mitarbeiterName}
          personalnummer={personalnummer || undefined}
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

  return (
    <>
      <button
        onClick={oeffneDialog}
        disabled={ausgewaehlt.length === 0}
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-stone-600 dark:text-neutral-300 shadow-sm hover:bg-stone-50 dark:hover:bg-neutral-700 active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ✉ Per E-Mail
      </button>

      {dialogOffen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => !laden && !zeigeErfolg && setDialogOffen(false)}
          />
          <div className="relative w-full max-w-md sf-card rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Header — immer sichtbar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-0">
              <h2 className="text-sm font-semibold sf-text">Per E-Mail senden</h2>
              <button
                onClick={() => { if (!laden) { setDialogOffen(false); setGesendeteAn(""); setGesendeteCC("") } }}
                disabled={laden}
                className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-700 transition-colors text-sm"
              >✕</button>
            </div>

            {zeigeErfolg ? (
              <ErfolgView
                an={gesendeteAn}
                cc={gesendeteCC}
                onSchliessen={() => { setDialogOffen(false); setGesendeteAn(""); setGesendeteCC("") }}
              />
            ) : vorlagen.length === 0 ? (
              <div className="px-5 pb-5 pt-4">
                <p className="text-sm sf-text-2 text-center py-4">
                  Bitte zuerst eine Vorlage im{" "}
                  <a href="/profil" className="text-blue-600 dark:text-blue-400 underline">Profil-Tab</a>
                  {" "}anlegen.
                </p>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-4 space-y-4">

                {/* Vorlage (nur wenn mehrere) */}
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

                {/* An */}
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

                {/* CC */}
                <div>
                  <label className="block text-xs sf-text-2 mb-1">
                    CC <span className="text-stone-400 font-normal">optional, mehrere durch Komma</span>
                  </label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="kollege@example.de, chef@example.de"
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

                {/* Vorschau */}
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

                <div className="flex gap-2">
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
                    {laden ? "Sendet…" : "✉ Senden"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
