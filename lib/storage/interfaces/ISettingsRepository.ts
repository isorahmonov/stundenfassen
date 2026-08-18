import type { Settings } from "@/lib/types";

export type SettingsInput = Omit<Settings, "id">;

export interface ISettingsRepository {
  get(): Promise<Settings | undefined>;
  save(settings: SettingsInput): Promise<Settings>;
}
