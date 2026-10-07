import type { Employer } from "@/lib/types"

/** Gibt true, wenn der Einrichtungsdialog für diesen Arbeitgeber gezeigt werden soll. */
export function sollDialogOeffnen(employer: Employer | null | undefined): boolean {
  if (!employer) return false
  return employer.verfuegbarkeit?.einrichtungBestaetigt !== true
}
