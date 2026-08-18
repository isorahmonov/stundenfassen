// Netto-Schätzung für Studentenjobs (Stand 2026, grobe Näherung).
//
// WICHTIG: Das hier ist nur eine grobe Schätzung für die eigene Übersicht.
// Maßgeblich ist immer die tatsächliche Lohnabrechnung des Arbeitgebers.
// Diese Datei ist bewusst einfach gehalten und leicht anzupassen, falls
// sich Beitragssätze oder Freigrenzen ändern.

import type { EmployerArt, Settings } from "@/lib/types";

/** Rentenversicherungsbeitrag Arbeitnehmeranteil (Stand 2026, ca. 9,3%). */
export const RV_BEITRAG_PROZENT_WERKSTUDENT = 9.3;

/** Pauschale Lohnsteuer für kurzfristige Beschäftigung (§40a Abs. 1 EStG). */
export const PAUSCHALSTEUER_KURZFRISTIG_PROZENT = 25;

/**
 * Sehr grobe Näherung der Lohnsteuer nach Steuerklasse für Studentenjobs.
 * Reale Berechnung folgt der Lohnsteuertabelle und ist progressiv; hier wird
 * bewusst ein einfacher Pauschalsatz je Steuerklasse verwendet, weil bei
 * Studentenjobs unterhalb des Grundfreibetrags ohnehin oft 0% anfallen und
 * die genaue Abrechnung durch den Arbeitgeber erfolgt.
 */
export const LOHNSTEUER_PAUSCHALSATZ_PROZENT: Record<Settings["steuerklasse"], number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 14,
  6: 20,
};

export const KIRCHENSTEUER_PROZENT_VOM_LOHNSTEUER = 9;

export interface AbzugErgebnisCent {
  bruttoCent: number;
  rentenversicherungCent: number;
  lohnsteuerCent: number;
  kirchensteuerCent: number;
  nettoCent: number;
}

/**
 * Schätzt die Abzüge für einen Brutto-Betrag abhängig von der Beschäftigungsart.
 * Alle Zwischenwerte in Cent, Rundung erst auf den finalen Cent-Betrag je Position.
 */
export function schaetzeNetto(
  bruttoCent: number,
  art: EmployerArt,
  settings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">,
): AbzugErgebnisCent {
  let rentenversicherungCent = 0;
  let lohnsteuerCent = 0;

  switch (art) {
    case "werkstudent":
      // Werkstudentenprivileg: nur RV-Pflicht, KV/PV/AV frei.
      rentenversicherungCent = Math.round((bruttoCent * RV_BEITRAG_PROZENT_WERKSTUDENT) / 100);
      lohnsteuerCent = Math.round(
        (bruttoCent * LOHNSTEUER_PAUSCHALSATZ_PROZENT[settings.steuerklasse]) / 100,
      );
      break;
    case "kurzfristig":
      // Keine Sozialversicherung. Lohnsteuer entweder pauschal 25% oder nach Steuerklasse.
      rentenversicherungCent = 0;
      lohnsteuerCent = settings.kurzfristigPauschal
        ? Math.round((bruttoCent * PAUSCHALSTEUER_KURZFRISTIG_PROZENT) / 100)
        : Math.round((bruttoCent * LOHNSTEUER_PAUSCHALSATZ_PROZENT[settings.steuerklasse]) / 100);
      break;
    case "minijob":
      // Minijob: keine Abzüge für den Arbeitnehmer.
      rentenversicherungCent = 0;
      lohnsteuerCent = 0;
      break;
    case "sonstiges":
      rentenversicherungCent = 0;
      lohnsteuerCent = Math.round(
        (bruttoCent * LOHNSTEUER_PAUSCHALSATZ_PROZENT[settings.steuerklasse]) / 100,
      );
      break;
  }

  const kirchensteuerCent = settings.kirchensteuer
    ? Math.round((lohnsteuerCent * KIRCHENSTEUER_PROZENT_VOM_LOHNSTEUER) / 100)
    : 0;

  const nettoCent = bruttoCent - rentenversicherungCent - lohnsteuerCent - kirchensteuerCent;

  return {
    bruttoCent,
    rentenversicherungCent,
    lohnsteuerCent,
    kirchensteuerCent,
    nettoCent,
  };
}

export const NETTO_HINWEIS_TEXT =
  "Schätzung – maßgeblich ist die Lohnabrechnung";
