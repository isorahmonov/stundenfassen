import type { Employer } from "./types"

export function sollCoachmarkZeigen(employers: Employer[], gesehen: boolean): boolean {
  if (gesehen) return false
  const aktive = employers.filter(e => !e.archiviert)
  if (aktive.length < 2) return false
  if (aktive.some(e => e.favorit)) return false
  return true
}
