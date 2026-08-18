import { supabase } from "@/lib/supabase/client"
import type { Settings } from "@/lib/types"
import type { ISettingsRepository, SettingsInput } from "../interfaces/ISettingsRepository"
import { toSettings, uid, type SettingsRow } from "./shared"

export class SettingsRepository implements ISettingsRepository {
  async get(): Promise<Settings | undefined> {
    const { data, error } = await supabase
      .from("settings").select("*").eq("id", "default").maybeSingle()
    if (error) throw error
    return data ? toSettings(data as SettingsRow) : undefined
  }

  async save(input: SettingsInput): Promise<Settings> {
    const userId = await uid()
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          id: "default", user_id: userId,
          bundesland: input.bundesland,
          steuerklasse: input.steuerklasse,
          kirchensteuer: input.kirchensteuer,
          kurzfristig_pauschal: input.kurzfristigPauschal,
        },
        { onConflict: "user_id,id" }
      )
      .select().single()
    if (error) throw error
    return toSettings(data as SettingsRow)
  }
}
