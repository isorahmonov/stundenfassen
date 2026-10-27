import type { Employer, MinusEintrag } from "@/lib/types"

/**
 * Minusstunden-Einträge, die im Verfügbarkeits-PDF (Download und E-Mail-Versand)
 * gezeigt werden sollen. Respektiert den Pro-Arbeitgeber-Schalter
 * `minusImPDFAnzeigen` — derselbe Schalter, den MonatsPDF bereits inline prüft
 * (`employer.minusImPDFAnzeigen !== false`). Default (undefined/kein Arbeitgeber)
 * ist Anzeigen, analog zum MonatsPDF-Verhalten.
 */
export function sichtbareMinusEintraege(
  employer: Employer | null | undefined,
  alle: MinusEintrag[],
): MinusEintrag[] {
  if (employer?.minusImPDFAnzeigen === false) return []
  return alle
}
