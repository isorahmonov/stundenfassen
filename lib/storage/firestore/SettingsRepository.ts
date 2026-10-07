import { getDoc, setDoc } from "firebase/firestore"
import type { Settings } from "@/lib/types"
import type { ISettingsRepository, SettingsInput } from "../interfaces/ISettingsRepository"
import { userDoc, toSettings, type SettingsDoc } from "./shared"

export class SettingsRepository implements ISettingsRepository {
  async get(): Promise<Settings | undefined> {
    const snap = await getDoc(userDoc("settings", "default"))
    return snap.exists() ? toSettings(snap.data() as SettingsDoc) : undefined
  }

  async save(input: SettingsInput): Promise<Settings> {
    const data: SettingsDoc = {
      steuerklasse: input.steuerklasse,
      kirchensteuer: input.kirchensteuer,
    }
    await setDoc(userDoc("settings", "default"), data, { merge: true })
    return toSettings(data)
  }
}
