// Monatsaggregation je Arbeitgeber sowie Soll-Ist-Abgleich.

import type { Abgleich, Employer, Settings, Shift } from "@/lib/types";
import { berechneSchicht } from "@/lib/calc/lohn";
import { schaetzeNetto } from "@/config/lohn";
import type { Ampel } from "@/lib/calc/warnings";

function istImMonat(datum: string, jahr: number, monat: number): boolean {
  const [y, m] = datum.split("-").map(Number);
  return y === jahr && m === monat;
}

export function filterShiftsFuerMonat(shifts: Shift[], employerId: string, jahr: number, monat: number): Shift[] {
  return shifts.filter((s) => s.employerId === employerId && istImMonat(s.datum, jahr, monat));
}

export interface MonatsSumme {
  nettoMinuten: number;
  bruttoCent: number;
  nettoGeschaetztCent: number;
  sonntagMinuten: number;
  feiertagMinuten: number;
  nachtMinuten: number;
  anzahlSchichten: number;
}

export function berechneMonatsSumme(
  shifts: Shift[],
  employer: Employer,
  settings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">,
): MonatsSumme {
  let nettoMinuten = 0;
  let bruttoCent = 0;
  let sonntagMinuten = 0;
  let feiertagMinuten = 0;
  let nachtMinuten = 0;

  for (const shift of shifts) {
    const berechnung = berechneSchicht(shift, employer);
    nettoMinuten += berechnung.nettoMinuten;
    bruttoCent += berechnung.bruttoCent;
    sonntagMinuten += berechnung.zuschlagsminuten.sonntagMinuten;
    feiertagMinuten += berechnung.zuschlagsminuten.feiertagMinuten;
    nachtMinuten += berechnung.zuschlagsminuten.nachtMinuten;
  }

  const { nettoCent } = schaetzeNetto(bruttoCent, employer.art, settings);

  return {
    nettoMinuten,
    bruttoCent,
    nettoGeschaetztCent: nettoCent,
    sonntagMinuten,
    feiertagMinuten,
    nachtMinuten,
    anzahlSchichten: shifts.length,
  };
}

// Schwellenwerte für die Ampelfarbe im Soll-Ist-Abgleich. Bewusst als
// benannte Konstanten, damit sie sich leicht anpassen lassen.
export const ABGLEICH_STUNDEN_GELB_AB = 0.25; // 15 Minuten Abweichung
export const ABGLEICH_STUNDEN_ROT_AB = 1; // 1 Stunde Abweichung
export const ABGLEICH_CENT_GELB_AB = 500; // 5 EUR Abweichung
export const ABGLEICH_CENT_ROT_AB = 2000; // 20 EUR Abweichung

export interface AbgleichErgebnis {
  differenzStunden: number | null;
  differenzCent: number | null;
  ampelStunden: Ampel;
  ampelBetrag: Ampel;
}

function ampelFuerAbweichung(abweichung: number, gelbAb: number, rotAb: number): Ampel {
  const abs = Math.abs(abweichung);
  if (abs >= rotAb) return "rot";
  if (abs >= gelbAb) return "gelb";
  return "gruen";
}

/** Vergleicht die eigene Erfassung (Ist) mit den Werten laut Abrechnung (Soll). */
export function vergleicheAbgleich(
  monatsSumme: Pick<MonatsSumme, "nettoMinuten" | "nettoGeschaetztCent">,
  abgleich: Pick<Abgleich, "lautAbrechnungStunden" | "tatsaechlichAusgezahltCent">,
): AbgleichErgebnis {
  const erfassteStunden = monatsSumme.nettoMinuten / 60;

  const differenzStunden =
    abgleich.lautAbrechnungStunden === undefined
      ? null
      : abgleich.lautAbrechnungStunden - erfassteStunden;

  const differenzCent =
    abgleich.tatsaechlichAusgezahltCent === undefined
      ? null
      : abgleich.tatsaechlichAusgezahltCent - monatsSumme.nettoGeschaetztCent;

  return {
    differenzStunden,
    differenzCent,
    ampelStunden:
      differenzStunden === null
        ? "gruen"
        : ampelFuerAbweichung(differenzStunden, ABGLEICH_STUNDEN_GELB_AB, ABGLEICH_STUNDEN_ROT_AB),
    ampelBetrag:
      differenzCent === null
        ? "gruen"
        : ampelFuerAbweichung(differenzCent, ABGLEICH_CENT_GELB_AB, ABGLEICH_CENT_ROT_AB),
  };
}
