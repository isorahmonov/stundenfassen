import type { Employer } from "./types"

export type ChipState =
  | { mode: "favoriten" }
  | { mode: "alle" }
  | { mode: "ids"; ids: string[] }

export function sortByFavoriten(employers: Employer[]): Employer[] {
  return [...employers].sort((a, b) => {
    const af = a.favorit ?? false
    const bf = b.favorit ?? false
    if (af !== bf) return af ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function getInitialChipState(employers: Employer[], lastUsedId: string | null): ChipState {
  if (employers.some(e => e.favorit)) return { mode: "favoriten" }
  if (lastUsedId && employers.some(e => e.id === lastUsedId)) return { mode: "ids", ids: [lastUsedId] }
  return { mode: "alle" }
}

export function getInitialSingleEmployerId(employers: Employer[], lastUsedId: string | null): string | null {
  const firstFavorit = employers.find(e => e.favorit)
  if (firstFavorit) return firstFavorit.id
  if (lastUsedId && employers.some(e => e.id === lastUsedId)) return lastUsedId
  return employers[0]?.id ?? null
}

export function cleanDeadIds(ids: string[], employers: Employer[]): string[] {
  const validIds = new Set(employers.map(e => e.id))
  return ids.filter(id => validIds.has(id))
}
