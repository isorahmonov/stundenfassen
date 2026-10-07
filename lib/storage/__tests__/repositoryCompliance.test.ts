/**
 * Typ-Ebene: prüft, dass jede Firestore-Implementierung ihr Interface erfüllt.
 * Kein Firebase-Import nötig — `import type` führt keinen Modulcode aus.
 * Schlägt ein Test fehl, bedeutet das: Methode im Interface deklariert, aber
 * in der Implementierung nicht vorhanden (oder falsche Signatur).
 */
import { describe, it, expectTypeOf } from "vitest"

import type { IShiftRepository } from "../interfaces/IShiftRepository"
import type { IEmployerRepository } from "../interfaces/IEmployerRepository"
import type { IAbgleichRepository } from "../interfaces/IAbgleichRepository"
import type { IGeplanteSchichtRepository } from "../interfaces/IGeplanteSchichtRepository"
import type { IMinusEintragRepository } from "../interfaces/IMinusEintragRepository"
import type { IEmailVorlageRepository } from "../interfaces/IEmailVorlageRepository"
import type { ISettingsRepository } from "../interfaces/ISettingsRepository"

import type { ShiftRepository } from "../firestore/ShiftRepository"
import type { EmployerRepository } from "../firestore/EmployerRepository"
import type { AbgleichRepository } from "../firestore/AbgleichRepository"
import type { GeplanteSchichtRepository } from "../firestore/GeplanteSchichtRepository"
import type { MinusEintragRepository } from "../firestore/MinusEintragRepository"
import type { EmailVorlageRepository } from "../firestore/EmailVorlageRepository"
import type { SettingsRepository } from "../firestore/SettingsRepository"

describe("Repository interface compliance (Typ-Ebene, kein Runtime)", () => {
  it("ShiftRepository implementiert IShiftRepository vollständig", () => {
    expectTypeOf<ShiftRepository>().toMatchTypeOf<IShiftRepository>()
  })
  it("EmployerRepository implementiert IEmployerRepository vollständig", () => {
    expectTypeOf<EmployerRepository>().toMatchTypeOf<IEmployerRepository>()
  })
  it("AbgleichRepository implementiert IAbgleichRepository vollständig", () => {
    expectTypeOf<AbgleichRepository>().toMatchTypeOf<IAbgleichRepository>()
  })
  it("GeplanteSchichtRepository implementiert IGeplanteSchichtRepository vollständig", () => {
    expectTypeOf<GeplanteSchichtRepository>().toMatchTypeOf<IGeplanteSchichtRepository>()
  })
  it("MinusEintragRepository implementiert IMinusEintragRepository vollständig", () => {
    expectTypeOf<MinusEintragRepository>().toMatchTypeOf<IMinusEintragRepository>()
  })
  it("EmailVorlageRepository implementiert IEmailVorlageRepository vollständig", () => {
    expectTypeOf<EmailVorlageRepository>().toMatchTypeOf<IEmailVorlageRepository>()
  })
  it("SettingsRepository implementiert ISettingsRepository vollständig", () => {
    expectTypeOf<SettingsRepository>().toMatchTypeOf<ISettingsRepository>()
  })
})
