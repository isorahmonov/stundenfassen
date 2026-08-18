import { supabase } from "@/lib/supabase/client"
import type { Shift } from "@/lib/types"
import type { IShiftRepository, ShiftInput, ShiftUpdate } from "../interfaces/IShiftRepository"
import { toShift, fromShift, uid, type ShiftRow } from "./shared"

function monatRange(monat: number, jahr: number): [string, string] {
  const mm = String(monat).padStart(2, "0")
  return [`${jahr}-${mm}-01`, `${jahr}-${mm}-31`]
}

export class ShiftRepository implements IShiftRepository {
  async findById(id: string): Promise<Shift | undefined> {
    const { data, error } = await supabase.from("shifts").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? toShift(data as ShiftRow) : undefined
  }

  async findAlle(): Promise<Shift[]> {
    const { data, error } = await supabase.from("shifts").select("*").order("datum")
    if (error) throw error
    return (data as ShiftRow[]).map(toShift)
  }

  async findByMonat(monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr)
    const { data, error } = await supabase
      .from("shifts").select("*")
      .gte("datum", start).lte("datum", end)
      .order("datum")
    if (error) throw error
    return (data as ShiftRow[]).map(toShift)
  }

  async findByEmployer(employerId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from("shifts").select("*")
      .eq("employer_id", employerId)
      .order("datum", { ascending: false })
    if (error) throw error
    return (data as ShiftRow[]).map(toShift)
  }

  async findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr)
    const { data, error } = await supabase
      .from("shifts").select("*")
      .eq("employer_id", employerId)
      .gte("datum", start).lte("datum", end)
      .order("datum")
    if (error) throw error
    return (data as ShiftRow[]).map(toShift)
  }

  async add(input: ShiftInput): Promise<Shift> {
    const userId = await uid()
    const { data, error } = await supabase
      .from("shifts")
      .insert({ id: crypto.randomUUID(), ...fromShift(input, userId) })
      .select().single()
    if (error) throw error
    return toShift(data as ShiftRow)
  }

  async update(id: string, changes: ShiftUpdate): Promise<Shift | undefined> {
    const row: Record<string, unknown> = {}
    if (changes.datum !== undefined) row.datum = changes.datum
    if (changes.start !== undefined) row.start_uhr = changes.start
    if (changes.ende !== undefined) row.ende_uhr = changes.ende
    if ("pauseVon" in changes) row.pause_von = changes.pauseVon ?? null
    if ("pauseBis" in changes) row.pause_bis = changes.pauseBis ?? null
    if ("notiz" in changes) row.notiz = changes.notiz ?? null
    const { data, error } = await supabase
      .from("shifts").update(row).eq("id", id).select().single()
    if (error) throw error
    return toShift(data as ShiftRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("shifts").delete().eq("id", id)
    if (error) throw error
  }
}
