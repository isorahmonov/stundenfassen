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

export { EmployerRepository } from "./firestore/EmployerRepository";
export { ShiftRepository } from "./firestore/ShiftRepository";
export { SettingsRepository } from "./firestore/SettingsRepository";
export { AbgleichRepository } from "./firestore/AbgleichRepository";

import { EmployerRepository } from "./firestore/EmployerRepository";
import { ShiftRepository } from "./firestore/ShiftRepository";
import { SettingsRepository } from "./firestore/SettingsRepository";
import { AbgleichRepository } from "./firestore/AbgleichRepository";

export const employers = new EmployerRepository();
export const shifts = new ShiftRepository();
export const settings = new SettingsRepository();
export const abgleich = new AbgleichRepository();
