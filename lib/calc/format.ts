// Deutsche Anzeigeformate. Wird ausschließlich für die Darstellung genutzt,
// alle Berechnungen laufen intern mit Integer-Minuten bzw. -Cent.

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function formatDatum(datum: string | Date): string {
  const date = typeof datum === "string" ? parseISO(datum) : datum;
  return format(date, "dd.MM.yyyy");
}

export function formatWochentag(datum: string | Date, kurz = false): string {
  const date = typeof datum === "string" ? parseISO(datum) : datum;
  return format(date, kurz ? "EEEEEE" : "EEEE", { locale: de });
}

const euroFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatiert Cent als "1.234,56 EUR". */
export function formatEuroCent(cents: number): string {
  return `${euroFormatter.format(cents / 100)} EUR`;
}

const dezimalFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatiert Minuten als Dezimalstunden mit Komma, z.B. "7,75 h". */
export function formatStundenDezimal(minuten: number): string {
  return `${dezimalFormatter.format(minuten / 60)} h`;
}

/** Formatiert Minuten als "H:mm", z.B. "7:45". */
export function formatStundenUhrzeit(minuten: number): string {
  const vorzeichen = minuten < 0 ? "-" : "";
  const absMinuten = Math.round(Math.abs(minuten));
  const stunden = Math.floor(absMinuten / 60);
  const rest = absMinuten % 60;
  return `${vorzeichen}${stunden}:${String(rest).padStart(2, "0")}`;
}
