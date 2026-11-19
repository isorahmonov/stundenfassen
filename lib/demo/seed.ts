// Fiktive Demo-Daten für ein frisches Testkonto (Aufnahmen, manuelle Tests).
// Rein und ohne Laufzeit-Imports, damit scripts/seed-demo.ts es direkt mit
// `node` (Type-Stripping) laden kann. Alle sichtbaren Texte bewusst auf Englisch.

import type { Employer, Shift, FesteSperrzeit, VerfuegbarkeitsEinstellungenArbeitgeber } from "@/lib/types"
import type { EmployerDoc, ShiftDoc, SettingsDoc } from "@/lib/storage/firestore/shared"

export const SEED_VON = "2026-11-01"
export const SEED_BIS = "2027-02-28"
/** So–So, damit die Woche sowohl bei Wochenstart Montag als auch Sonntag leer ist */
export const LEERE_WOCHE = { von: "2026-12-13", bis: "2026-12-20" }
/** Bleibt frei für den manuellen Test „Schicht hinzufügen“ */
export const FREIER_TAG = "2027-01-15"
/** Minijob-Verdienstgrenze 2026 (603 €), 2027 liegt sie höher */
export const MINIJOB_GRENZE_CENT = 60300

export type SeedEmployer = Employer
export type SeedShift = Omit<Shift, "id">

// ─── Zeit-Helfer ──────────────────────────────────────────────────────────────

function zuMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function zuZeit(min: number): string {
  if (min < 0 || min >= 24 * 60) throw new Error(`Uhrzeit außerhalb des Tages: ${min}`)
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

/** "YYYY-MM-DD" + n Tage, rein in UTC gerechnet (keine Sommerzeit-Effekte) */
function plusTage(datum: string, tage: number): string {
  const d = new Date(`${datum}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + tage)
  return d.toISOString().slice(0, 10)
}

/**
 * Pause nach § 4 ArbZG für Demo-Schichten: über 6 h brutto 30 Minuten,
 * mittig in der Schicht, auf 5 Minuten gerundet. Bis 6 h keine Pause.
 */
export function pauseFuer(start: string, ende: string): { pauseVon: string; pauseBis: string } | null {
  const s = zuMin(start)
  const brutto = zuMin(ende) - s
  if (brutto <= 6 * 60) return null
  const von = Math.round((s + (brutto - 30) / 2) / 5) * 5
  return { pauseVon: zuZeit(von), pauseBis: zuZeit(von + 30) }
}

// ─── Arbeitgeber ──────────────────────────────────────────────────────────────

const NW = "seed-northwind"
const BB = "seed-brightside"
const HO = "seed-harbor"

const SPERRZEITEN: FesteSperrzeit[] = [
  { wochentag: 2, von: "09:00", bis: "11:00", bezeichnung: "Language course" },
  { wochentag: 5, von: "12:00", bis: "14:00", bezeichnung: "Food bank volunteering" },
]

function verfuegbarkeit(wochentage: number[], fruehestens: string, spaetestens: string): VerfuegbarkeitsEinstellungenArbeitgeber {
  return {
    wochentage,
    fruehestens,
    spaetestens,
    mindestdauerMin: 120,
    rundungMin: 15,
    pufferStandardMin: 15,
    wochenStart: "montag",
    kwSystem: "iso",
    pdf: { deinName: "Alex Morgan", fusszeilenText: "Availability may change during exam weeks." },
    pufferOrte: [{ suchtext: "Stanbridge", vorMin: 30, nachMin: 30 }],
    festeSperrzeiten: SPERRZEITEN,
    einrichtungBestaetigt: true,
  }
}

export function seedEmployers(): SeedEmployer[] {
  return [
    {
      id: NW, name: "Northwind Bistro", farbe: "#f97316", art: "werkstudent", bundesland: "HH",
      stundenlohnCent: 1550, zuschlagSonntagProzent: 50, zuschlagFeiertagProzent: 125, zuschlagNachtProzent: 25,
      archiviert: false, minusImPDFAnzeigen: true, favorit: true,
      verfuegbarkeit: verfuegbarkeit([0, 1, 2, 3, 4, 5, 6], "10:00", "22:00"),
    },
    {
      id: BB, name: "Brightside Books", farbe: "#6366f1", art: "werkstudent", bundesland: "HH",
      stundenlohnCent: 1480, zuschlagSonntagProzent: 50, zuschlagFeiertagProzent: 125, zuschlagNachtProzent: 25,
      archiviert: false, minusImPDFAnzeigen: true, favorit: false,
      verfuegbarkeit: verfuegbarkeit([1, 2, 3, 4, 5, 6], "09:00", "20:00"),
    },
    {
      id: HO, name: "Harbor Outfitters", farbe: "#0ea5e9", art: "minijob", bundesland: "HH",
      stundenlohnCent: 1460, zuschlagSonntagProzent: 50, zuschlagFeiertagProzent: 100, zuschlagNachtProzent: 25,
      archiviert: false, minusImPDFAnzeigen: true, favorit: false,
      verfuegbarkeit: verfuegbarkeit([1, 2, 3, 4, 5, 6], "09:00", "20:00"),
    },
  ]
}

// ─── Schichten ────────────────────────────────────────────────────────────────

/** [Arbeitgeber, Tag ab Montag (0–6), Start, Ende, Notiz?] */
type Vorlage = [string, number, string, string, string?][]

const VORLAGEN: Record<string, Vorlage> = {
  // Nur So 1. Nov (Rest der Woche liegt vor dem Zeitraum)
  P: [[NW, 6, "10:00", "15:00", "Sunday brunch"]],
  A: [
    [BB, 0, "16:00", "18:30"],
    [HO, 1, "16:30", "18:30"],
    [NW, 2, "18:00", "21:00", "Dinner service"],
    [HO, 3, "19:00", "21:00", "Inventory count"],
    [BB, 4, "16:00", "18:30", "New releases"],
    [NW, 5, "10:00", "18:00", "Weekend event"],
  ],
  B: [
    [BB, 0, "16:00", "19:00"],
    [NW, 1, "17:00", "21:00", "Dinner service"],
    [HO, 2, "16:30", "18:30"],
    [HO, 4, "16:00", "17:30"],
    [BB, 5, "10:00", "13:00", "Kids' story hour"],
    [NW, 6, "10:00", "15:00", "Sunday brunch"],
  ],
  C: [
    [BB, 0, "16:00", "18:00"],
    [HO, 0, "18:30", "20:00"],
    [BB, 1, "16:00", "18:00"],
    [HO, 2, "16:00", "17:30"],
    [NW, 2, "18:00", "21:00"],
    [NW, 4, "18:00", "21:00", "Live music night"],
    [BB, 5, "10:00", "16:00", "Author signing"],
  ],
  D: [
    [HO, 0, "16:30", "18:30"],
    [BB, 1, "16:00", "17:30"],
    [NW, 1, "18:00", "21:00", "Late shift"],
    [HO, 2, "16:30", "18:30"],
    [HO, 4, "16:30", "18:30", "Window display"],
    [HO, 5, "10:00", "13:00", "Weekend sale"],
    [BB, 5, "14:00", "16:00"],
    [NW, 6, "10:00", "14:00", "Sunday brunch"],
  ],
  // 21.–27. Dez: Heiligabend vormittags, 2. Weihnachtstag (Feiertag) im Bistro
  X: [
    [HO, 0, "16:00", "17:30"],
    [NW, 0, "18:00", "20:30"],
    [BB, 1, "16:00", "19:00", "Christmas rush"],
    [BB, 2, "16:00", "18:30", "Gift wrapping"],
    [HO, 3, "09:00", "13:00", "Christmas Eve"],
    [NW, 5, "10:00", "16:00", "Boxing Day brunch"],
  ],
  // 28. Dez – 3. Jan: Silvester vormittags, Neujahr frei
  Y: [
    [BB, 0, "16:00", "19:00", "Inventory count"],
    [HO, 1, "16:00", "17:30"],
    [NW, 1, "18:00", "21:00"],
    [BB, 2, "16:00", "18:00"],
    [HO, 3, "10:00", "13:00", "New Year's Eve"],
    [NW, 5, "10:00", "16:00"],
  ],
}

/** Montag der Woche → Vorlage; die Woche ab 14. Dez bleibt leer */
const WOCHENPLAN: [string, keyof typeof VORLAGEN][] = [
  ["2026-10-26", "P"],
  ["2026-11-02", "A"], ["2026-11-09", "B"], ["2026-11-16", "C"], ["2026-11-23", "D"],
  ["2026-11-30", "A"], ["2026-12-07", "C"],
  ["2026-12-21", "X"], ["2026-12-28", "Y"],
  ["2027-01-04", "B"], ["2027-01-11", "D"], ["2027-01-18", "A"], ["2027-01-25", "C"],
  ["2027-02-01", "B"], ["2027-02-08", "D"], ["2027-02-15", "A"], ["2027-02-22", "B"],
]

export function seedShifts(): SeedShift[] {
  const shifts: SeedShift[] = []
  for (const [montag, vorlage] of WOCHENPLAN) {
    for (const [employerId, tag, start, ende, notiz] of VORLAGEN[vorlage]) {
      const datum = plusTage(montag, tag)
      if (datum < SEED_VON || datum > SEED_BIS) continue
      if (datum === FREIER_TAG) continue
      if (datum >= LEERE_WOCHE.von && datum <= LEERE_WOCHE.bis) continue
      shifts.push({
        employerId, datum, start, ende,
        ...(pauseFuer(start, ende) ?? {}),
        ...(notiz ? { notiz } : {}),
      })
    }
  }
  return shifts.sort((a, b) => (a.datum + a.start).localeCompare(b.datum + b.start))
}

// ─── Firestore-Dokumente (gleiche Form wie fromEmployer/fromShift in shared.ts) ─

export function employerDoc(e: SeedEmployer): EmployerDoc {
  return {
    name: e.name, farbe: e.farbe, art: e.art, bundesland: e.bundesland,
    stundenlohnCent: e.stundenlohnCent,
    zuschlagSonntagProzent: e.zuschlagSonntagProzent,
    zuschlagFeiertagProzent: e.zuschlagFeiertagProzent,
    zuschlagNachtProzent: e.zuschlagNachtProzent,
    archiviert: e.archiviert ?? false,
    minusImPDFAnzeigen: e.minusImPDFAnzeigen ?? true,
    ...(e.verfuegbarkeit ? { verfuegbarkeit: e.verfuegbarkeit } : {}),
    ...(e.favorit ? { favorit: true } : {}),
  }
}

export function shiftDoc(s: SeedShift): ShiftDoc {
  return {
    employerId: s.employerId, datum: s.datum, start: s.start, ende: s.ende,
    pauseVon: s.pauseVon ?? null, pauseBis: s.pauseBis ?? null, notiz: s.notiz ?? null,
  }
}

/** Deterministische IDs: erneutes Seeden mit --force überschreibt statt zu verdoppeln */
export const shiftId = (s: SeedShift) => `seed-${s.datum}-${s.start.replace(":", "")}-${s.employerId.replace("seed-", "")}`

export const SEED_SETTINGS: SettingsDoc = { steuerklasse: 1, kirchensteuer: false, dokSprache: "en" }

export function nettoMinutenSeed(s: SeedShift): number {
  const pause = s.pauseVon && s.pauseBis ? zuMin(s.pauseBis) - zuMin(s.pauseVon) : 0
  return zuMin(s.ende) - zuMin(s.start) - pause
}

/** Monat ("YYYY-MM") → Arbeitgeber-ID → { schichten, minuten } */
export function zusammenfassung(shifts: SeedShift[]): Map<string, Map<string, { schichten: number; minuten: number }>> {
  const proMonat = new Map<string, Map<string, { schichten: number; minuten: number }>>()
  for (const s of shifts) {
    const monat = s.datum.slice(0, 7)
    const proEmployer = proMonat.get(monat) ?? new Map()
    const eintrag = proEmployer.get(s.employerId) ?? { schichten: 0, minuten: 0 }
    eintrag.schichten++
    eintrag.minuten += nettoMinutenSeed(s)
    proEmployer.set(s.employerId, eintrag)
    proMonat.set(monat, proEmployer)
  }
  return proMonat
}

// ─── Stundenplan als ICS ──────────────────────────────────────────────────────

interface Serie {
  titel: string
  /** erster Termin (Semesterbeginn 12. Okt 2026) */
  datum: string
  start: string
  ende: string
  ort: string
  byday?: string
  intervall?: number
  /** Lehrveranstaltungen pausieren über Weihnachten */
  weihnachtspause?: boolean
}

const SEMESTER_ENDE_UTC = "20270212T235959Z"
const WEIHNACHTEN = { von: "2026-12-21", bis: "2027-01-03" }

const SERIEN: Serie[] = [
  { titel: "Database Systems", datum: "2026-10-12", start: "10:00", ende: "11:30", ort: "Stanbridge University, Room A1.12", weihnachtspause: true },
  { titel: "Algorithms", datum: "2026-10-13", start: "12:00", ende: "13:30", ort: "Stanbridge University, Lecture Hall 2", weihnachtspause: true },
  { titel: "Linear Algebra", datum: "2026-10-14", start: "10:00", ende: "11:30", ort: "Stanbridge University, Lecture Hall 1", weihnachtspause: true },
  { titel: "Software Engineering", datum: "2026-10-15", start: "14:00", ende: "15:30", ort: "Stanbridge University, Room B2.04", weihnachtspause: true },
  { titel: "Ethics in Computing", datum: "2026-10-16", start: "10:00", ende: "11:30", ort: "Stanbridge University, Room C0.01", weihnachtspause: true },
  { titel: "Algorithms Tutorial", datum: "2026-10-13", start: "14:00", ende: "15:30", ort: "Stanbridge University, Room A2.07", weihnachtspause: true },
  { titel: "Linear Algebra Tutorial", datum: "2026-10-14", start: "12:00", ende: "13:30", ort: "Stanbridge University, Room A2.08", weihnachtspause: true },
  { titel: "Database Lab Session", datum: "2026-10-15", start: "10:00", ende: "12:00", ort: "Stanbridge University, Computer Lab 3", intervall: 2, weihnachtspause: true },
  { titel: "Study Group", datum: "2026-10-15", start: "17:00", ende: "18:30", ort: "Stanbridge University, Library Group Room 4", weihnachtspause: true },
  { titel: "Study Gym", datum: "2026-10-12", start: "07:00", ende: "08:00", ort: "Stanbridge University Sports Centre", byday: "MO,WE,FR" },
]

const EINZELTERMINE = [
  { titel: "Midterm Exam", datum: "2026-12-10", ganztaegig: true, ort: "Stanbridge University, Exam Hall" },
]

/** Liegen absichtlich in einer Demo-Schicht (Test der Überschneidungsanzeige) */
export const UEBERSCHNEIDUNGS_TERMINE = [
  { titel: "Guest Lecture: Cloud Security", datum: "2026-11-17", start: "17:00", ende: "18:30", ort: "Stanbridge University, Lecture Hall 1" },
  { titel: "Hackathon Kickoff", datum: "2027-01-20", start: "18:30", ende: "20:00", ort: "Stanbridge University, Innovation Lab" },
]

const VTIMEZONE_BERLIN = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Berlin",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
  "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
  "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
]

const lokal = (datum: string, zeit: string) => `${datum.replace(/-/g, "")}T${zeit.replace(":", "")}00`
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/** Zeilen nach RFC 5545 auf 75 Oktette falten (Inhalt ist reines ASCII) */
function falten(zeile: string): string[] {
  const teile = [zeile.slice(0, 75)]
  for (let i = 75; i < zeile.length; i += 74) teile.push(" " + zeile.slice(i, i + 74))
  return teile
}

/** Termine einer Serie, die in die Weihnachtspause fallen → EXDATE */
function pausenTermine(serie: Serie): string[] {
  const tage = serie.byday ? serie.byday.split(",").length : 1
  if (tage !== 1) throw new Error("Weihnachtspause nur für Serien mit einem Wochentag")
  const schritt = 7 * (serie.intervall ?? 1)
  const termine: string[] = []
  for (let d = serie.datum; d <= WEIHNACHTEN.bis; d = plusTage(d, schritt)) {
    if (d >= WEIHNACHTEN.von) termine.push(d)
  }
  return termine
}

export function seedIcs(): string {
  const dtstamp = "20261101T000000Z"
  const zeilen = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shiftslot Demo//Stanbridge University//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Stanbridge University - Winter 2026/27", "X-WR-TIMEZONE:Europe/Berlin",
    ...VTIMEZONE_BERLIN,
  ]

  for (const s of SERIEN) {
    const rrule = ["FREQ=WEEKLY", `UNTIL=${SEMESTER_ENDE_UTC}`]
    if (s.intervall) rrule.push(`INTERVAL=${s.intervall}`)
    if (s.byday) rrule.push(`BYDAY=${s.byday}`)
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${slug(s.titel)}-ws2627@stanbridge.example`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/Berlin:${lokal(s.datum, s.start)}`,
      `DTEND;TZID=Europe/Berlin:${lokal(s.datum, s.ende)}`,
      `RRULE:${rrule.join(";")}`,
      ...(s.weihnachtspause ? pausenTermine(s).map((d) => `EXDATE;TZID=Europe/Berlin:${lokal(d, s.start)}`) : []),
      `SUMMARY:${s.titel}`,
      `LOCATION:${s.ort.replace(/,/g, "\\,")}`,
      "DESCRIPTION:Stanbridge University - Winter semester 2026/27",
      "END:VEVENT",
    )
  }

  for (const e of EINZELTERMINE) {
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${slug(e.titel)}-${e.datum}@stanbridge.example`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${e.datum.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${plusTage(e.datum, 1).replace(/-/g, "")}`,
      `SUMMARY:${e.titel}`,
      `LOCATION:${e.ort.replace(/,/g, "\\,")}`,
      "DESCRIPTION:All modules - bring your student ID",
      "END:VEVENT",
    )
  }

  for (const t of UEBERSCHNEIDUNGS_TERMINE) {
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${slug(t.titel)}-${t.datum}@stanbridge.example`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/Berlin:${lokal(t.datum, t.start)}`,
      `DTEND;TZID=Europe/Berlin:${lokal(t.datum, t.ende)}`,
      `SUMMARY:${t.titel}`,
      `LOCATION:${t.ort.replace(/,/g, "\\,")}`,
      "DESCRIPTION:Optional event - overlaps a work shift on purpose",
      "END:VEVENT",
    )
  }

  zeilen.push("END:VCALENDAR")
  return zeilen.flatMap(falten).join("\r\n") + "\r\n"
}
