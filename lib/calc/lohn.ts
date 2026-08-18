// Brutto-Berechnung aus Arbeitszeit und Zuschlagsstunden.
// Alle Beträge werden als Integer-Cent berechnet, Rundung erst am Ende
// jeder Position (nicht zwischendurch), Formatierung erfolgt erst bei der Anzeige.

import type { Employer, Shift } from "@/lib/types";
import { nettoMinuten, schichtIntervall } from "@/lib/calc/time";
import { berechneZuschlagsminuten, type Zuschlagsminuten } from "@/lib/calc/zuschlaege";

/**
 * Cent-Betrag für `minuten` Arbeitszeit zum angegebenen Prozentsatz des
 * Stundenlohns (Standard 100% = normaler Lohn). Für Zuschläge wird hier nur
 * der zusätzliche Prozentsatz übergeben (z.B. 50 für 50% Sonntagszuschlag),
 * da die Basisvergütung für dieselben Minuten bereits separat berechnet wird.
 */
export function centsFuerMinuten(stundenlohnCent: number, minuten: number, prozent = 100): number {
  return Math.round((stundenlohnCent * minuten * prozent) / 6000);
}

export interface SchichtBerechnung {
  nettoMinuten: number;
  zuschlagsminuten: Zuschlagsminuten;
  bruttoCent: number;
}

export function berechneSchicht(shift: Shift, employer: Employer): SchichtBerechnung {
  const intervall = schichtIntervall(shift);
  const netto = nettoMinuten(intervall);
  const zuschlagsminuten = berechneZuschlagsminuten(intervall);

  const bruttoCent =
    centsFuerMinuten(employer.stundenlohnCent, netto) +
    centsFuerMinuten(employer.stundenlohnCent, zuschlagsminuten.sonntagMinuten, employer.zuschlagSonntagProzent) +
    centsFuerMinuten(employer.stundenlohnCent, zuschlagsminuten.feiertagMinuten, employer.zuschlagFeiertagProzent) +
    centsFuerMinuten(employer.stundenlohnCent, zuschlagsminuten.nachtMinuten, employer.zuschlagNachtProzent);

  return { nettoMinuten: netto, zuschlagsminuten, bruttoCent };
}
