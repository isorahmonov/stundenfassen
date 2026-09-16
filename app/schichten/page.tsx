"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { uid } from "@/lib/storage/firestore/shared"
import {
  employers as employersRepo,
  shifts as shiftsRepo,
  geplanteSchichten as geplanteRepo,
} from "@/lib/storage"
import type { Employer, GeplanteSchicht } from "@/lib/types"
import { aktuellerSonntagStr, toISODatum, wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"

const KW_ANKER = "2026-02-01"
const BERLIN = "Europe/Berlin"

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function formatDauerMin(min: number): string {
  return (min / 60).toFixed(1).replace(".", ",") + " Std."
}

function datumKurz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 12).toLocaleDateString("de-DE", {
    timeZone: BERLIN,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

function schichtDauerMin(start: string, ende: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = ende.split(":").map(Number)
  const min = (eh * 60 + em) - (sh * 60 + sm)
  return min < 0 ? min + 1440 : min
}

function heuteISO(): string {
  return new Date().toLocaleDateString("sv", { timeZone: BERLIN })
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function SchichtenPage() {
  const [startSonntagStr, setStartSonntagStr] = useState(aktuellerSonntagStr)
  const [arbeitgeber, setArbeitgeber] = useState<Employer[]>([])
  const [alleGeplante, setAlleGeplante] = useState<GeplanteSchicht[]>([])
  const [archivMinuten, setArchivMinuten] = useState<number | null>(null)
  const [neuOffen, setNeuOffen] = useState(false)
  const [fehler, setFehler] = useState("")
  const [version, setVersion] = useState(0)

  // Wochenstruktur (So–Sa)
  const woche = wochenDaten(startSonntagStr, 1)[0]
  const vonStr = woche[0]
  const bisStr = woche[6]
  const moStr  = woche[1]
  const wochenLabel = `KW ${tkWoche(startSonntagStr, KW_ANKER)} · ${datumKurz(moStr)} – ${datumKurz(bisStr)}`

  const wochenGeplante = alleGeplante
    .filter((s) => s.datum >= vonStr && s.datum <= bisStr)
    .sort((a, b) => a.datum.localeCompare(b.datum) || a.start.localeCompare(b.start))

  const eingeteiltMin = wochenGeplante.reduce(
    (sum, s) => sum + schichtDauerMin(s.start, s.ende), 0,
  )

  const agMap = new Map(arbeitgeber.map((e) => [e.id, e]))

  // ── Laden ──────────────────────────────────────────────────────────────────

  useEffect(() => { laden() }, [version])

  async function laden() {
    try {
      const [emps, alle] = await Promise.all([
        employersRepo.findAktive(),
        geplanteRepo.findAlle(),
      ])
      setArbeitgeber(emps)
      setAlleGeplante(alle)
    } catch (e) { setFehler(String(e)) }
  }

  useEffect(() => { ladeArchivMinuten() }, [startSonntagStr])

  async function ladeArchivMinuten() {
    try {
      const kw = tkWoche(startSonntagStr, KW_ANKER)
      const snap = await getDocs(
        query(collection(db, "users", uid(), "verfuegbarkeit_archiv"), orderBy("erstelltAm", "desc")),
      )
      const eintrag = snap.docs
        .map((d) => d.data())
        .find((d) => (d.kalenderwochen as number[]).includes(kw))
      setArchivMinuten(eintrag ? (eintrag.gesamtMinuten as number) : null)
    } catch {
      setArchivMinuten(null)
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function prevWoche() {
    const d = new Date(startSonntagStr + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() - 7)
    setStartSonntagStr(toISODatum(d))
  }

  function nextWoche() {
    const d = new Date(startSonntagStr + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + 7)
    setStartSonntagStr(toISODatum(d))
  }

  // ── Aktionen ───────────────────────────────────────────────────────────────

  async function hinzufuegen(data: {
    employerId: string; datum: string; start: string; ende: string
  }) {
    try {
      await geplanteRepo.add({ ...data, uebernommen: false })
      setNeuOffen(false)
      setVersion((v) => v + 1)
    } catch (e) { setFehler(String(e)) }
  }

  async function uebernehmen(s: GeplanteSchicht) {
    try {
      const newShift = await shiftsRepo.add({
        employerId: s.employerId,
        datum: s.datum,
        start: s.start,
        ende: s.ende,
      })
      await geplanteRepo.update(s.id, {
        uebernommen: true,
        uebernommenShiftId: newShift.id,
      })
      setVersion((v) => v + 1)
    } catch (e) { setFehler(String(e)) }
  }

  async function loeschen(id: string) {
    try {
      await geplanteRepo.remove(id)
      setVersion((v) => v + 1)
    } catch (e) { setFehler(String(e)) }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-28">

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={prevWoche}
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Vorherige Woche"
          >‹</button>
          <h1 className="text-sm font-semibold sf-text text-center">{wochenLabel}</h1>
          <button
            onClick={nextWoche}
            className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Nächste Woche"
          >›</button>
        </header>

        {/* Fehler */}
        {fehler && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">{fehler}</p>
          </div>
        )}

        {/* Wochenübersicht */}
        <div className="sf-card rounded-2xl p-4 shadow-sm mb-4 flex gap-8">
          <div>
            <p className="text-xs sf-text-3 mb-0.5">Eingeteilt</p>
            <p className="text-xl font-semibold nums sf-text">{formatDauerMin(eingeteiltMin)}</p>
          </div>
          {archivMinuten !== null && (
            <div>
              <p className="text-xs sf-text-3 mb-0.5">Angeboten (letztes PDF)</p>
              <p className="text-xl font-semibold nums sf-text">{formatDauerMin(archivMinuten)}</p>
            </div>
          )}
        </div>

        {/* Neue Schicht */}
        <div className="mb-4">
          {neuOffen ? (
            <div className="sf-card rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <p className="text-sm font-semibold sf-text mb-4">Neue Schicht eintragen</p>
                <NeueSchichtFormular
                  arbeitgeber={arbeitgeber}
                  onSpeichern={(d) => hinzufuegen(d).catch((e) => setFehler(String(e)))}
                  onAbbrechen={() => setNeuOffen(false)}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNeuOffen(true)}
              className="w-full sf-card rounded-2xl p-3 shadow-sm flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-stone-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <span className="text-xl font-light leading-none">+</span>
              Neue Schicht eintragen
            </button>
          )}
        </div>

        {/* Schichtenliste */}
        <div className="space-y-2">
          {wochenGeplante.length === 0 ? (
            <div className="sf-card rounded-2xl p-8 text-center shadow-sm">
              <p className="text-sm sf-text-2">Keine Schichten diese Woche.</p>
              <button
                onClick={() => setNeuOffen(true)}
                className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Erste eintragen →
              </button>
            </div>
          ) : (
            wochenGeplante.map((s) => {
              const ag = agMap.get(s.employerId)
              const dauerMin = schichtDauerMin(s.start, s.ende)
              return (
                <div key={s.id} className="sf-card rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: ag?.farbe ?? "#a8a29e" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium sf-text">{ag?.name ?? "Unbekannt"}</p>
                      <p className="text-xs sf-text-2">{datumKurz(s.datum)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold nums sf-text">{s.start}–{s.ende}</p>
                      <p className="text-xs sf-text-3 nums">{formatDauerMin(dauerMin)}</p>
                    </div>
                  </div>

                  <div className="flex items-center pt-2 border-t border-stone-100 dark:border-white/5">
                    {s.uebernommen ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ In Stundenzettel übernommen
                      </span>
                    ) : (
                      <button
                        onClick={() => uebernehmen(s).catch((e) => setFehler(String(e)))}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        In Stundenzettel übernehmen →
                      </button>
                    )}
                    <span className="flex-1" />
                    <button
                      onClick={() => {
                        if (confirm(`Schicht am ${datumKurz(s.datum)} löschen?`))
                          loeschen(s.id).catch((e) => setFehler(String(e)))
                      }}
                      className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </main>
  )
}

// ─── NeueSchichtFormular ──────────────────────────────────────────────────────

function NeueSchichtFormular({
  arbeitgeber,
  onSpeichern,
  onAbbrechen,
}: {
  arbeitgeber: Employer[]
  onSpeichern: (d: { employerId: string; datum: string; start: string; ende: string }) => void
  onAbbrechen: () => void
}) {
  const [employerId, setEmployerId] = useState(arbeitgeber[0]?.id ?? "")
  const [datum, setDatum] = useState(heuteISO)
  const [start, setStart] = useState("")
  const [ende, setEnde] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!employerId || !datum || !start || !ende) return
    onSpeichern({ employerId, datum, start, ende })
  }

  const inputKlasse =
    "w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2 text-sm sf-text outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow"

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Arbeitgeber */}
      <div>
        <p className="text-xs sf-text-2 mb-1">Arbeitgeber</p>
        <select
          value={employerId}
          onChange={(e) => setEmployerId(e.target.value)}
          required
          className={inputKlasse}
        >
          {arbeitgeber.map((ag) => (
            <option key={ag.id} value={ag.id}>{ag.name}</option>
          ))}
        </select>
      </div>

      {/* Datum */}
      <div>
        <p className="text-xs sf-text-2 mb-1">Datum</p>
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          required
          className={inputKlasse}
        />
      </div>

      {/* Start / Ende */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs sf-text-2 mb-1">Start</p>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className={`${inputKlasse} nums`}
          />
        </div>
        <div>
          <p className="text-xs sf-text-2 mb-1">Ende</p>
          <input
            type="time"
            value={ende}
            onChange={(e) => setEnde(e.target.value)}
            required
            className={`${inputKlasse} nums`}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onAbbrechen}
          className="flex-1 rounded-xl border border-stone-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium sf-text-2 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 active:scale-95 transition-all"
        >
          Hinzufügen
        </button>
      </div>
    </form>
  )
}
