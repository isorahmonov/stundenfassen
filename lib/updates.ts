export interface UpdatePage {
  kicker: string
  title: string
  /** Fließtext (Seite 1) */
  text?: string
  /** Aufzählung (Seite 2) */
  points?: string[]
}

export const CURRENT_UPDATE: { version: string; pages: UpdatePage[] } = {
  version: "2026-10-07-v2",
  pages: [
    {
      kicker: "VERSION 2.0",
      title: "Die App richtet sich jetzt nach dir",
      text: "Du kannst jetzt für jeden Arbeitgeber genau festlegen, wann du verfügbar bist. Beim ersten Öffnen fragt dich die App einmal nach deinen Einstellungen — danach läuft alles automatisch.",
    },
    {
      kicker: "NEU",
      title: "Neue Funktionen",
      points: [
        "Verfügbarkeit pro Arbeitgeber einrichten: Wochentage, früheste und späteste Zeit, Mindestdauer, Wegezeiten",
        "Feste Zeiten sperren, z. B. Gebetszeit, Uni oder Lerngruppe",
        "Dein Name im PDF: du legst selbst fest, was im Kopf steht",
        "Feiertage nach Bundesland des Arbeitgebers",
        "Verfügbarkeit per E-Mail senden, mit Vorlagen und CC",
        "Minusstunden pro Arbeitgeber, wahlweise im PDF",
        "Lohnsteuer pauschal pro Arbeitgeber (bei kurzfristiger Beschäftigung)",
        "Kalender lädt schneller und aktualisiert sich beim Zurückkehren in die App",
        "Abmelden im Profil-Tab",
      ],
    },
  ],
}
