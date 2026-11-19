export const SLOTS_NEU_LS_KEY = "sf_slots_neu_gesehen"
export const SLOTS_NEU_SEIT_LS_KEY = "sf_slots_neu_seit"

const VIERZEHN_TAGE_MS = 14 * 24 * 60 * 60 * 1000

export function sollSlotsNeuZeigen(
  gesehen: boolean,
  istNeuRegistriert: boolean,
  slotsNeuSeit: number | null,
  jetzt: number = Date.now(),
): boolean {
  if (istNeuRegistriert) return false
  if (gesehen) return false
  if (slotsNeuSeit === null) return false
  return jetzt - slotsNeuSeit < VIERZEHN_TAGE_MS
}
