import type { Employer } from "@/lib/types"

/** Gibt true, wenn der Einrichtungsdialog für diesen Arbeitgeber automatisch gezeigt werden soll. */
export function sollDialogOeffnen(employer: Employer | null | undefined): boolean {
  if (!employer) return false
  if (employer.verfuegbarkeit?.einrichtungUebersprungen === true) return false
  return employer.verfuegbarkeit?.einrichtungBestaetigt !== true
}

/**
 * Soll auf der letzten UpdateHinweis-Seite "Jetzt einrichten" gezeigt werden?
 * True, wenn mindestens ein Arbeitgeber einrichtungBestaetigt !== true hat.
 */
export function sollEinrichtenZeigen(
  docs: { verfuegbarkeit?: { einrichtungBestaetigt?: boolean } }[],
): boolean {
  if (docs.length === 0) return false
  return docs.some((d) => d.verfuegbarkeit?.einrichtungBestaetigt !== true)
}
