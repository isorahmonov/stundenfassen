// Ampel-Warnungen für gesetzliche/vertragliche Grenzen:
// - Arbeitstage im Kalenderjahr über alle "kurzfristig"-Arbeitgeber
// - Wochenstunden je Werkstudentenjob

import { getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import type { Employer, Shift } from "@/lib/types";
import { nettoMinuten, schichtIntervall } from "@/lib/calc/time";

export type Ampel = "gruen" | "gelb" | "rot";

export const KURZFRISTIG_TAGE_GELB = 60;
export const KURZFRISTIG_TAGE_ROT = 70;
export const WERKSTUDENT_WOCHENSTUNDEN_GELB = 18;
export const WERKSTUDENT_WOCHENSTUNDEN_ROT = 20;

export function ampelFuerSchwelle(wert: number, gelbAb: number, rotAb: number): Ampel {
  if (wert >= rotAb) return "rot";
  if (wert >= gelbAb) return "gelb";
  return "gruen";
}

export interface KurzfristigTageErgebnis {
  tage: number;
  ampel: Ampel;
}

/** Zählt die Arbeitstage im Kalenderjahr über alle Arbeitgeber mit art='kurzfristig'. */
export function zaehleKurzfristigTage(
  shifts: Array<Pick<Shift, "datum" | "employerId">>,
  employers: Array<Pick<Employer, "id" | "art">>,
  jahr: number,
): KurzfristigTageErgebnis {
  // Arbeitstage werden je Arbeitgeber gezählt: mehrere Schichten am selben
  // Tag beim selben Arbeitgeber zählen als ein Arbeitstag, aber derselbe Tag
  // bei zwei verschiedenen kurzfristigen Arbeitgebern zählt zweifach, da es
  // sich um zwei getrennte Beschäftigungsverhältnisse handelt.
  const kurzfristigIds = new Set(employers.filter((e) => e.art === "kurzfristig").map((e) => e.id));
  const tage = new Set<string>();
  for (const shift of shifts) {
    if (!kurzfristigIds.has(shift.employerId)) continue;
    if (parseISO(shift.datum).getFullYear() !== jahr) continue;
    tage.add(`${shift.employerId}|${shift.datum}`);
  }
  return { tage: tage.size, ampel: ampelFuerSchwelle(tage.size, KURZFRISTIG_TAGE_GELB, KURZFRISTIG_TAGE_ROT) };
}

export interface WochenstundenEintrag {
  /** z.B. "2026-W12" */
  kalenderwoche: string;
  minuten: number;
  ampel: Ampel;
}

/** Ermittelt je Kalenderwoche die Netto-Arbeitsstunden eines Werkstudentenjobs. */
export function werkstudentWochenstunden(shifts: Shift[]): WochenstundenEintrag[] {
  const minutenProWoche = new Map<string, number>();
  for (const shift of shifts) {
    const datum = parseISO(shift.datum);
    const kalenderwoche = `${getISOWeekYear(datum)}-W${String(getISOWeek(datum)).padStart(2, "0")}`;
    const minuten = nettoMinuten(schichtIntervall(shift));
    minutenProWoche.set(kalenderwoche, (minutenProWoche.get(kalenderwoche) ?? 0) + minuten);
  }

  return Array.from(minutenProWoche.entries())
    .map(([kalenderwoche, minuten]) => ({
      kalenderwoche,
      minuten,
      ampel: ampelFuerSchwelle(minuten / 60, WERKSTUDENT_WOCHENSTUNDEN_GELB, WERKSTUDENT_WOCHENSTUNDEN_ROT),
    }))
    .sort((a, b) => a.kalenderwoche.localeCompare(b.kalenderwoche));
}
