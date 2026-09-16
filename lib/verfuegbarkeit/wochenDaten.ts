/** Snap-Datum auf den Sonntag der TK-Maxx-Woche (Sonntag = Wochenbeginn) */
export function snapZuSonntag(datum: Date): Date {
  const d = new Date(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()) // getUTCDay() 0 = Sonntag
  return d
}

/** ISO-Datumsstring "YYYY-MM-DD" aus einem UTC-Date */
export function toISODatum(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Gibt die Wochen als Arrays von 7 Datumsstrings (So–Sa) zurück.
 * startSonntagStr muss ein Sonntag sein.
 */
export function wochenDaten(startSonntagStr: string, anzahlWochen: number): string[][] {
  const result: string[][] = []
  const basis = new Date(startSonntagStr + "T00:00:00Z")
  for (let w = 0; w < anzahlWochen; w++) {
    const woche: string[] = []
    for (let d = 0; d < 7; d++) {
      const tag = new Date(basis)
      tag.setUTCDate(basis.getUTCDate() + w * 7 + d)
      woche.push(toISODatum(tag))
    }
    result.push(woche)
  }
  return result
}

/** Sonntag der laufenden Woche (heute oder früher) */
export function aktuellerSonntagStr(): string {
  return toISODatum(snapZuSonntag(new Date()))
}
