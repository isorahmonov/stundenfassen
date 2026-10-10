// Pure, unit-testbare Fenster-Zähler-Entscheidung (gleiche Form wie das
// Rate-Limit in app/api/konto/loeschen/route.ts, aber ohne Firestore, damit
// sie testbar bleibt). Der Aufrufer persistiert `aktualisiert`.

export const VERIFY_LIMIT = 5
export const VERIFY_FENSTER_MS = 60 * 60 * 1000 // 1 Stunde

/**
 * Entscheidet anhand der bisherigen Zeitstempel, ob ein weiterer Versuch im
 * Zeitfenster erlaubt ist. Gibt die bereinigte, ggf. um `jetzt` ergänzte Liste
 * zurück, die der Aufrufer speichert.
 */
export function rateLimitEntscheidung(
  bisherige: number[],
  jetzt: number,
  limit: number = VERIFY_LIMIT,
  fensterMs: number = VERIFY_FENSTER_MS,
): { erlaubt: boolean; aktualisiert: number[] } {
  const imFenster = bisherige.filter((t) => t > jetzt - fensterMs)
  if (imFenster.length >= limit) return { erlaubt: false, aktualisiert: imFenster }
  return { erlaubt: true, aktualisiert: [...imFenster, jetzt] }
}
