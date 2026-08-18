import { supabase } from "@/lib/supabase/client"
import type { Abgleich } from "@/lib/types"
import type { IAbgleichRepository, AbgleichInput, AbgleichUpdate } from "../interfaces/IAbgleichRepository"
import { toAbgleich, uid, type AbgleichRow } from "./shared"

export class AbgleichRepository implements IAbgleichRepository {
  async findById(id: string): Promise<Abgleich | undefined> {
    const { data, error } = await supabase.from("abgleich").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? toAbgleich(data as AbgleichRow) : undefined
  }

  async findByMonatJahr(monat: number, jahr: number): Promise<Abgleich[]> {
    const { data, error } = await supabase
      .from("abgleich").select("*").eq("monat", monat).eq("jahr", jahr)
    if (error) throw error
    return (data as AbgleichRow[]).map(toAbgleich)
  }

  async findByEmployer(employerId: string): Promise<Abgleich[]> {
    const { data, error } = await supabase
      .from("abgleich").select("*").eq("employer_id", employerId)
    if (error) throw error
    return (data as AbgleichRow[]).map(toAbgleich)
  }

  async findByEmployerUndMonatJahr(
    employerId: string,
    monat: number,
    jahr: number,
  ): Promise<Abgleich | undefined> {
    const { data, error } = await supabase
      .from("abgleich").select("*")
      .eq("employer_id", employerId).eq("monat", monat).eq("jahr", jahr)
      .maybeSingle()
    if (error) throw error
    return data ? toAbgleich(data as AbgleichRow) : undefined
  }

  async add(input: AbgleichInput): Promise<Abgleich> {
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
  }

  async update(id: string, changes: AbgleichUpdate): Promise<Abgleich | undefined> {
    const row: Record<string, unknown> = {}
    if ("lautAbrechnungStunden" in changes) row.laut_abrechnung_stunden = changes.lautAbrechnungStunden ?? null
    if ("tatsaechlichAusgezahltCent" in changes) row.tatsaechlich_ausgezahlt_cent = changes.tatsaechlichAusgezahltCent ?? null
    const { data, error } = await supabase
      .from("abgleich").update(row).eq("id", id).select().single()
    if (error) throw error
    return toAbgleich(data as AbgleichRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("abgleich").delete().eq("id", id)
    if (error) throw error
  }
}
