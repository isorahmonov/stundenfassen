/**
 * User-visible string constants — structured for Part 4 i18n (DE/EN/RU).
 * Each key maps to a translation entry. Never inline these strings in components.
 */
export const STRINGS = {
  LAEDT: "Lade…",
  ERNEUT_VERSUCHEN: "Erneut versuchen",
  KEIN_ARBEITGEBER_TITEL: "Kein Arbeitgeber angelegt",
  KEIN_ARBEITGEBER_TEXT: "Lege zuerst einen Arbeitgeber an, um diese Seite zu nutzen.",
  KEIN_ARBEITGEBER_CTA: "Arbeitgeber anlegen →",
  LADE_FEHLER_PREFIX: "Fehler:",
  AUTH_LAEDT_FEHLER: "Anmeldung dauert zu lange — App neu laden.",
  AUTH_NEU_LADEN: "App neu laden",
} as const
