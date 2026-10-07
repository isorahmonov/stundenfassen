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
  /** Minusstunden-Block im Monats-PDF anzeigen; Default true wenn undefined */
  minusImPDFAnzeigen?: boolean;
  /** Personalnummer für das Verfügbarkeits-PDF, optional */
  personalnummer?: string;
  /** Verfügbarkeits-Einstellungen pro Arbeitgeber */
  verfuegbarkeit?: VerfuegbarkeitsEinstellungenArbeitgeber;
  /** Lohnsteuer 25% pauschal (§40a EStG) statt nach Steuerklasse — nur relevant bei art="kurzfristig" */
  kurzfristigPauschal?: boolean;
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
  /** Aus Firestore gelesen für ältere Datensätze; wird nicht mehr neu geschrieben */
  bundesland?: Bundesland;
  steuerklasse: Steuerklasse;
  kirchensteuer: boolean;
  /** Aus Firestore gelesen für ältere Datensätze; wird nicht mehr neu geschrieben.
   *  Gilt als Rückfall, solange kein employer.kurzfristigPauschal gesetzt ist. */
  kurzfristigPauschal?: boolean;
}

export interface MinusEintrag {
  id: string
  datum: string      // "YYYY-MM-DD"
  minuten: number    // positiv gespeichert
  notiz?: string
  employerId?: string  // optional für Rückwärtskompatibilität; neue Einträge haben immer einen Wert
}

export interface EmailVorlage {
  id: string
  name: string
  betreff: string
  text: string
  /** Feste Empfänger-Adressen (kommagetrennt), optional */
  empfaenger?: string
  /** Feste CC-Adressen (kommagetrennt), optional */
  cc?: string
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

export interface PufferOrt {
  suchtext: string
  vorMin: number
  nachMin: number
}

export interface FesteSperrzeit {
  /** 0 = Sonntag, 1 = Montag … 6 = Samstag */
  wochentag: number
  von: string
  bis: string
  bezeichnung: string
}

export interface VerfuegbarkeitsEinstellungenArbeitgeber {
  /** Erlaubte Wochentage: 0=So, 1=Mo … 6=Sa */
  wochentage: number[]
  fruehestens: string           // "HH:mm"
  spaetestens: string           // "HH:mm"
  mindestdauerMin: number
  rundungMin: number
  pufferStandardMin: number
  wochenStart: "sonntag" | "montag"
  kwSystem: "tkmaxx" | "iso" | "keine"
  kwAnker?: string              // "YYYY-MM-DD", nur bei kwSystem="tkmaxx"
  pdf: { fusszeilenText?: string; deinName?: string }
  pufferOrte: PufferOrt[]
  festeSperrzeiten: FesteSperrzeit[]
  einrichtungBestaetigt: boolean
  /** Nutzer hat den Dialog bewusst übersprungen; kein Auto-Öffnen mehr, aber Banner zeigen */
  einrichtungUebersprungen?: boolean
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
