// Pausenregel nach § 4 ArbZG:
// - Arbeitszeit > 6 bis 9 Stunden: mind. 30 Minuten Pause
// - Arbeitszeit > 9 Stunden: mind. 45 Minuten Pause (insgesamt)
// - Arbeitszeit <= 6 Stunden: keine Pause vorgeschrieben

export interface PausenCheck {
  /** In der Schicht vorgeschriebene Mindestpause in Minuten (0, 30 oder 45). */
  erforderlicheMinuten: number;
  tatsaechlicheMinuten: number;
  ausreichend: boolean;
}

export function erforderlichePauseMinuten(bruttoMinuten: number): number {
  if (bruttoMinuten > 9 * 60) return 45;
  if (bruttoMinuten > 6 * 60) return 30;
  return 0;
}

export function pruefePause(bruttoMinuten: number, tatsaechlicheMinuten: number): PausenCheck {
  const erforderlicheMinuten = erforderlichePauseMinuten(bruttoMinuten);
  return {
    erforderlicheMinuten,
    tatsaechlicheMinuten,
    ausreichend: tatsaechlicheMinuten >= erforderlicheMinuten,
  };
}
