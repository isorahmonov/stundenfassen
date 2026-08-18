// Berechnung der Zuschlagsstunden (Sonntag, Feiertag, Nacht) für eine Schicht.
//
// Alle drei Kategorien werden unabhängig voneinander ermittelt und können
// sich überschneiden (z.B. eine Stunde in der Nacht von Sonntag auf einen
// Feiertag zählt in allen drei Kategorien). Das entspricht der Praxis, dass
// Zuschläge für dieselbe Arbeitsstunde kumulieren können.

import { addDays, addHours, differenceInMinutes, startOfDay } from "date-fns";
import type { Bundesland } from "@/lib/types";
import { arbeitsIntervalle, type SchichtIntervall } from "@/lib/calc/time";
import { istFeiertag, istSonntag } from "@/lib/calc/holidays";

export interface Zuschlagsminuten {
  sonntagMinuten: number;
  feiertagMinuten: number;
  nachtMinuten: number;
}

const NACHT_START_STUNDE = 20;
const NACHT_ENDE_STUNDE = 6;

function ueberlappungMinuten(aStart: Date, aEnde: Date, bStart: Date, bEnde: Date): number {
  const start = aStart > bStart ? aStart : bStart;
  const ende = aEnde < bEnde ? aEnde : bEnde;
  return ende > start ? differenceInMinutes(ende, start) : 0;
}

/** Nachtstunden (20-06 Uhr) innerhalb eines gearbeiteten Zeitintervalls. */
function nachtMinutenInIntervall(start: Date, ende: Date): number {
  let total = 0;
  // Eine Nacht beginnt am Vortag des Intervallstarts, um das nächtliche
  // Fenster, das den Intervallbeginn evtl. schon abdeckt, nicht zu verpassen.
  let tag = addDays(startOfDay(start), -1);
  while (tag <= ende) {
    const nachtStart = addHours(tag, NACHT_START_STUNDE);
    const nachtEnde = addHours(addDays(tag, 1), NACHT_ENDE_STUNDE);
    total += ueberlappungMinuten(start, ende, nachtStart, nachtEnde);
    tag = addDays(tag, 1);
  }
  return total;
}

/** Zerlegt gearbeitete Intervalle in Minuten pro Kalendertag (00:00-24:00). */
function minutenProKalendertag(intervalle: Array<{ start: Date; ende: Date }>): Map<number, number> {
  const result = new Map<number, number>();
  for (const { start, ende } of intervalle) {
    let cursor = startOfDay(start);
    while (cursor < ende) {
      const tagEnde = addDays(cursor, 1);
      const minuten = ueberlappungMinuten(start, ende, cursor, tagEnde);
      if (minuten > 0) {
        const key = cursor.getTime();
        result.set(key, (result.get(key) ?? 0) + minuten);
      }
      cursor = tagEnde;
    }
  }
  return result;
}

export function berechneZuschlagsminuten(
  intervall: SchichtIntervall,
  bundesland: Bundesland = "BY",
): Zuschlagsminuten {
  const arbeitsintervalle = arbeitsIntervalle(intervall);

  let nachtMinuten = 0;
  for (const { start, ende } of arbeitsintervalle) {
    nachtMinuten += nachtMinutenInIntervall(start, ende);
  }

  const proTag = minutenProKalendertag(arbeitsintervalle);
  let sonntagMinuten = 0;
  let feiertagMinuten = 0;
  for (const [zeitstempel, minuten] of proTag) {
    const tag = new Date(zeitstempel);
    if (istSonntag(tag)) sonntagMinuten += minuten;
    if (istFeiertag(tag, bundesland)) feiertagMinuten += minuten;
  }

  return { sonntagMinuten, feiertagMinuten, nachtMinuten };
}
