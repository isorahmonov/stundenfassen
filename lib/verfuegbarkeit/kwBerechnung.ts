/**
 * TK-Maxx-Geschäftswoche: Sonntag–Samstag, Nummerierung ab einem
 * jährlich konfigurierbaren Anker-Sonntag (kwAnker aus den Einstellungen).
 *
 * Niemals getISOWeek() oder andere Standard-KW-Funktionen verwenden —
 * TK Maxx richtet sich nicht nach ISO 8601.
 */

export function tkWoche(datum: string, kwAnker: string): number {
  const tag = sonntagDerWoche(parseDatum(datum))
  const anker = parseDatum(kwAnker)
  const diffTage = Math.round((tag.getTime() - anker.getTime()) / 86_400_000)
  return Math.floor(diffTage / 7) + 1
}

function parseDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function sonntagDerWoche(d: Date): Date {
  const tagInWoche = d.getUTCDay() // 0 = So, 1 = Mo, …, 6 = Sa
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - tagInWoche))
}
