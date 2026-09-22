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
export type {
  IGeplanteSchichtRepository,
  GeplanteSchichtInput,
  GeplanteSchichtUpdate,
} from "./interfaces/IGeplanteSchichtRepository";
export type {
  IMinusEintragRepository,
  MinusEintragInput,
  MinusEintragUpdate,
} from "./interfaces/IMinusEintragRepository";

export { EmployerRepository } from "./firestore/EmployerRepository";
export { ShiftRepository } from "./firestore/ShiftRepository";
export { SettingsRepository } from "./firestore/SettingsRepository";
export { AbgleichRepository } from "./firestore/AbgleichRepository";
export { GeplanteSchichtRepository } from "./firestore/GeplanteSchichtRepository";
export { MinusEintragRepository } from "./firestore/MinusEintragRepository";

import { EmployerRepository } from "./firestore/EmployerRepository";
import { ShiftRepository } from "./firestore/ShiftRepository";
import { SettingsRepository } from "./firestore/SettingsRepository";
import { AbgleichRepository } from "./firestore/AbgleichRepository";
import { GeplanteSchichtRepository } from "./firestore/GeplanteSchichtRepository";
import { MinusEintragRepository } from "./firestore/MinusEintragRepository";

export const employers = new EmployerRepository();
export const shifts = new ShiftRepository();
export const settings = new SettingsRepository();
export const abgleich = new AbgleichRepository();
export const geplanteSchichten = new GeplanteSchichtRepository();
export const minusEintraege = new MinusEintragRepository();
