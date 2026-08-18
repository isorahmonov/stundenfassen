import type { Bundesland, Employer, EmployerArt, Abgleich, Settings, Shift, Steuerklasse } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"

export interface EmployerRow {
  id: string; user_id: string; name: string; farbe: string
  stundenlohn_cent: number; art: EmployerArt
  zuschlag_sonntag_prozent: number; zuschlag_feiertag_prozent: number; zuschlag_nacht_prozent: number
  archiviert: boolean
}

export interface ShiftRow {
  id: string; user_id: string; employer_id: string; datum: string
  start_uhr: string; ende_uhr: string
  pause_von: string | null; pause_bis: string | null; notiz: string | null
}

export interface SettingsRow {
  id: string; user_id: string; bundesland: Bundesland
  steuerklasse: Steuerklasse; kirchensteuer: boolean; kurzfristig_pauschal: boolean
}

export interface AbgleichRow {
  id: string; user_id: string; employer_id: string; monat: number; jahr: number
  laut_abrechnung_stunden: number | null; tatsaechlich_ausgezahlt_cent: number | null
}

export const toEmployer = (r: EmployerRow): Employer => ({
  id: r.id, name: r.name, farbe: r.farbe, art: r.art,
  stundenlohnCent: r.stundenlohn_cent,
  zuschlagSonntagProzent: r.zuschlag_sonntag_prozent,
  zuschlagFeiertagProzent: r.zuschlag_feiertag_prozent,
  zuschlagNachtProzent: r.zuschlag_nacht_prozent,
  ...(r.archiviert ? { archiviert: true } : {}),
})

export const fromEmployer = (e: Omit<Employer, "id">, userId: string) => ({
  user_id: userId, name: e.name, farbe: e.farbe, art: e.art,
  stundenlohn_cent: e.stundenlohnCent,
  zuschlag_sonntag_prozent: e.zuschlagSonntagProzent,
  zuschlag_feiertag_prozent: e.zuschlagFeiertagProzent,
  zuschlag_nacht_prozent: e.zuschlagNachtProzent,
  archiviert: e.archiviert ?? false,
})

export const toShift = (r: ShiftRow): Shift => ({
  id: r.id, employerId: r.employer_id, datum: r.datum,
  start: r.start_uhr, ende: r.ende_uhr,
  ...(r.pause_von ? { pauseVon: r.pause_von } : {}),
  ...(r.pause_bis ? { pauseBis: r.pause_bis } : {}),
  ...(r.notiz ? { notiz: r.notiz } : {}),
})

export const fromShift = (s: Omit<Shift, "id">, userId: string) => ({
  user_id: userId, employer_id: s.employerId, datum: s.datum,
  start_uhr: s.start, ende_uhr: s.ende,
  pause_von: s.pauseVon ?? null, pause_bis: s.pauseBis ?? null, notiz: s.notiz ?? null,
})

export const toSettings = (r: SettingsRow): Settings => ({
  id: r.id, bundesland: r.bundesland, steuerklasse: r.steuerklasse,
  kirchensteuer: r.kirchensteuer, kurzfristigPauschal: r.kurzfristig_pauschal,
})

export const toAbgleich = (r: AbgleichRow): Abgleich => ({
  id: r.id, employerId: r.employer_id, monat: r.monat, jahr: r.jahr,
  ...(r.laut_abrechnung_stunden != null ? { lautAbrechnungStunden: r.laut_abrechnung_stunden } : {}),
  ...(r.tatsaechlich_ausgezahlt_cent != null ? { tatsaechlichAusgezahltCent: r.tatsaechlich_ausgezahlt_cent } : {}),
})

export async function uid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user.id) throw new Error("Nicht angemeldet")
  return session.user.id
}
