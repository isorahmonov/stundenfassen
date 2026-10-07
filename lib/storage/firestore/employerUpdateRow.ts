// Reine Funktion ohne Firebase-Import — direkt testbar.
import type { EmployerUpdate } from "../interfaces/IEmployerRepository"
import type { EmployerDoc } from "./shared"

/** Baut das Firestore-Update-Objekt aus einem EmployerUpdate. Exportiert für Tests. */
export function buildUpdateRow(changes: EmployerUpdate): Partial<EmployerDoc> {
  const row: Partial<EmployerDoc> = {}
  if (changes.name !== undefined) row.name = changes.name
  if (changes.farbe !== undefined) row.farbe = changes.farbe
  if (changes.art !== undefined) row.art = changes.art
  if (changes.bundesland !== undefined) row.bundesland = changes.bundesland
  if (changes.stundenlohnCent !== undefined) row.stundenlohnCent = changes.stundenlohnCent
  if (changes.zuschlagSonntagProzent !== undefined) row.zuschlagSonntagProzent = changes.zuschlagSonntagProzent
  if (changes.zuschlagFeiertagProzent !== undefined) row.zuschlagFeiertagProzent = changes.zuschlagFeiertagProzent
  if (changes.zuschlagNachtProzent !== undefined) row.zuschlagNachtProzent = changes.zuschlagNachtProzent
  if (changes.archiviert !== undefined) row.archiviert = changes.archiviert ?? false
  if (changes.minusImPDFAnzeigen !== undefined) row.minusImPDFAnzeigen = changes.minusImPDFAnzeigen
  if (changes.personalnummer !== undefined) row.personalnummer = changes.personalnummer || undefined
  if (changes.verfuegbarkeit !== undefined) row.verfuegbarkeit = changes.verfuegbarkeit
  return row
}
