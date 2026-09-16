"use client"

import { useEffect, useRef, useState } from "react"
import { employers as employersRepo, shifts as shiftsRepo } from "@/lib/storage"
import type { Employer, Shift } from "@/lib/types"

// ─── Konstanten ───────────────────────────────────────────────────────────────

const FARBEN = ["#21262d", "#0e4429", "#006d32", "#26a641", "#39d353"] as const
const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]
const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
const BERLIN = "Europe/Berlin"

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function schichtDauerMin(start: string, ende: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = ende.split(":").map(Number)
  const d = eh * 60 + em - (sh * 60 + sm)
  return d < 0 ? d + 1440 : d
}

function aggregiereNachTag(schichten: Shift[], agId: string | null): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of schichten) {
    if (agId && s.employerId !== agId) continue
    map.set(s.datum, (map.get(s.datum) ?? 0) + schichtDauerMin(s.start, s.ende))
  }
  return map
}

function quintilBreaks(tagesMap: Map<string, number>): [number, number, number] {
  const werte = [...tagesMap.values()].filter((v) => v > 0).sort((a, b) => a - b)
  if (werte.length < 3) return [60, 240, 420]  // Fallback bei wenig Daten
  const q = (p: number) => werte[Math.max(0, Math.min(Math.floor(werte.length * p), werte.length - 1))]
  return [q(0.33), q(0.66), q(0.90)]
}

function berechneStufe(min: number, breaks: [number, number, number]): 0 | 1 | 2 | 3 | 4 {
  if (min === 0) return 0
  if (min <= breaks[0]) return 1
  if (min <= breaks[1]) return 2
  if (min <= breaks[2]) return 3
  return 4
}

function kalenderTage(monat: number, jahr: number): (string | null)[] {
  const erster = new Date(jahr, monat - 1, 1)
  const startSpalte = (erster.getDay() + 6) % 7  // Mo=0, So=6
  const letzter = new Date(jahr, monat, 0).getDate()
  const tage: (string | null)[] = Array(startSpalte).fill(null)
  for (let d = 1; d <= letzter; d++) {
    tage.push(`${jahr}-${String(monat).padStart(2, "0")}-${String(d).padStart(2, "0")}`)
  }
  while (tage.length % 7 !== 0) tage.push(null)
  return tage
}

function heuteISO(): string {
  return new Date().toLocaleDateString("sv", { timeZone: BERLIN })
}

function formatMin(min: number): string {
  return (min / 60).toFixed(1).replace(".", ",") + " Std."
}

function datumLang(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long",
  })
}

function datumKurz(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "short",
  })
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function StatistikPage() {
  const heute = new Date()
  const [monat, setMonat] = useState(heute.getMonth() + 1)
  const [jahr, setJahr] = useState(heute.getFullYear())
  const [alleSchichten, setAlleSchichten] = useState<Shift[]>([])
  const [arbeitgeber, setArbeitgeber] = useState<Employer[]>([])
  const [selectedAgId, setSelectedAgId] = useState<string | null>(null)
  const [selectedDatum, setSelectedDatum] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    Promise.all([shiftsRepo.findAlle(), employersRepo.findAktive()])
      .then(([s, e]) => { setAlleSchichten(s); setArbeitgeber(e) })
      .catch(() => {})
  }, [])

  // ── Quintile aus 12-Monats-Fenster ─────────────────────────────────────────

  const iso12MonateVor = (() => {
    const d = new Date(heute)
    d.setMonth(d.getMonth() - 12)
    return d.toLocaleDateString("sv", { timeZone: BERLIN })
  })()
  const schichten12m = alleSchichten.filter((s) => s.datum >= iso12MonateVor)
  const tagesMap12m = aggregiereNachTag(schichten12m, selectedAgId)
  const breaks = quintilBreaks(tagesMap12m)

  // ── Monatsdaten ────────────────────────────────────────────────────────────

  const monatPrefix = `${jahr}-${String(monat).padStart(2, "0")}`
  const monatSchichten = alleSchichten.filter((s) => s.datum.startsWith(monatPrefix))
  const tagesMapMonat = aggregiereNachTag(monatSchichten, selectedAgId)
  const tage = kalenderTage(monat, jahr)
  const heute_iso = heuteISO()

  // Monatssumme + stärkster Tag
  const gesamtMin = [...tagesMapMonat.values()].reduce((a, b) => a + b, 0)
  const stärksterTag = [...tagesMapMonat.entries()].reduce<{ datum: string; min: number } | null>(
    (best, [d, m]) => (!best || m > best.min ? { datum: d, min: m } : best),
    null,
  )

  // ── Navigation ─────────────────────────────────────────────────────────────

  function prevMonat() {
    setSelectedDatum(null)
    if (monat === 1) { setJahr((j) => j - 1); setMonat(12) }
    else setMonat((m) => m - 1)
  }
  function nextMonat() {
    setSelectedDatum(null)
    if (monat === 12) { setJahr((j) => j + 1); setMonat(1) }
    else setMonat((m) => m + 1)
  }

  // ── Swipe ──────────────────────────────────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) { delta < 0 ? nextMonat() : prevMonat() }
    touchStartX.current = null
  }

  // ── Tooltip-Daten ──────────────────────────────────────────────────────────

  const agMap = new Map(arbeitgeber.map((a) => [a.id, a]))

  const tooltipZeilen = (() => {
    if (!selectedDatum) return []
    const tagSchichten = alleSchichten.filter(
      (s) => s.datum === selectedDatum && (!selectedAgId || s.employerId === selectedAgId),
    )
    const map = new Map<string, number>()
    for (const s of tagSchichten) {
      map.set(s.employerId, (map.get(s.employerId) ?? 0) + schichtDauerMin(s.start, s.ende))
    }
    return [...map.entries()]
      .map(([id, min]) => ({ ag: agMap.get(id), min }))
      .sort((a, b) => b.min - a.min)
  })()

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen sf-page">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-28">

        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonat}
            className="w-11 h-11 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Vormonat"
          >‹</button>
          <h1 className="text-base font-semibold sf-text">{MONATE[monat - 1]} {jahr}</h1>
          <button
            onClick={nextMonat}
            className="w-11 h-11 flex items-center justify-center rounded-full text-xl text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Nächster Monat"
          >›</button>
        </header>

        {/* Filter */}
        {arbeitgeber.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            <FilterPill label="Alle" aktiv={selectedAgId === null} farbe="#a8a29e" onClick={() => { setSelectedAgId(null); setSelectedDatum(null) }} />
            {arbeitgeber.map((ag) => (
              <FilterPill key={ag.id} label={ag.name} aktiv={selectedAgId === ag.id} farbe={ag.farbe} onClick={() => { setSelectedAgId(ag.id); setSelectedDatum(null) }} />
            ))}
          </div>
        )}

        {/* Heatmap */}
        <div
          className="rounded-2xl overflow-hidden select-none"
          style={{ backgroundColor: "#0d1117" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="p-3">
            {/* Wochentag-Köpfe */}
            <div className="grid grid-cols-7 mb-1.5">
              {WOCHENTAGE.map((t) => (
                <div key={t} className="text-center text-[11px] font-medium py-1" style={{ color: "#7d8590" }}>
                  {t}
                </div>
              ))}
            </div>

            {/* Kalender-Zellen */}
            <div className="grid grid-cols-7 gap-1">
              {tage.map((datum, i) => {
                if (!datum) {
                  return <div key={`leer-${i}`} className="aspect-square" />
                }
                const min = tagesMapMonat.get(datum) ?? 0
                const stufe = berechneStufe(min, breaks)
                const istHeute = datum === heute_iso
                const istGewaehlt = datum === selectedDatum
                const tag = parseInt(datum.slice(8), 10)
                return (
                  <button
                    key={datum}
                    onClick={() => setSelectedDatum((d) => (d === datum ? null : datum))}
                    className="aspect-square rounded-[5px] flex items-start justify-start p-1 transition-all active:scale-[0.88]"
                    style={{
                      backgroundColor: FARBEN[stufe],
                      outline: istGewaehlt
                        ? "2px solid #58a6ff"
                        : istHeute
                        ? "1px solid #444c56"
                        : "none",
                      outlineOffset: "1px",
                    }}
                    aria-label={`${datum}, ${min > 0 ? formatMin(min) : "kein Eintrag"}`}
                  >
                    <span
                      className="text-[10px] leading-none font-medium"
                      style={{ color: stufe === 0 ? "#484f58" : "#cdd9e5" }}
                    >
                      {tag}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legende */}
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="text-[10px]" style={{ color: "#7d8590" }}>Weniger</span>
              {FARBEN.map((f, i) => (
                <div key={i} className="w-[11px] h-[11px] rounded-[3px]" style={{ backgroundColor: f }} />
              ))}
              <span className="text-[10px]" style={{ color: "#7d8590" }}>Mehr</span>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {selectedDatum && (
          <div className="mt-3 sf-card rounded-2xl p-4 shadow-sm animate-in fade-in duration-150">
            <p className="text-xs font-semibold sf-text-2 uppercase tracking-wide mb-3">
              {datumLang(selectedDatum)}
            </p>
            {tooltipZeilen.length === 0 ? (
              <p className="text-sm sf-text-2">Kein Eintrag</p>
            ) : (
              <>
                {tooltipZeilen.map(({ ag, min }) => (
                  <div key={ag?.id ?? "?"} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ag?.farbe ?? "#a8a29e" }}
                    />
                    <span className="flex-1 text-sm sf-text">{ag?.name ?? "Unbekannt"}</span>
                    <span className="text-sm font-semibold nums sf-text">{formatMin(min)}</span>
                  </div>
                ))}
                {tooltipZeilen.length > 1 && (
                  <div className="flex justify-between pt-2 mt-2 border-t border-stone-100 dark:border-white/5">
                    <span className="text-xs sf-text-3">Gesamt</span>
                    <span className="text-sm font-bold nums sf-text">
                      {formatMin(tooltipZeilen.reduce((s, z) => s + z.min, 0))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Monatssumme */}
        {gesamtMin > 0 ? (
          <div className="mt-3 sf-card rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs sf-text-3 mb-0.5">Monat gesamt</p>
              <p className="text-2xl font-bold nums sf-text">{formatMin(gesamtMin)}</p>
            </div>
            {stärksterTag && (
              <div className="text-right">
                <p className="text-xs sf-text-3 mb-0.5">Stärkster Tag</p>
                <p className="text-sm font-semibold sf-text">{datumKurz(stärksterTag.datum)}</p>
                <p className="text-xs sf-text-2 nums">{formatMin(stärksterTag.min)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 sf-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm sf-text-2">Keine Schichten in diesem Monat.</p>
          </div>
        )}

      </div>
    </main>
  )
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({ label, aktiv, farbe, onClick }: {
  label: string; aktiv: boolean; farbe: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95"
      style={{
        backgroundColor: aktiv ? farbe : "transparent",
        borderColor: aktiv ? farbe : "#d6d3d1",
        color: aktiv ? "#fff" : "#78716c",
      }}
    >
      {label}
    </button>
  )
}
