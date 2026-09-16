export const LOCKED_KEYWORDS = [
  "praktikum", "labor", "übung", "uebung",
  "klausur", "prüfung", "pruefung",
]

/** Löst den Status für einen Termin auf: Titel-Matching schlägt Calendar-Default. */
export function resolveStatus(
  titel: string,
  defaultStatus: "LOCKED" | "FLEXIBLE",
): "LOCKED" | "FLEXIBLE" {
  if (LOCKED_KEYWORDS.some((k) => titel.toLowerCase().includes(k))) return "LOCKED"
  return defaultStatus
}
