// Verantwortlichenangaben für Datenschutz und Impressum.
// Trage hier die echten Werte ein, bevor du deployest.
// Der Vercel-Build schlägt fehl, solange Platzhalter enthalten sind.
export const LEGAL = {
  NAME: "{{NAME}}",
  ANSCHRIFT: "{{ANSCHRIFT}}",
  EMAIL: "{{E-MAIL}}",
} as const

const PLATZHALTER_RE = /\{\{[^}]+\}\}/

export function assertKeinePlatzhalter(): void {
  const fehlend = (Object.entries(LEGAL) as [string, string][]).filter(
    ([, v]) => PLATZHALTER_RE.test(v),
  )
  if (fehlend.length === 0) return

  const namen = fehlend.map(([k]) => k).join(", ")
  const meldung =
    `[Stundenfassen] lib/legal.ts: Platzhalter nicht ersetzt: ${namen}. ` +
    `Trage die echten Werte ein, bevor du deployest.`

  // Auf Vercel: Build-Abbruch — verhindert versehentliches Deployen mit Platzhaltern.
  // VERCEL=1 wird von der Vercel-Build-Umgebung automatisch gesetzt.
  if (process.env.VERCEL === "1") {
    throw new Error(
      `\n${"=".repeat(72)}\nFEHLER: ${meldung}\n${"=".repeat(72)}\n`,
    )
  }

  // Lokal: sichtbare Warnung, damit next build lokal weiterhin als Qualitätsprüfung läuft.
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      `\n${"=".repeat(72)}\nWARNUNG: ${meldung}\n${"=".repeat(72)}\n`,
    )
  }
}
