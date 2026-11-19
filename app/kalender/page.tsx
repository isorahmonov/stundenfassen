"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { addDays, addMonths, endOfMonth, format, getDay, isSameMonth, parseISO, startOfISOWeek, startOfMonth } from "date-fns"
import { de } from "date-fns/locale"
import { employers as employersRepo, shifts as shiftsRepo } from "@/lib/storage"
import { minutesSinceMidnight } from "@/lib/calc/time"
import { ueberlappungsSpalten, wochenstundenMinuten } from "@/lib/calendar/layout"
import { WERKSTUDENT_WOCHENSTUNDEN_ROT } from "@/lib/calc/warnings"
import { sortByFavoriten } from "@/lib/favorites"
import { useT } from "@/app/components/LangProvider"
import type { Employer, Shift } from "@/lib/types"

// ─── Konstanten ───────────────────────────────────────────────────────────────

const VIEW_START = 6 * 60    // 06:00
const VIEW_END = 22 * 60     // 22:00
const ROW_H = 56             // px per hour
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6..21
const GRID_H = 16 * ROW_H
const BERLIN = "Europe/Berlin"
const WOCHENSTUNDEN_GELB = 18
const WOCHENTAGE_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

type Ansicht = "tag" | "3t" | "woche" | "monat" | "liste"

const VIEWS: { key: Ansicht; labelKey: "KAL_TAG" | "KAL_DREI_TAGE" | "KAL_WOCHE" | "KAL_MONAT" | "KAL_LISTE" }[] = [
  { key: "tag", labelKey: "KAL_TAG" },
  { key: "3t", labelKey: "KAL_DREI_TAGE" },
  { key: "woche", labelKey: "KAL_WOCHE" },
  { key: "monat", labelKey: "KAL_MONAT" },
  { key: "liste", labelKey: "KAL_LISTE" },
]

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function berlinHeuteISO(): string {
  return new Date().toLocaleDateString("sv", { timeZone: BERLIN })
}

function berlinNowMin(): number {
  const dtf = new Intl.DateTimeFormat("de-DE", { timeZone: BERLIN, hour: "2-digit", minute: "2-digit", hour12: false })
  const [h, m] = dtf.format(new Date()).split(":").map(Number)
  return (h % 24) * 60 + m
}

function minToY(min: number): number {
  return ((min - VIEW_START) / 60) * ROW_H
}

function wocheMontagStr(iso: string): string {
  return format(startOfISOWeek(parseISO(iso)), "yyyy-MM-dd")
}

function tageVonAnsicht(base: string, ansicht: Ansicht): string[] {
  const d = parseISO(base)
  if (ansicht === "tag") return [base]
  if (ansicht === "3t") return [0, 1, 2].map(n => format(addDays(d, n), "yyyy-MM-dd"))
  if (ansicht === "woche") {
    const mo = startOfISOWeek(d)
    return Array.from({ length: 7 }, (_, i) => format(addDays(mo, i), "yyyy-MM-dd"))
  }
  return []
}

// ─── Schicht-Block ────────────────────────────────────────────────────────────

function SchichtBlock({
  shift,
  employer,
  spalte,
  spaltenanzahl,
}: {
  shift: Shift
  employer: Employer | undefined
  spalte: number
  spaltenanzahl: number
}) {
  const startMin = minutesSinceMidnight(shift.start)
  let endMin = minutesSinceMidnight(shift.ende)
  if (endMin <= startMin) endMin += 24 * 60
  const topY = minToY(Math.max(startMin, VIEW_START))
  const bottomY = minToY(Math.min(endMin, VIEW_END))
  const h = Math.max(bottomY - topY, 20)
  const farbe = employer?.farbe ?? "#6b7280"

  return (
    <div
      className="absolute overflow-hidden rounded px-1 py-0.5"
      style={{
        top: topY,
        height: h,
        left: `${(spalte / spaltenanzahl) * 100}%`,
        width: `${100 / spaltenanzahl}%`,
        backgroundColor: farbe + "33",
        borderLeft: `3px solid ${farbe}`,
      }}
      title={`${employer?.name ?? ""} ${shift.start}–${shift.ende}`}
    >
      {h >= 28 && (
        <span className="text-[10px] font-semibold leading-tight block" style={{ color: farbe }}>
          {employer?.name ?? "–"}
        </span>
      )}
      {h >= 44 && (
        <span className="text-[10px] leading-tight block text-stone-500 dark:text-neutral-400">
          {shift.start}–{shift.ende}
        </span>
      )}
    </div>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function KalenderPage() {
  const t = useT()
  const heute = berlinHeuteISO()
  const [ansicht, setAnsicht] = useState<Ansicht>("woche")
  const [base, setBase] = useState(heute)
  const [employers, setEmployers] = useState<Employer[]>([])
  const [schichten, setSchichten] = useState<Shift[]>([])
  const [filteredEmpIds, setFilteredEmpIds] = useState<string[] | null>(null)
  const [nowMin, setNowMin] = useState(berlinNowMin)
  const [laedt, setLaedt] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)

  // Data loading
  const ladenZeitgitter = useCallback(async (von: string, bis: string) => {
    setLaedt(true)
    try {
      const [emps, shiftList] = await Promise.all([
        employersRepo.findAlle(),
        shiftsRepo.findByDatumsbereich(von, bis),
      ])
      setEmployers(sortByFavoriten(emps.filter(e => !e.archiviert)))
      setSchichten(shiftList)
    } finally {
      setLaedt(false)
    }
  }, [])

  useEffect(() => {
    if (ansicht === "liste") {
      const bis = format(addDays(parseISO(heute), 90), "yyyy-MM-dd")
      ladenZeitgitter(heute, bis)
      return
    }
    if (ansicht === "monat") {
      const first = startOfMonth(parseISO(base))
      const last = endOfMonth(parseISO(base))
      ladenZeitgitter(format(first, "yyyy-MM-dd"), format(last, "yyyy-MM-dd"))
      return
    }
    const tage = tageVonAnsicht(base, ansicht)
    if (tage.length > 0) ladenZeitgitter(tage[0], tage[tage.length - 1])
  }, [base, ansicht]) // eslint-disable-line react-hooks/exhaustive-deps

  // Now-line management
  useEffect(() => {
    function startInterval() {
      intervalRef.current = setInterval(() => setNowMin(berlinNowMin()), 60_000)
    }
    function stopInterval() {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    startInterval()
    function onVisibility() {
      if (document.hidden) {
        stopInterval()
      } else {
        setNowMin(berlinNowMin())
        startInterval()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => { stopInterval(); document.removeEventListener("visibilitychange", onVisibility) }
  }, [])

  // Auto-scroll ~1h before now on mount
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: Math.max(0, minToY(nowMin - 60)), behavior: "instant" })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered shifts
  const sichtbareSchichten = filteredEmpIds
    ? schichten.filter(s => filteredEmpIds.includes(s.employerId))
    : schichten

  // Week-hours bar
  const montagStr = wocheMontagStr(base)
  const wocheMin = wochenstundenMinuten(sichtbareSchichten, montagStr)
  const barBreite = Math.min(100, (wocheMin / (WERKSTUDENT_WOCHENSTUNDEN_ROT * 60)) * 100)
  const barFarbe = wocheMin > WERKSTUDENT_WOCHENSTUNDEN_ROT * 60
    ? "bg-red-500"
    : wocheMin > WOCHENSTUNDEN_GELB * 60
      ? "bg-amber-400"
      : "bg-green-500"

  // Now-line Y position
  const nowY = nowMin >= VIEW_START && nowMin <= VIEW_END ? minToY(nowMin) : null
  const nowTimeStr = `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`

  function navigate(delta: number) {
    if (ansicht === "monat") {
      setBase(format(addMonths(parseISO(base), delta), "yyyy-MM-dd"))
      return
    }
    const step = (ansicht === "tag" ? 1 : ansicht === "3t" ? 3 : 7) * delta
    setBase(format(addDays(parseISO(ansicht === "woche" ? wocheMontagStr(base) : base), step), "yyyy-MM-dd"))
  }

  function toggleEmpFilter(id: string) {
    setFilteredEmpIds(prev => {
      if (prev === null) return [id]
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      return next.length === 0 ? null : next
    })
  }

  // ─── Bottom Sheet Drag ────────────────────────────────────────────────────

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
  }
  function onSheetTouchMove(e: React.TouchEvent) {
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current)
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`
  }
  function onSheetTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - dragStartY.current
    if (sheetRef.current) sheetRef.current.style.transform = ""
    if (delta > 80) setSelectedDay(null)
  }

  // ─── Monats-Ansicht ───────────────────────────────────────────────────────

  function renderMonat() {
    const monthDate = parseISO(base)
    const monthStart = startOfMonth(monthDate)
    const isoOffset = (getDay(monthStart) + 6) % 7  // Mon=0, Sun=6
    const gridStart = addDays(monthStart, -isoOffset)
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

    return (
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {/* Weekday header */}
        <div className="grid grid-cols-7 mb-1">
          {WOCHENTAGE_DE.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-stone-400 dark:text-neutral-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells — 6 rows × 7 */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const cellStr = format(cell, "yyyy-MM-dd")
            const inMonth = isSameMonth(cell, monthDate)
            const isHeute = cellStr === heute
            const tagSchichten = sichtbareSchichten.filter(s => s.datum === cellStr)

            // Unique employer colors for dots (up to 3)
            const empIds = [...new Set(tagSchichten.map(s => s.employerId))].slice(0, 3)
            const dots = empIds.map(id => employers.find(e => e.id === id)?.farbe ?? "#6b7280")

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!inMonth) setBase(cellStr)
                  setSelectedDay(cellStr)
                }}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-colors active:bg-stone-100 dark:active:bg-neutral-800 ${
                  selectedDay === cellStr ? "bg-stone-100 dark:bg-neutral-800" : ""
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isHeute
                      ? "bg-blue-600 text-white"
                      : inMonth
                        ? "text-stone-800 dark:text-neutral-100"
                        : "text-stone-300 dark:text-neutral-600"
                  }`}
                >
                  {format(cell, "d")}
                </span>
                <div className="flex gap-0.5 mt-1 h-1.5">
                  {dots.map((farbe, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: inMonth ? farbe : "transparent" }}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Zeit-Gitter ──────────────────────────────────────────────────────────

  function renderZeitgitter() {
    const tage = tageVonAnsicht(base, ansicht)
    const tagDaten = tage.map(day => {
      const tagSchichten = sichtbareSchichten
        .filter(s => s.datum === day)
        .sort((a, b) => minutesSinceMidnight(a.start) - minutesSinceMidnight(b.start))
      const events = tagSchichten.map(s => {
        const startMin = minutesSinceMidnight(s.start)
        let endMin = minutesSinceMidnight(s.ende)
        if (endMin <= startMin) endMin += 24 * 60
        return { startMin, endMin }
      })
      const lanes = ueberlappungsSpalten(events)
      return { day, tagSchichten, lanes }
    })

    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {/* Day headers */}
        <div className="sticky top-0 z-20 flex bg-white dark:bg-neutral-900 border-b border-stone-100 dark:border-neutral-800">
          <div className="w-11 flex-shrink-0" />
          {tage.map(day => {
            const isHeute = day === heute
            const d = parseISO(day)
            return (
              <div key={day} className="flex-1 flex flex-col items-center py-1 text-xs">
                <span className="text-stone-400 dark:text-neutral-500 uppercase text-[10px]">
                  {format(d, "EEE", { locale: de }).slice(0, 2)}
                </span>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-semibold mt-0.5 ${
                  isHeute
                    ? "bg-blue-600 text-white"
                    : "text-stone-700 dark:text-neutral-200"
                }`}>
                  {format(d, "d")}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="relative flex" style={{ height: GRID_H }}>
          {/* Hour labels */}
          <div className="w-11 flex-shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-stone-400 dark:text-neutral-500 leading-none"
                style={{ top: (h - 6) * ROW_H - 6 }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 relative flex">
            {/* Horizontal hour lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-stone-100 dark:border-neutral-800"
                  style={{ top: (h - 6) * ROW_H }}
                />
              ))}
            </div>

            {/* Per-day content */}
            {tagDaten.map(({ day, tagSchichten: ts, lanes }) => {
              const isHeute = day === heute
              return (
                <div
                  key={day}
                  className={`flex-1 relative border-l border-stone-100 dark:border-neutral-800 ${
                    isHeute ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {ts.map((shift, i) => (
                    <SchichtBlock
                      key={shift.id}
                      shift={shift}
                      employer={employers.find(e => e.id === shift.employerId)}
                      spalte={lanes[i].spalte}
                      spaltenanzahl={lanes[i].spaltenanzahl}
                    />
                  ))}

                  {/* Now-line on today column */}
                  {isHeute && nowY !== null && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: nowY }}
                    >
                      <div className="relative">
                        <div className="h-px bg-red-500" />
                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-red-500 bg-white dark:bg-neutral-900 px-0.5 whitespace-nowrap leading-none">
                          {t("KAL_JETZT")} {nowTimeStr}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── Liste-Ansicht ────────────────────────────────────────────────────────

  function renderListe() {
    const heute_ = berlinHeuteISO()
    const sortiert = sichtbareSchichten
      .filter(s => s.datum >= heute_)
      .sort((a, b) => a.datum.localeCompare(b.datum) || a.start.localeCompare(b.start))

    if (sortiert.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-400 dark:text-neutral-500 text-sm">–</p>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sortiert.map(s => {
          const emp = employers.find(e => e.id === s.employerId)
          const farbe = emp?.farbe ?? "#6b7280"
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-neutral-800 px-3 py-2.5"
              style={{ borderLeft: `4px solid ${farbe}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-800 dark:text-neutral-100 truncate">
                  {emp?.name ?? "–"}
                </div>
                <div className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
                  {format(parseISO(s.datum), "EEE dd.MM.yyyy", { locale: de })} · {s.start}–{s.ende}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const rangeLabel = ansicht === "monat"
    ? format(parseISO(base), "MMMM yyyy", { locale: de })
    : ansicht === "woche"
      ? (() => {
          const mo = parseISO(wocheMontagStr(base))
          return `${format(mo, "d.M.")} – ${format(addDays(mo, 6), "d.M.yyyy")}`
        })()
      : ansicht === "3t"
        ? `${format(parseISO(base), "d.M.")} – ${format(addDays(parseISO(base), 2), "d.M.yyyy")}`
        : format(parseISO(base), "EEEE, d. MMMM", { locale: de })

  // Shifts for the detail bottom sheet
  const selectedDaySchichten = selectedDay
    ? sichtbareSchichten
        .filter(s => s.datum === selectedDay)
        .sort((a, b) => a.start.localeCompare(b.start))
    : []

  return (
    <div className="flex flex-col h-dvh" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 56px)" }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold sf-text">Kalender</h1>
          <button
            onClick={() => {
              setBase(heute)
              setTimeout(() => scrollRef.current?.scrollTo({ top: Math.max(0, minToY(berlinNowMin() - 60)), behavior: "smooth" }), 50)
            }}
            className="text-sm font-medium text-blue-600 dark:text-blue-400"
          >
            {t("KAL_HEUTE")}
          </button>
        </div>

        {/* Segment switcher */}
        <div className="flex rounded-xl bg-stone-100 dark:bg-neutral-800 p-0.5 mb-3">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setAnsicht(v.key)}
              className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-colors ${
                ansicht === v.key
                  ? "bg-white dark:bg-neutral-700 text-stone-900 dark:text-white shadow-sm"
                  : "text-stone-500 dark:text-neutral-400"
              }`}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>

        {/* Navigation row */}
        {ansicht !== "liste" && (
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 text-stone-400 dark:text-neutral-500"
              aria-label="Zurück"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M13 4l-6 6 6 6"/>
              </svg>
            </button>
            <span className="text-xs font-medium text-stone-600 dark:text-neutral-300">{rangeLabel}</span>
            <button
              onClick={() => navigate(1)}
              className="p-1 text-stone-400 dark:text-neutral-500"
              aria-label="Vor"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M7 4l6 6-6 6"/>
              </svg>
            </button>
          </div>
        )}

        {/* Employer chips */}
        {employers.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-1">
            <button
              onClick={() => setFilteredEmpIds(null)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filteredEmpIds === null
                  ? "bg-stone-800 dark:bg-neutral-100 text-white dark:text-stone-900"
                  : "bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"
              }`}
            >
              Alle
            </button>
            {employers.map(e => {
              const aktiv = filteredEmpIds === null || filteredEmpIds.includes(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() => toggleEmpFilter(e.id)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity ${aktiv ? "" : "opacity-40"}`}
                  style={{ backgroundColor: e.farbe + "22", color: e.farbe }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.farbe }} />
                  {e.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Week-hours bar */}
        {ansicht === "woche" && (
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] text-stone-400 dark:text-neutral-500 mb-1">
              <span>{t("KAL_WOCHENSTUNDEN_LABEL")}</span>
              <span>{(wocheMin / 60).toFixed(1).replace(".", ",")} / {WERKSTUDENT_WOCHENSTUNDEN_ROT} h</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-neutral-800 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barFarbe}`} style={{ width: `${barBreite}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      {laedt ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-stone-200 dark:border-neutral-700 border-t-blue-600 animate-spin" />
        </div>
      ) : ansicht === "monat" ? (
        renderMonat()
      ) : ansicht === "liste" ? (
        renderListe()
      ) : (
        renderZeitgitter()
      )}

      {/* Detail bottom sheet */}
      {selectedDay !== null && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setSelectedDay(null)}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col transition-none"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* Griffleiste */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="px-5 pt-1 pb-3 flex-shrink-0 border-b border-stone-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold sf-text capitalize">
                {format(parseISO(selectedDay), "EEEE, d. MMMM yyyy", { locale: de })}
              </h3>
            </div>

            {/* Shifts */}
            <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2">
              {selectedDaySchichten.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-neutral-500 text-center py-6">–</p>
              ) : (
                selectedDaySchichten.map(s => {
                  const emp = employers.find(e => e.id === s.employerId)
                  const farbe = emp?.farbe ?? "#6b7280"
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: farbe + "18", borderLeft: `3px solid ${farbe}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: farbe }}>
                          {emp?.name ?? "–"}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
                          {s.start}–{s.ende}
                          {s.pauseVon && s.pauseBis && (
                            <span className="ml-2 text-stone-400 dark:text-neutral-500">
                              Pause {s.pauseVon}–{s.pauseBis}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
