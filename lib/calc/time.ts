// Zeitberechnung für Schichten: Auflösung von HH:mm-Uhrzeiten zu konkreten
// Zeitpunkten inkl. Unterstützung für Mitternachtsübergänge.

import { addDays, addMinutes, differenceInMinutes, parseISO, startOfDay } from "date-fns";
import type { Shift } from "@/lib/types";

export function minutesSinceMidnight(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Löst eine "HH:mm"-Uhrzeit relativ zum Schichtstart auf. Liegt die Uhrzeit
 * (in Minuten seit Mitternacht) vor der Startzeit, wird angenommen, dass sie
 * am Folgetag liegt (Mitternachtsübergang).
 */
export function resolveTimestamp(datum: string, time: string, startMinutes: number): Date {
  let minutes = minutesSinceMidnight(time);
  if (minutes < startMinutes) {
    minutes += 24 * 60;
  }
  return addMinutes(startOfDay(parseISO(datum)), minutes);
}

export interface SchichtIntervall {
  start: Date;
  ende: Date;
  pauseVon?: Date;
  pauseBis?: Date;
}

export function schichtIntervall(shift: Pick<Shift, "datum" | "start" | "ende" | "pauseVon" | "pauseBis">): SchichtIntervall {
  const startMinutes = minutesSinceMidnight(shift.start);
  const start = resolveTimestamp(shift.datum, shift.start, startMinutes);
  const ende = resolveTimestamp(shift.datum, shift.ende, startMinutes);

  let pauseVon: Date | undefined;
  let pauseBis: Date | undefined;
  if (shift.pauseVon && shift.pauseBis) {
    pauseVon = resolveTimestamp(shift.datum, shift.pauseVon, startMinutes);
    pauseBis = resolveTimestamp(shift.datum, shift.pauseBis, startMinutes);
  }

  return { start, ende, pauseVon, pauseBis };
}

/** Die Zeitspannen, in denen tatsächlich gearbeitet wird (Schicht minus Pause). */
export function arbeitsIntervalle(intervall: SchichtIntervall): Array<{ start: Date; ende: Date }> {
  if (!intervall.pauseVon || !intervall.pauseBis) {
    return [{ start: intervall.start, ende: intervall.ende }];
  }
  return [
    { start: intervall.start, ende: intervall.pauseVon },
    { start: intervall.pauseBis, ende: intervall.ende },
  ];
}

export function pauseMinuten(intervall: SchichtIntervall): number {
  if (!intervall.pauseVon || !intervall.pauseBis) return 0;
  return differenceInMinutes(intervall.pauseBis, intervall.pauseVon);
}

/** Bruttoarbeitszeit = Zeitspanne zwischen Beginn und Ende, inkl. Pause. */
export function bruttoMinuten(intervall: SchichtIntervall): number {
  return differenceInMinutes(intervall.ende, intervall.start);
}

/** Nettoarbeitszeit = Bruttoarbeitszeit abzüglich Pause. */
export function nettoMinuten(intervall: SchichtIntervall): number {
  return bruttoMinuten(intervall) - pauseMinuten(intervall);
}

export function addTage(date: Date, tage: number): Date {
  return addDays(date, tage);
}
