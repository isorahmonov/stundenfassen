import Holidays from "date-holidays";
import type { Bundesland } from "@/lib/types";

const cache = new Map<Bundesland, Holidays>();

function getHolidaysInstance(bundesland: Bundesland): Holidays {
  let hd = cache.get(bundesland);
  if (!hd) {
    hd = new Holidays("DE", bundesland);
    cache.set(bundesland, hd);
  }
  return hd;
}

/** Gibt den Namen des gesetzlichen Feiertags zurück, falls `date` einer ist, sonst null. */
export function feiertagName(date: Date, bundesland: Bundesland = "BY"): string | null {
  const hd = getHolidaysInstance(bundesland);
  const result = hd.isHoliday(date);
  if (!result) return null;
  const eintraege = Array.isArray(result) ? result : [result];
  const gesetzlich = eintraege.find((e) => e.type === "public") ?? eintraege[0];
  return gesetzlich ? gesetzlich.name : null;
}

export function istFeiertag(date: Date, bundesland: Bundesland = "BY"): boolean {
  return feiertagName(date, bundesland) !== null;
}

export function istSonntag(date: Date): boolean {
  return date.getDay() === 0;
}
