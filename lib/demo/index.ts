import type { Employer, Shift } from "@/lib/types"
import type { IcalAnzeigeTermin } from "@/lib/calendar/icalLaden"

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("demo") === "1"
}

export const DEMO_EMPLOYERS: Employer[] = [
  {
    id: "demo-aurora",
    name: "Café Aurora",
    farbe: "#f59e0b",
    stundenlohnCent: 1400,
    art: "werkstudent",
    bundesland: "HH",
    zuschlagSonntagProzent: 50,
    zuschlagFeiertagProzent: 125,
    zuschlagNachtProzent: 25,
  },
  {
    id: "demo-harbor",
    name: "Harbor Bookshop",
    farbe: "#6366f1",
    stundenlohnCent: 1300,
    art: "kurzfristig",
    bundesland: "HH",
    zuschlagSonntagProzent: 50,
    zuschlagFeiertagProzent: 125,
    zuschlagNachtProzent: 25,
  },
  {
    id: "demo-maple",
    name: "Maple Garden",
    farbe: "#10b981",
    stundenlohnCent: 1550,
    art: "werkstudent",
    bundesland: "HH",
    zuschlagSonntagProzent: 50,
    zuschlagFeiertagProzent: 125,
    zuschlagNachtProzent: 25,
  },
]

export const DEMO_SHIFTS: Shift[] = [
  { id: "ds-1",  employerId: "demo-aurora", datum: "2026-11-12", start: "09:00", ende: "14:00" },
  { id: "ds-2",  employerId: "demo-harbor", datum: "2026-11-10", start: "11:00", ende: "17:00" },
  { id: "ds-3",  employerId: "demo-maple",  datum: "2026-11-14", start: "10:00", ende: "15:00" },
  { id: "ds-4",  employerId: "demo-aurora", datum: "2026-11-15", start: "14:00", ende: "20:00" },
  { id: "ds-5",  employerId: "demo-harbor", datum: "2026-11-17", start: "10:00", ende: "16:00" },
  { id: "ds-6",  employerId: "demo-harbor", datum: "2026-11-19", start: "14:00", ende: "19:00" },
  { id: "ds-7",  employerId: "demo-aurora", datum: "2026-11-20", start: "10:00", ende: "14:00" },
  { id: "ds-8",  employerId: "demo-maple",  datum: "2026-11-21", start: "11:00", ende: "15:00" },
  { id: "ds-9",  employerId: "demo-aurora", datum: "2026-11-22", start: "09:00", ende: "17:00" },
  { id: "ds-10", employerId: "demo-harbor", datum: "2026-11-23", start: "10:00", ende: "16:00" },
  { id: "ds-11", employerId: "demo-maple",  datum: "2026-11-24", start: "12:00", ende: "18:00" },
  { id: "ds-12", employerId: "demo-aurora", datum: "2026-11-25", start: "09:00", ende: "13:00" },
  { id: "ds-13", employerId: "demo-harbor", datum: "2026-11-26", start: "15:00", ende: "20:00" },
  { id: "ds-14", employerId: "demo-maple",  datum: "2026-11-27", start: "10:00", ende: "14:00" },
]

const DEMO_ICAL_FARBE = "#3b82f6"
const DEMO_ICAL_QUELLE_NAME = "HAW Hamburg"

export const DEMO_ICAL_TERMINE: IcalAnzeigeTermin[] = [
  { uid: "di-1", titel: "Study Group",      datum: "2026-11-19", datumBis: "2026-11-19", startMin: 600, endMin: 720,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-2", titel: "Database Systems", datum: "2026-11-20", datumBis: "2026-11-20", startMin: 480, endMin: 600,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-3", titel: "Lab Session",      datum: "2026-11-21", datumBis: "2026-11-21", startMin: 540, endMin: 660,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-4", titel: "Database Systems", datum: "2026-11-23", datumBis: "2026-11-23", startMin: 480, endMin: 600,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-5", titel: "Study Group",      datum: "2026-11-25", datumBis: "2026-11-25", startMin: 840, endMin: 960,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-6", titel: "Lab Session",      datum: "2026-11-26", datumBis: "2026-11-26", startMin: 540, endMin: 660,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
  { uid: "di-7", titel: "Database Systems", datum: "2026-11-28", datumBis: "2026-11-28", startMin: 480, endMin: 600,  ganztaegig: false, quelleId: "demo-uni", quelleName: DEMO_ICAL_QUELLE_NAME, quelleFarbe: DEMO_ICAL_FARBE },
]

export function demoShiftsForRange(von: string, bis: string): Shift[] {
  return DEMO_SHIFTS.filter(s => s.datum >= von && s.datum <= bis)
}

export function demoShiftsForMonth(monat: number, jahr: number): Shift[] {
  const prefix = `${jahr}-${String(monat).padStart(2, "0")}`
  return DEMO_SHIFTS.filter(s => s.datum.startsWith(prefix))
}

export function demoIcalTermineForRange(von: string, bis: string): IcalAnzeigeTermin[] {
  return DEMO_ICAL_TERMINE.filter(t => t.datum <= bis && t.datumBis >= von)
}
