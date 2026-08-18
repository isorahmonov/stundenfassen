// Supabase-Datenzugriff — ersetzt Dexie/IndexedDB vollständig.
// RLS filtert automatisch nach auth.uid(), daher keine manuellen user_id-Filter
// bei SELECT nötig. Bei INSERT muss user_id explizit gesetzt werden.

import type { Abgleich, Bundesland, Employer, EmployerArt, Settings, Shift, Steuerklasse } from "@/lib/types"
import { supabase } from "./client"

// ── DB-Zeilentypen (snake_case) ───────────────────────────────

interface EmployerRow {
  id: string; user_id: string; name: string; farbe: string
  stundenlohn_cent: number; art: EmployerArt
  zuschlag_sonntag_prozent: number
  zuschlag_feiertag_prozent: number
  zuschlag_nacht_prozent: number
  archiviert: boolean
}
interface ShiftRow {
  id: string; user_id: string; employer_id: string; datum: string
  start_uhr: string; ende_uhr: string
  pause_von: string | null; pause_bis: string | null; notiz: string | null
}
interface SettingsRow {
  id: string; user_id: string; bundesland: Bundesland
  steuerklasse: Steuerklasse; kirchensteuer: boolean; kurzfristig_pauschal: boolean
}
interface AbgleichRow {
  id: string; user_id: string; employer_id: string; monat: number; jahr: number
  laut_abrechnung_stunden: number | null; tatsaechlich_ausgezahlt_cent: number | null
}

// ── Mapper DB → TS ────────────────────────────────────────────

const toEmployer = (r: EmployerRow): Employer => ({
  id: r.id, name: r.name, farbe: r.farbe, art: r.art,
  stundenlohnCent: r.stundenlohn_cent,
  zuschlagSonntagProzent: r.zuschlag_sonntag_prozent,
  zuschlagFeiertagProzent: r.zuschlag_feiertag_prozent,
  zuschlagNachtProzent: r.zuschlag_nacht_prozent,
  ...(r.archiviert ? { archiviert: true } : {}),
})

const fromEmployer = (e: Omit<Employer, "id">, userId: string) => ({
  user_id: userId, name: e.name, farbe: e.farbe, art: e.art,
  stundenlohn_cent: e.stundenlohnCent,
  zuschlag_sonntag_prozent: e.zuschlagSonntagProzent,
  zuschlag_feiertag_prozent: e.zuschlagFeiertagProzent,
  zuschlag_nacht_prozent: e.zuschlagNachtProzent,
  archiviert: e.archiviert ?? false,
})

const toShift = (r: ShiftRow): Shift => ({
  id: r.id, employerId: r.employer_id, datum: r.datum,
  start: r.start_uhr, ende: r.ende_uhr,
  ...(r.pause_von ? { pauseVon: r.pause_von } : {}),
  ...(r.pause_bis ? { pauseBis: r.pause_bis } : {}),
  ...(r.notiz ? { notiz: r.notiz } : {}),
})

const fromShift = (s: Omit<Shift, "id">, userId: string) => ({
  user_id: userId, employer_id: s.employerId, datum: s.datum,
  start_uhr: s.start, ende_uhr: s.ende,
  pause_von: s.pauseVon ?? null, pause_bis: s.pauseBis ?? null, notiz: s.notiz ?? null,
})

const toSettings = (r: SettingsRow): Settings => ({
  id: r.id, bundesland: r.bundesland, steuerklasse: r.steuerklasse,
  kirchensteuer: r.kirchensteuer, kurzfristigPauschal: r.kurzfristig_pauschal,
})

const toAbgleich = (r: AbgleichRow): Abgleich => ({
  id: r.id, employerId: r.employer_id, monat: r.monat, jahr: r.jahr,
  ...(r.laut_abrechnung_stunden != null ? { lautAbrechnungStunden: r.laut_abrechnung_stunden } : {}),
  ...(r.tatsaechlich_ausgezahlt_cent != null ? { tatsaechlichAusgezahltCent: r.tatsaechlich_ausgezahlt_cent } : {}),
})

// ── Hilfsfunktion: aktuelle User-ID ──────────────────────────

async function uid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user.id) throw new Error("Nicht angemeldet")
  return session.user.id
}

// ── Service-Objekt ────────────────────────────────────────────

export const svc = {

  // ── Employers ─────────────────────────────────────────────
  employers: {
    async findAll(): Promise<Employer[]> {
      const { data, error } = await supabase.from("employers").select("*").order("name")
      if (error) throw error
      return (data as EmployerRow[]).map(toEmployer)
    },

    async add(input: Omit<Employer, "id">): Promise<Employer> {
      const userId = await uid()
      const { data, error } = await supabase
        .from("employers")
        .insert({ id: crypto.randomUUID(), ...fromEmployer(input, userId) })
        .select().single()
      if (error) throw error
      return toEmployer(data as EmployerRow)
    },

    async update(id: string, changes: Partial<Omit<Employer, "id">>): Promise<void> {
      const row: Record<string, unknown> = {}
      if (changes.name !== undefined) row.name = changes.name
      if (changes.farbe !== undefined) row.farbe = changes.farbe
      if (changes.art !== undefined) row.art = changes.art
      if (changes.stundenlohnCent !== undefined) row.stundenlohn_cent = changes.stundenlohnCent
      if (changes.zuschlagSonntagProzent !== undefined) row.zuschlag_sonntag_prozent = changes.zuschlagSonntagProzent
      if (changes.zuschlagFeiertagProzent !== undefined) row.zuschlag_feiertag_prozent = changes.zuschlagFeiertagProzent
      if (changes.zuschlagNachtProzent !== undefined) row.zuschlag_nacht_prozent = changes.zuschlagNachtProzent
      if (changes.archiviert !== undefined) row.archiviert = changes.archiviert ?? false
      const { error } = await supabase.from("employers").update(row).eq("id", id)
      if (error) throw error
    },
  },

  // ── Shifts ────────────────────────────────────────────────
  shifts: {
    async findByMonat(monat: number, jahr: number): Promise<Shift[]> {
      const mm = String(monat).padStart(2, "0")
      const { data, error } = await supabase
        .from("shifts").select("*")
        .gte("datum", `${jahr}-${mm}-01`)
        .lte("datum", `${jahr}-${mm}-31`)
        .order("datum")
      if (error) throw error
      return (data as ShiftRow[]).map(toShift)
    },

    async findByJahr(jahr: number): Promise<Shift[]> {
      const { data, error } = await supabase
        .from("shifts").select("*")
        .gte("datum", `${jahr}-01-01`)
        .lte("datum", `${jahr}-12-31`)
        .order("datum")
      if (error) throw error
      return (data as ShiftRow[]).map(toShift)
    },

    async findByEmployer(employerId: string): Promise<Shift[]> {
      const { data, error } = await supabase
        .from("shifts").select("*")
        .eq("employer_id", employerId)
        .order("datum", { ascending: false })
      if (error) throw error
      return (data as ShiftRow[]).map(toShift)
    },

    async add(input: Omit<Shift, "id">): Promise<Shift> {
      const userId = await uid()
      const { data, error } = await supabase
        .from("shifts")
        .insert({ id: crypto.randomUUID(), ...fromShift(input, userId) })
        .select().single()
      if (error) throw error
      return toShift(data as ShiftRow)
    },

    async update(id: string, changes: Partial<Omit<Shift, "id" | "employerId">>): Promise<void> {
      const row: Record<string, unknown> = {}
      if (changes.datum !== undefined) row.datum = changes.datum
      if (changes.start !== undefined) row.start_uhr = changes.start
      if (changes.ende !== undefined) row.ende_uhr = changes.ende
      if ("pauseVon" in changes) row.pause_von = changes.pauseVon ?? null
      if ("pauseBis" in changes) row.pause_bis = changes.pauseBis ?? null
      if ("notiz" in changes) row.notiz = changes.notiz ?? null
      const { error } = await supabase.from("shifts").update(row).eq("id", id)
      if (error) throw error
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("shifts").delete().eq("id", id)
      if (error) throw error
    },
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    async get(): Promise<Settings | null> {
      const { data, error } = await supabase
        .from("settings").select("*").eq("id", "default").maybeSingle()
      if (error) throw error
      return data ? toSettings(data as SettingsRow) : null
    },

    async save(input: Omit<Settings, "id">): Promise<Settings> {
      const userId = await uid()
      const { data, error } = await supabase
        .from("settings")
        .upsert({
          id: "default", user_id: userId,
          bundesland: input.bundesland, steuerklasse: input.steuerklasse,
          kirchensteuer: input.kirchensteuer, kurzfristig_pauschal: input.kurzfristigPauschal,
        }, { onConflict: "user_id,id" })
        .select().single()
      if (error) throw error
      return toSettings(data as SettingsRow)
    },
  },

  // ── Abgleich ──────────────────────────────────────────────
  abgleich: {
    async findByMonatJahr(monat: number, jahr: number): Promise<Abgleich[]> {
      const { data, error } = await supabase
        .from("abgleich").select("*").eq("monat", monat).eq("jahr", jahr)
      if (error) throw error
      return (data as AbgleichRow[]).map(toAbgleich)
    },

    async add(input: Omit<Abgleich, "id">): Promise<Abgleich> {
      const userId = await uid()
      const { data, error } = await supabase
        .from("abgleich")
        .insert({
          id: crypto.randomUUID(), user_id: userId,
          employer_id: input.employerId, monat: input.monat, jahr: input.jahr,
          laut_abrechnung_stunden: input.lautAbrechnungStunden ?? null,
          tatsaechlich_ausgezahlt_cent: input.tatsaechlichAusgezahltCent ?? null,
        })
        .select().single()
      if (error) throw error
      return toAbgleich(data as AbgleichRow)
    },

    async update(id: string, changes: {
      lautAbrechnungStunden?: number
      tatsaechlichAusgezahltCent?: number
    }): Promise<void> {
      const row: Record<string, unknown> = {}
      if ("lautAbrechnungStunden" in changes) row.laut_abrechnung_stunden = changes.lautAbrechnungStunden ?? null
      if ("tatsaechlichAusgezahltCent" in changes) row.tatsaechlich_ausgezahlt_cent = changes.tatsaechlichAusgezahltCent ?? null
      const { error } = await supabase.from("abgleich").update(row).eq("id", id)
      if (error) throw error
    },
  },

  // ── Demo-Daten ────────────────────────────────────────────
  async seedDemoData(): Promise<void> {
    const userId = await uid()
    const { count } = await supabase
      .from("employers").select("*", { count: "exact", head: true })
    if (count && count > 0) return

    const techCorpId = crypto.randomUUID()
    const cafeBraunId = crypto.randomUUID()

    await supabase.from("employers").insert([
      { id: techCorpId, user_id: userId, name: "TechCorp", farbe: "#2563eb", stundenlohn_cent: 1500, art: "werkstudent", zuschlag_sonntag_prozent: 50, zuschlag_feiertag_prozent: 100, zuschlag_nacht_prozent: 25 },
      { id: cafeBraunId, user_id: userId, name: "Café Braun", farbe: "#b45309", stundenlohn_cent: 1200, art: "minijob", zuschlag_sonntag_prozent: 25, zuschlag_feiertag_prozent: 50, zuschlag_nacht_prozent: 20 },
    ])

    await supabase.from("settings").upsert({ id: "default", user_id: userId, bundesland: "BY", steuerklasse: 1, kirchensteuer: false, kurzfristig_pauschal: false }, { onConflict: "user_id,id" })

    const heute = new Date()
    const j = heute.getFullYear()
    const m = String(heute.getMonth() + 1).padStart(2, "0")

    await supabase.from("shifts").insert([
      { id: crypto.randomUUID(), user_id: userId, employer_id: techCorpId, datum: `${j}-${m}-03`, start_uhr: "09:00", ende_uhr: "17:00", pause_von: "12:00", pause_bis: "12:30", notiz: "Sprint-Start" },
      { id: crypto.randomUUID(), user_id: userId, employer_id: techCorpId, datum: `${j}-${m}-05`, start_uhr: "09:00", ende_uhr: "17:00", pause_von: "13:00", pause_bis: "13:30", notiz: null },
      { id: crypto.randomUUID(), user_id: userId, employer_id: techCorpId, datum: `${j}-${m}-10`, start_uhr: "10:00", ende_uhr: "18:00", pause_von: "13:00", pause_bis: "13:30", notiz: null },
      { id: crypto.randomUUID(), user_id: userId, employer_id: techCorpId, datum: `${j}-${m}-17`, start_uhr: "09:00", ende_uhr: "13:00", pause_von: null, pause_bis: null, notiz: "halber Tag" },
      { id: crypto.randomUUID(), user_id: userId, employer_id: cafeBraunId, datum: `${j}-${m}-07`, start_uhr: "10:00", ende_uhr: "15:00", pause_von: null, pause_bis: null, notiz: "Wochenende" },
      { id: crypto.randomUUID(), user_id: userId, employer_id: cafeBraunId, datum: `${j}-${m}-13`, start_uhr: "18:00", ende_uhr: "23:00", pause_von: "20:00", pause_bis: "20:15", notiz: "Abendschicht" },
    ])
  },
}
