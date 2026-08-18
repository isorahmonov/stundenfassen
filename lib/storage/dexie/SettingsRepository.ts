import type { Settings } from "@/lib/types";
import type { ISettingsRepository, SettingsInput } from "../interfaces/ISettingsRepository";
import type { StundenDb } from "./StundenDb";

const SETTINGS_ID = "default";

export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly db: StundenDb) {}

  get(): Promise<Settings | undefined> {
    return this.db.settings.get(SETTINGS_ID);
  }

  async save(input: SettingsInput): Promise<Settings> {
    const settings: Settings = { ...input, id: SETTINGS_ID };
    await this.db.settings.put(settings);
    return settings;
  }
}
