import { supabase } from "@/lib/supabase/client"
import type { Employer } from "@/lib/types"
import type { IEmployerRepository, EmployerInput, EmployerUpdate } from "../interfaces/IEmployerRepository"
import { toEmployer, fromEmployer, uid, type EmployerRow } from "./shared"

export class EmployerRepository implements IEmployerRepository {
  async findById(id: string): Promise<Employer | undefined> {
    const { data, error } = await supabase.from("employers").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? toEmployer(data as EmployerRow) : undefined
  }

  async findAlle(): Promise<Employer[]> {
    const { data, error } = await supabase.from("employers").select("*").order("name")
    if (error) throw error
    return (data as EmployerRow[]).map(toEmployer)
  }

  async findAktive(): Promise<Employer[]> {
    const { data, error } = await supabase
      .from("employers").select("*").eq("archiviert", false).order("name")
    if (error) throw error
    return (data as EmployerRow[]).map(toEmployer)
  }

  async add(input: EmployerInput): Promise<Employer> {
    const userId = await uid()
    const { data, error } = await supabase
      .from("employers")
      .insert({ id: crypto.randomUUID(), ...fromEmployer(input, userId) })
      .select().single()
    if (error) throw error
    return toEmployer(data as EmployerRow)
  }

  async update(id: string, changes: EmployerUpdate): Promise<Employer | undefined> {
    const row: Record<string, unknown> = {}
    if (changes.name !== undefined) row.name = changes.name
    if (changes.farbe !== undefined) row.farbe = changes.farbe
    if (changes.art !== undefined) row.art = changes.art
    if (changes.stundenlohnCent !== undefined) row.stundenlohn_cent = changes.stundenlohnCent
    if (changes.zuschlagSonntagProzent !== undefined) row.zuschlag_sonntag_prozent = changes.zuschlagSonntagProzent
    if (changes.zuschlagFeiertagProzent !== undefined) row.zuschlag_feiertag_prozent = changes.zuschlagFeiertagProzent
    if (changes.zuschlagNachtProzent !== undefined) row.zuschlag_nacht_prozent = changes.zuschlagNachtProzent
    if (changes.archiviert !== undefined) row.archiviert = changes.archiviert ?? false
    const { data, error } = await supabase
      .from("employers").update(row).eq("id", id).select().single()
    if (error) throw error
    return toEmployer(data as EmployerRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("employers").delete().eq("id", id)
    if (error) throw error
  }
}
