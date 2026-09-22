import { auth } from "@/lib/firebase/client"
import { collection, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import type { Employer, Shift, Settings, Abgleich, GeplanteSchicht, MinusEintrag } from "@/lib/types"

export function uid(): string {
  const user = auth.currentUser
  if (!user) throw new Error("Nicht angemeldet")
  return user.uid
}

export function userCol(name: string) {
  return collection(db, "users", uid(), name)
}

export function userDoc(colName: string, id: string) {
  return doc(db, "users", uid(), colName, id)
}

// ── Employer ────────────────────────────────────────────────────────────────

export type EmployerDoc = {
  name: string; farbe: string; art: Employer["art"]
  bundesland: string
  stundenlohnCent: number
  zuschlagSonntagProzent: number; zuschlagFeiertagProzent: number; zuschlagNachtProzent: number
  archiviert: boolean
}

export const toEmployer = (id: string, d: EmployerDoc): Employer => ({
  id, name: d.name, farbe: d.farbe, art: d.art,
  bundesland: (d.bundesland ?? "HH") as Employer["bundesland"],
  stundenlohnCent: d.stundenlohnCent,
  zuschlagSonntagProzent: d.zuschlagSonntagProzent,
  zuschlagFeiertagProzent: d.zuschlagFeiertagProzent,
  zuschlagNachtProzent: d.zuschlagNachtProzent,
  ...(d.archiviert ? { archiviert: true } : {}),
})

export const fromEmployer = (e: Omit<Employer, "id">): EmployerDoc => ({
  name: e.name, farbe: e.farbe, art: e.art,
  bundesland: e.bundesland,
  stundenlohnCent: e.stundenlohnCent,
  zuschlagSonntagProzent: e.zuschlagSonntagProzent,
  zuschlagFeiertagProzent: e.zuschlagFeiertagProzent,
  zuschlagNachtProzent: e.zuschlagNachtProzent,
  archiviert: e.archiviert ?? false,
})

// ── Shift ────────────────────────────────────────────────────────────────────

export type ShiftDoc = {
  employerId: string; datum: string; start: string; ende: string
  pauseVon: string | null; pauseBis: string | null; notiz: string | null
}

export const toShift = (id: string, d: ShiftDoc): Shift => ({
  id, employerId: d.employerId, datum: d.datum, start: d.start, ende: d.ende,
  ...(d.pauseVon ? { pauseVon: d.pauseVon } : {}),
  ...(d.pauseBis ? { pauseBis: d.pauseBis } : {}),
  ...(d.notiz ? { notiz: d.notiz } : {}),
})

export const fromShift = (s: Omit<Shift, "id">): ShiftDoc => ({
  employerId: s.employerId, datum: s.datum, start: s.start, ende: s.ende,
  pauseVon: s.pauseVon ?? null, pauseBis: s.pauseBis ?? null, notiz: s.notiz ?? null,
})

// ── Settings ─────────────────────────────────────────────────────────────────

export type SettingsDoc = {
  bundesland: Settings["bundesland"]; steuerklasse: Settings["steuerklasse"]
  kirchensteuer: boolean; kurzfristigPauschal: boolean
}

export const toSettings = (d: SettingsDoc): Settings => ({
  id: "default",
  bundesland: d.bundesland, steuerklasse: d.steuerklasse,
  kirchensteuer: d.kirchensteuer, kurzfristigPauschal: d.kurzfristigPauschal,
})

// ── MinusEintrag ─────────────────────────────────────────────────────────────

export type MinusEintragDoc = {
  employerId: string; datum: string; minuten: number; notiz: string | null
}

export const toMinusEintrag = (id: string, d: MinusEintragDoc): MinusEintrag => ({
  id, employerId: d.employerId, datum: d.datum, minuten: d.minuten,
  ...(d.notiz ? { notiz: d.notiz } : {}),
})

export const fromMinusEintrag = (e: Omit<MinusEintrag, "id">): MinusEintragDoc => ({
  employerId: e.employerId, datum: e.datum, minuten: e.minuten,
  notiz: e.notiz ?? null,
})

// ── GeplanteSchicht ──────────────────────────────────────────────────────────

export type GeplanteSchichtDoc = {
  employerId: string; datum: string; start: string; ende: string
  uebernommen: boolean; uebernommenShiftId: string | null
}

export const toGeplanteSchicht = (id: string, d: GeplanteSchichtDoc): GeplanteSchicht => ({
  id, employerId: d.employerId, datum: d.datum, start: d.start, ende: d.ende,
  uebernommen: d.uebernommen,
  ...(d.uebernommenShiftId ? { uebernommenShiftId: d.uebernommenShiftId } : {}),
})

export const fromGeplanteSchicht = (s: Omit<GeplanteSchicht, "id">): GeplanteSchichtDoc => ({
  employerId: s.employerId, datum: s.datum, start: s.start, ende: s.ende,
  uebernommen: s.uebernommen,
  uebernommenShiftId: s.uebernommenShiftId ?? null,
})

// ── Abgleich ─────────────────────────────────────────────────────────────────

export type AbgleichDoc = {
  employerId: string; monat: number; jahr: number
  lautAbrechnungStunden: number | null; tatsaechlichAusgezahltCent: number | null
}

export const toAbgleich = (id: string, d: AbgleichDoc): Abgleich => ({
  id, employerId: d.employerId, monat: d.monat, jahr: d.jahr,
  ...(d.lautAbrechnungStunden != null ? { lautAbrechnungStunden: d.lautAbrechnungStunden } : {}),
  ...(d.tatsaechlichAusgezahltCent != null ? { tatsaechlichAusgezahltCent: d.tatsaechlichAusgezahltCent } : {}),
})
