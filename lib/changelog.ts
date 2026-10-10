import type { UiStrings } from "./i18n"
import { APP_VERSION } from "./brand"

export interface ChangelogEintrag {
  version: string
  date: string
  itemKeys: Array<keyof UiStrings>
}

export const CHANGELOG: ChangelogEintrag[] = [
  {
    version: "2.1.0",
    date: "2026-10-10",
    itemKeys: [
      "UPD_2_1_0_ITEM1",
      "UPD_2_1_0_ITEM2",
      "UPD_2_1_0_ITEM3",
      "UPD_2_1_0_ITEM4",
      "UPD_2_1_0_ITEM5",
      "UPD_2_1_0_ITEM6",
      "UPD_2_1_0_ITEM7",
      "UPD_2_1_0_ITEM9",
    ],
  },
  {
    version: "2.0",
    date: "2026-10-07",
    itemKeys: [
      "UPD_2_0_ITEM1",
      "UPD_2_0_ITEM2",
      "UPD_2_0_ITEM3",
      "UPD_2_0_ITEM4",
      "UPD_2_0_ITEM5",
      "UPD_2_0_ITEM6",
      "UPD_2_0_ITEM7",
      "UPD_2_0_ITEM8",
      "UPD_2_0_ITEM9",
    ],
  },
]

// Maps legacy date-format version strings (Firestore field written before 2.1.0)
// to their semver equivalents for comparison. Any key not in this map is left as-is.
const LEGACY_VERSION_MAP: Record<string, string> = {
  "2026-10-07-v2": "2.0",
}

function normalisierVersion(v: string): string {
  return LEGACY_VERSION_MAP[v] ?? v
}

function parseVersion(v: string): number[] {
  // Only parse semver-like strings (e.g. "2.0", "2.1.0").
  if (!v || !/^\d+\.\d/.test(v)) return [0]
  return v.split(".").map(Number)
}

function isNewer(entryVersion: string, seenVersion: string): boolean {
  const e = parseVersion(entryVersion)
  const s = parseVersion(seenVersion)
  const len = Math.max(e.length, s.length)
  for (let i = 0; i < len; i++) {
    const ev = e[i] ?? 0
    const sv = s[i] ?? 0
    if (ev > sv) return true
    if (ev < sv) return false
  }
  return false
}

export function getEintraegeZeigen(
  seenVersion: string | undefined,
  changelog: ChangelogEintrag[],
  max = 2,
): ChangelogEintrag[] {
  const normalised = seenVersion !== undefined ? normalisierVersion(seenVersion) : undefined
  if (normalised === APP_VERSION) return []
  return changelog
    .filter((e) => normalised === undefined || isNewer(e.version, normalised))
    .slice(0, max)
}

export type AnzeigeAktion =
  | { aktion: "speichern" }
  | { aktion: "zeigen"; eintraege: ChangelogEintrag[] }
  | { aktion: "nichts" }

/**
 * Pure decision function for UpdateHinweis.
 *
 * "New account" = no stored version AND (no employers yet OR account < 10 min old).
 * Both conditions are passed in as plain values so this stays unit-testable.
 */
export function entscheideAnzeige(
  gespeichert: string | undefined,
  empSnap: { empty: boolean },
  istNeu: boolean,
  changelog: ChangelogEintrag[] = CHANGELOG,
  max = 2,
): AnzeigeAktion {
  if (gespeichert === undefined && (empSnap.empty || istNeu)) {
    return { aktion: "speichern" }
  }
  const eintraege = getEintraegeZeigen(gespeichert, changelog, max)
  if (eintraege.length > 0) return { aktion: "zeigen", eintraege }
  return { aktion: "nichts" }
}
