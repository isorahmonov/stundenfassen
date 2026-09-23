// Zentrale Datenmodell-Typen für Arbeitgeber, Schichten und Einstellungen.

export type EmployerArt =
  | "werkstudent"
  | "kurzfristig"
  | "minijob"
  | "sonstiges";

export interface Employer {
  id: string;
  name: string;
  /** Hex-Farbcode, z.B. "#2563eb" */
  farbe: string;
  stundenlohnCent: number;
  art: EmployerArt;
  /** Bundesland für Feiertagsberechnung — gilt für diesen Arbeitgeber */
  bundesland: Bundesland;
  /** Prozentsatz, z.B. 50 für 50% */
  zuschlagSonntagProzent: number;
  zuschlagFeiertagProzent: number;
  zuschlagNachtProzent: number;
  /** Bei Kündigung/Beendigung gesetzt, sonst nicht vorhanden -> weiterhin aktiv */
  archiviert?: boolean;
}

export interface Shift {
  id: string;
  employerId: string;
  /** ISO-Datum des Schichtbeginns, z.B. "2026-08-18" */
  datum: string;
  /** Uhrzeit "HH:mm" */
  start: string;
  pauseVon?: string;
  pauseBis?: string;
  /** Uhrzeit "HH:mm"; liegt sie vor `start`, wird ein Mitternachtsübergang angenommen */
  ende: string;
  notiz?: string;
}

export type Bundesland =
  | "BW"
  | "BY"
  | "BE"
  | "BB"
  | "HB"
  | "HH"
  | "HE"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SL"
  | "SN"
  | "ST"
  | "SH"
  | "TH";

export type Steuerklasse = 1 | 2 | 3 | 4 | 5 | 6;

export interface Settings {
  id: string;
  bundesland: Bundesland;
  steuerklasse: Steuerklasse;
  kirchensteuer: boolean;
  /** Bei "kurzfristig" Beschäftigungen: Lohnsteuer nach Steuerklasse oder 25% pauschal */
  kurzfristigPauschal: boolean;
}

export interface MinusEintrag {
  id: string
  datum: string      // "YYYY-MM-DD"
  minuten: number    // positiv gespeichert
  notiz?: string
}

export interface GeplanteSchicht {
  id: string
  employerId: string
  datum: string      // "YYYY-MM-DD"
  start: string      // "HH:mm"
  ende: string       // "HH:mm"
  uebernommen: boolean
  uebernommenShiftId?: string  // ID in shifts-Collection nach Übernahme
}

/**
 * Soll-Ist-Abgleich: pro Monat und Arbeitgeber die laut Abrechnung
 * gemeldeten Werte, zum Vergleich mit der eigenen Erfassung.
 */
export interface Abgleich {
  id: string;
  employerId: string;
  jahr: number;
  /** 1-12 */
  monat: number;
  /** Laut Abrechnung gemeldete Stunden (Dezimalstunden), optional bis eingetragen */
  lautAbrechnungStunden?: number;
  /** Tatsächlich ausgezahlter Betrag in Cent, optional bis eingetragen */
  tatsaechlichAusgezahltCent?: number;
}
