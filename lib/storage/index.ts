export type {
  IEmployerRepository,
  EmployerInput,
  EmployerUpdate,
} from "./interfaces/IEmployerRepository";
export type {
  IShiftRepository,
  ShiftInput,
  ShiftUpdate,
} from "./interfaces/IShiftRepository";
export type { ISettingsRepository, SettingsInput } from "./interfaces/ISettingsRepository";
export type {
  IAbgleichRepository,
  AbgleichInput,
  AbgleichUpdate,
} from "./interfaces/IAbgleichRepository";

export { EmployerRepository } from "./supabase/EmployerRepository";
export { ShiftRepository } from "./supabase/ShiftRepository";
export { SettingsRepository } from "./supabase/SettingsRepository";
export { AbgleichRepository } from "./supabase/AbgleichRepository";

import { EmployerRepository } from "./supabase/EmployerRepository";
import { ShiftRepository } from "./supabase/ShiftRepository";
import { SettingsRepository } from "./supabase/SettingsRepository";
import { AbgleichRepository } from "./supabase/AbgleichRepository";

export const employers = new EmployerRepository();
export const shifts = new ShiftRepository();
export const settings = new SettingsRepository();
export const abgleich = new AbgleichRepository();
