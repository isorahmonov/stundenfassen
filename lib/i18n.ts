export type Locale = "de" | "en" | "ru" | "fr"

export const DEFAULT_LOCALE: Locale = "de"
export const LOCALES: readonly Locale[] = ["de", "en", "ru", "fr"]

export interface UiStrings {
  // Generic
  LAEDT: string
  ERNEUT_VERSUCHEN: string
  LADE_FEHLER_PREFIX: string
  // Generic actions
  LOESCHEN: string
  ABBRECHEN: string
  HINZUFUEGEN: string
  ARBEITGEBER_LABEL: string
  DATUM_LABEL: string
  JETZT_EINRICHTEN: string
  // No-employer empty state
  KEIN_ARBEITGEBER_TITEL: string
  KEIN_ARBEITGEBER_TEXT: string
  KEIN_ARBEITGEBER_CTA: string
  // Theme toggle
  THEME_ARIA_LABEL: string
  THEME_SYSTEM: string
  THEME_LIGHT: string
  THEME_DARK: string
  THEME_SYSTEM_ARIA: string
  THEME_LIGHT_ARIA: string
  THEME_DARK_ARIA: string
  // Auth / login screen
  AUTH_LAEDT_FEHLER: string
  AUTH_NEU_LADEN: string
  AUTH_FEHLER_DOMAIN: string
  AUTH_FEHLER_POPUP_BLOCKIERT: string
  AUTH_REAUTH_POPUP_BLOCKIERT: string
  AUTH_FEHLER_NETZWERK: string
  AUTH_FEHLER_ABGEBROCHEN: string
  AUTH_FEHLER_ALLGEMEIN: string
  ANMELDEN_LAEUFT: string
  MIT_GOOGLE_ANMELDEN: string
  ANMELDUNG_ZUSTIMMUNG_PRAEFIX: string
  DATENSCHUTZERKLAERUNG: string
  DATENSCHUTZ: string
  IMPRESSUM: string
  TAGLINE: string
  // Tab bar
  TAB_HOME: string
  TAB_KALENDER: string
  TAB_SCHICHTEN: string
  TAB_PROFIL: string
  // Schichten tab
  SCHICHTEN_KW_PREFIX: string
  SCHICHTEN_ARIA_PREV: string
  SCHICHTEN_ARIA_NEXT: string
  SCHICHTEN_EINGETEILT: string
  SCHICHTEN_ANGEBOTEN_PDF: string
  SCHICHTEN_NEUE_EINTRAGEN: string
  SCHICHTEN_KEINE_DIESE_WOCHE: string
  SCHICHTEN_ERSTE_EINTRAGEN: string
  SCHICHTEN_UNBEKANNTER_AG: string
  SCHICHTEN_UEBERNOMMEN: string
  SCHICHTEN_UEBERNEHMEN: string
  SCHICHTEN_LOESCHEN_FRAGE: string
  SCHICHTEN_FORM_START: string
  SCHICHTEN_FORM_ENDE: string
  // Verfügbarkeit tab
  VERF_TITEL: string
  VERF_KALENDER_AKTUALISIEREN: string
  VERF_AB_LABEL: string
  VERF_WOCHEN_LABEL: string
  VERF_BUNDESLAND_LABEL: string
  VERF_NICHT_EINGERICHTET: string
  VERF_GOOGLE_HINWEIS: string
  VERF_KEINE_KALENDER: string
  VERF_KALENDER_PROFIL_VOR: string
  VERF_KALENDER_PROFIL_LINK: string
  VERF_KALENDER_PROFIL_NACH: string
  VERF_AUSGEWAEHLT: string
  VERF_WOCHE: string
  VERF_NICHT_VERFUEGBAR: string
  VERF_KEINE_BLOECKE: string
  VERF_SCHICHTEN_LADEN_FEHLER: string
  VERF_KALENDER_FEHLER_MIT_STAND: string
  VERF_KALENDER_FEHLER_OHNE_STAND: string
  VERF_ZULETZT_EXPORTIERT: string
  // Profil page — section titles
  PROFIL_TITEL: string
  SEKTION_KALENDER: string
  SEKTION_ARBEITGEBER: string
  SEKTION_MINUSSTUNDEN: string
  SEKTION_EMAIL_VORLAGEN: string
  SEKTION_EMAIL_VERSAND: string
  SEKTION_STEUER: string
  SEKTION_SPRACHE: string
  SEKTION_ERSCHEINUNGSBILD: string
  SEKTION_KONTO: string
  // Kalender section
  KAL_VERWALTEN: string
  KAL_NEU_ARIA: string
  KAL_NOCH_KEINE: string
  KAL_ERSTEN_ANLEGEN: string
  KAL_LOESCHEN_FRAGE: string
  KAL_BEARBEITEN: string
  KAL_SCHLIESSEN: string
  KAL_TERMINE_PRUEFEN: string
  KAL_FORM_DEFAULT_STATUS: string
  KAL_FORM_URL_HINT_BEARBEITUNG: string
  KAL_FORM_URL_HINT_NEU: string
  KAL_FORM_PUBLIC_WARNUNG: string
  KAL_FORM_URL_PLACEHOLDER_BEARBEITUNG: string
  KAL_PLACEHOLDER_NAME: string
  // Arbeitgeber section
  AG_VERWALTEN: string
  ZURUECK: string
  AG_NEU_ARIA: string
  AG_KEINE: string
  AG_ERSTEN_ANLEGEN: string
  AG_ARCHIVIERT: string
  AG_VERF_AENDERN: string
  AG_VERF_EINRICHTEN: string
  ARCHIVIEREN: string
  REAKTIVIEREN: string
  AG_BESCHAEFTIGUNGSART: string
  AG_STUNDENLOHN: string
  AG_PERSONALNUMMER: string
  AG_ZUSCHLAG_SO: string
  AG_ZUSCHLAG_FT: string
  AG_ZUSCHLAG_NACHT: string
  AG_ART_WERKSTUDENT: string
  AG_ART_KURZFRISTIG: string
  AG_ART_MINIJOB: string
  AG_ART_SONSTIGES: string
  AG_ABBR_SO: string
  AG_ABBR_FT: string
  AG_ABBR_NACHT: string
  AG_PLACEHOLDER_NAME: string
  AG_PLACEHOLDER_PERSONALNR: string
  // Minusstunden section
  MINUS_EINTRAEGE: string
  MINUS_NEU_ARIA: string
  MINUS_KEINE: string
  MINUS_ERSTEN_EINTRAGEN: string
  MINUS_LOESCHEN_FRAGE: string
  MINUS_PDF_ANZEIGE: string
  MINUS_PDF_LABEL: string
  MINUS_PDF_ARIA: string
  MINUS_ZUERST_AG: string
  MINUS_AG_WAEHLEN: string
  MINUS_STUNDEN: string
  MINUS_GRUND: string
  // E-Mail-Vorlagen section
  VORLAGE_HEADER: string
  VORLAGE_NEU_ARIA: string
  VORLAGE_NOCH_KEINE: string
  VORLAGE_ERSTE_ANLEGEN: string
  VORLAGE_BEARBEITEN: string
  VORLAGE_LOESCHEN_FRAGE: string
  VORLAGE_PLATZHALTER: string
  VORLAGE_NAME: string
  VORLAGE_EMPFAENGER: string
  VORLAGE_OPT_MEHRERE: string
  VORLAGE_BETREFF: string
  VORLAGE_TEXT: string
  VORLAGE_ANLEGEN: string
  // E-Mail-Versand section
  EMAIL_VERSAND_VOR_LINK: string
  EMAIL_VERSAND_LINK: string
  EMAIL_VERSAND_NACH_LINK: string
  EMAIL_GMAIL_ADRESSE: string
  EMAIL_APP_PASSWORT: string
  EMAIL_APP_PASSWORT_NEU: string
  EMAIL_AENDERN: string
  EMAIL_ENTFERNEN: string
  EMAIL_ENTFERNEN_FRAGE: string
  EMAIL_AKTUALISIEREN: string
  // Steuer section
  STEUER_KLASSE: string
  STEUER_KIRCHENSTEUER: string
  STEUER_PAUSCHAL: string
  // Erscheinungsbild
  FARBSCHEMA: string
  // Konto section
  ANGEMELDET_ALS: string
  ABMELDEN: string
  DATEN_EXPORTIEREN: string
  // Common shared actions
  SPEICHERN: string
  SPEICHERT: string
  BEARBEITEN: string
  SCHLIESSEN: string
  ANLEGEN: string
  EINTRAGEN: string
  // Accessibility
  ARIA_VORMONAT: string
  ARIA_NAECHSTER_MONAT: string
  ARIA_FARBE: string
  OPTIONAL: string
  // AbmeldenDialog
  ABMELDEN_FRAGE: string
  ABMELDEN_BESTAETIGUNG: string
  // KontoLoeschenDialog
  KONTO_LOESCHEN_TITEL: string
  KONTO_LOESCHEN_WARNUNG: string
  KONTO_LOESCHEN_ITEM1: string
  KONTO_LOESCHEN_ITEM2: string
  KONTO_LOESCHEN_ITEM3: string
  KONTO_LOESCHEN_ITEM4: string
  KONTO_LOESCHEN_ITEM5: string
  KONTO_LOESCHEN_ITEM6: string
  KONTO_LOESCHEN_POPUP: string
  KONTO_LOESCHEN_EINGABE: string
  KONTO_LOESCHEN_BTN: string
  KONTO_LOESCHEN_LAEUFT: string
  KONTO_LOESCHEN_WORT: string
  // DatenExportDialog
  EXPORT_TITEL: string
  EXPORT_ENTHAELT: string
  EXPORT_ITEM1: string
  EXPORT_ITEM2: string
  EXPORT_ITEM3: string
  EXPORT_ITEM4: string
  EXPORT_ITEM5: string
  EXPORT_NICHT_ENTHALTEN: string
  EXPORT_NICHT_ENTHALTEN_TEXT: string
  EXPORT_DATENSCHUTZ: string
  EXPORT_HERUNTERGELADEN: string
  EXPORT_HERUNTERLADEN: string
  EXPORT_LAEUFT: string
  // TerminPruefer
  TERMIN_VON: string
  TERMIN_BIS: string
  TERMIN_LADEN: string
  TERMIN_KEINE: string
  TERMIN_SUMMARY: string
  // General navigation/actions
  SPAETER: string
  WEITER: string
  BESTAETIGEN: string
  // Weekday short names (0=So … 6=Sa)
  TAG_SO: string
  TAG_MO: string
  TAG_DI: string
  TAG_MI: string
  TAG_DO: string
  TAG_FR: string
  TAG_SA: string
  // Weekday long names
  TAG_LANG_SO: string
  TAG_LANG_MO: string
  TAG_LANG_DI: string
  TAG_LANG_MI: string
  TAG_LANG_DO: string
  TAG_LANG_FR: string
  TAG_LANG_SA: string
  // EinrichtungsDialog
  EINR_TITEL_BUNDESLAND: string
  EINR_TITEL_WOCHENTAGE: string
  EINR_TITEL_ZEITFENSTER: string
  EINR_TITEL_WEGEZEITEN: string
  EINR_TITEL_PDF: string
  EINR_TITEL_SPERRZEITEN: string
  EINR_SCHRITT_VON: string
  EINR_EINSCHRAENKUNGEN: string
  EINR_BUNDESLAND_FRAGE: string
  EINR_BUNDESLAND_PLACEHOLDER: string
  EINR_WOCHENTAGE_FRAGE: string
  EINR_WOCHENSTART: string
  EINR_WOCHENSTART_SO: string
  EINR_FRUEHESTENS: string
  EINR_SPAETESTENS: string
  EINR_MINDESTDAUER: string
  EINR_RUNDUNG: string
  EINR_PUFFER_STD: string
  EINR_PUFFER_STD_HINT: string
  EINR_PUFFER_ORTE_TITEL: string
  EINR_PUFFER_LEER: string
  EINR_PUFFER_ORT_PLACEHOLDER: string
  EINR_PUFFER_VOR: string
  EINR_PUFFER_NACH: string
  EINR_PDF_NAME: string
  EINR_PDF_NAME_PLACEHOLDER: string
  EINR_KW_SYSTEM: string
  EINR_KW_KEINE: string
  EINR_KW_ISO: string
  EINR_KW_TKMAXX: string
  EINR_ANKERDATUM: string
  EINR_ANKERDATUM_HINT: string
  EINR_PDF_FUSSZEILE: string
  EINR_PDF_FUSSZEILE_PLACEHOLDER: string
  EINR_SPERR_FRAGE: string
  EINR_SPERR_BEZEICHNUNG_PLACEHOLDER: string
  EINR_VAL_BUNDESLAND: string
  EINR_VAL_WOCHENTAGE: string
  EINR_VAL_ZEITFENSTER: string
  EINR_VAL_MINDESTDAUER: string
  EINR_VAL_MINDESTDAUER_FENSTER: string
  EINR_VAL_RUNDUNG: string
  EINR_VAL_ORT_LEER: string
  EINR_VAL_PUFFER_NEGATIV: string
  EINR_VAL_PDF_NAME: string
  EINR_VAL_ANKERDATUM: string
  EINR_VAL_SPERRZEIT_FELDER: string
  EINR_VAL_SPERRZEIT_ZEITEN: string
  EINR_SPEICHERN_FEHLER: string
  // Neuigkeiten / Changelog
  SEKTION_NEUIGKEITEN: string
  UPD_DIALOG_TITEL: string
  UPD_VERSION_PREFIX: string
  UPD_LOSGEH: string
  UPD_ZUM_PROFIL: string
  UPD_2_1_0_ITEM1: string
  UPD_2_1_0_ITEM2: string
  UPD_2_1_0_ITEM3: string
  UPD_2_1_0_ITEM4: string
  UPD_2_1_0_ITEM5: string
  UPD_2_1_0_ITEM6: string
  UPD_2_1_0_ITEM7: string
  UPD_2_1_0_ITEM9: string
  UPD_2_0_ITEM1: string
  UPD_2_0_ITEM2: string
  UPD_2_0_ITEM3: string
  UPD_2_0_ITEM4: string
  UPD_2_0_ITEM5: string
  UPD_2_0_ITEM6: string
  UPD_2_0_ITEM7: string
  UPD_2_0_ITEM8: string
  UPD_2_0_ITEM9: string
  // SchnellEingabe & SchichtTabelle — shared labels
  SE_TAB_ARBEITSZEIT: string
  SE_TAB_MINUS: string
  SE_NEUE_SCHICHT: string
  SE_PAUSE_VON: string
  SE_PAUSE_BIS: string
  SE_LETZTE_KOPIEREN: string
  SE_SCHICHT_SPEICHERN: string
  SE_FEHLER_PAUSE: string
  SE_FEHLER_SCHICHT: string
  SE_MINUS_EINTRAGEN: string
  SE_MINUS_HINWEIS: string
  SE_PH_STUNDEN: string
  SE_GRUND_NOTIZ: string
  SE_PH_NOTIZ: string
  SE_MINUS_SPEICHERN: string
  SE_FEHLER_STUNDEN: string
  SE_FEHLER_EINTRAG: string
  // SchichtTabelle column headers
  SPAL_WOCHENTAG: string
  SPAL_STD: string
  SPAL_BRUTTO: string
  // SchichtTabelle aria-labels
  SCHICHT_BEARBEITEN_ARIA: string
  SCHICHT_LOESCHEN_ARIA: string
  // SchichtKarte
  PAUSE_ZU_KURZ: string
  PAUSE_LABEL: string
  // MonatsUebersicht
  MONAT_KEINE_SCHICHTEN: string
  MONAT_SCHICHTEN_EINZEL: string
  MONAT_SCHICHTEN_N: string
  // Verfügbarkeit buttons / dialogs
  VERFUEG_WARN_TITEL: string
  VERFUEG_WARN_TEXT: string
  TROTZDEM_FORTFAHREN: string
  PDF_ERSTELLEN_BTN: string
  PDF_LAEDT_BTN: string
  EMAIL_PER_EMAIL_BTN: string
  GESENDET: string
  SCHLIESSEN_COUNTDOWN: string
  EMAIL_VORLAGE_VOR: string
  EMAIL_VORLAGE_LINK: string
  EMAIL_VORLAGE_NACH: string
  VORLAGE_DIALOG_LABEL: string
  AN_LABEL: string
  VORSCHAU_LABEL: string
  BETREFF_LABEL: string
  KEIN_EMAIL_KONTO_TITEL: string
  KEIN_EMAIL_KONTO_VOR: string
  KEIN_EMAIL_KONTO_LINK: string
  CC_FEHLER: string
  SENDET_LABEL: string
  SENDEN_BTN: string
  // Profil — Dokumentensprache
  DOK_SPRACHE_LABEL: string
  // E-Mail Vorlage — Betreff-Platzhalter
  VORLAGE_PH_BETREFF: string
}

export const translations: Record<Locale, UiStrings> = {
  de: {
    LAEDT: "Lade…",
    ERNEUT_VERSUCHEN: "Erneut versuchen",
    LADE_FEHLER_PREFIX: "Fehler:",
    LOESCHEN: "Löschen",
    ABBRECHEN: "Abbrechen",
    HINZUFUEGEN: "Hinzufügen",
    ARBEITGEBER_LABEL: "Arbeitgeber",
    DATUM_LABEL: "Datum",
    JETZT_EINRICHTEN: "Jetzt einrichten",
    KEIN_ARBEITGEBER_TITEL: "Kein Arbeitgeber angelegt",
    KEIN_ARBEITGEBER_TEXT: "Lege zuerst einen Arbeitgeber an, um diese Seite zu nutzen.",
    KEIN_ARBEITGEBER_CTA: "Arbeitgeber anlegen →",
    THEME_ARIA_LABEL: "Farbschema",
    THEME_SYSTEM: "Auto",
    THEME_LIGHT: "Hell",
    THEME_DARK: "Dunkel",
    THEME_SYSTEM_ARIA: "Systemfarbe",
    THEME_LIGHT_ARIA: "Helles Design",
    THEME_DARK_ARIA: "Dunkles Design",
    AUTH_LAEDT_FEHLER: "Anmeldung dauert zu lange — App neu laden.",
    AUTH_NEU_LADEN: "App neu laden",
    AUTH_FEHLER_DOMAIN: "Diese Domain ist für die Anmeldung nicht freigegeben.",
    AUTH_FEHLER_POPUP_BLOCKIERT: "Das Anmelde-Fenster wurde blockiert. Bitte erlaube Popups für diese Seite und versuche es erneut.",
    AUTH_REAUTH_POPUP_BLOCKIERT: "Das Anmelde-Popup wurde blockiert. Bitte öffne die App im Browser (Safari → Teilen → In Browser öffnen) und versuche es erneut.",
    AUTH_FEHLER_NETZWERK: "Keine Netzwerkverbindung. Bitte überprüfe deine Internetverbindung.",
    AUTH_FEHLER_ABGEBROCHEN: "Anmeldung abgebrochen. Bitte versuche es erneut.",
    AUTH_FEHLER_ALLGEMEIN: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
    ANMELDEN_LAEUFT: "Anmelden…",
    MIT_GOOGLE_ANMELDEN: "Mit Google anmelden",
    ANMELDUNG_ZUSTIMMUNG_PRAEFIX: "Mit der Anmeldung akzeptierst du die",
    DATENSCHUTZERKLAERUNG: "Datenschutzerklärung",
    DATENSCHUTZ: "Datenschutz",
    IMPRESSUM: "Impressum",
    TAGLINE: "Schichten, Stunden, freie Zeiten",
    TAB_HOME: "Home",
    TAB_KALENDER: "Kalender",
    TAB_SCHICHTEN: "Schichten",
    TAB_PROFIL: "Profil",
    SCHICHTEN_KW_PREFIX: "KW",
    SCHICHTEN_ARIA_PREV: "Vorherige Woche",
    SCHICHTEN_ARIA_NEXT: "Nächste Woche",
    SCHICHTEN_EINGETEILT: "Eingeteilt",
    SCHICHTEN_ANGEBOTEN_PDF: "Angeboten (letztes PDF)",
    SCHICHTEN_NEUE_EINTRAGEN: "Neue Schicht eintragen",
    SCHICHTEN_KEINE_DIESE_WOCHE: "Keine Schichten diese Woche.",
    SCHICHTEN_ERSTE_EINTRAGEN: "Erste eintragen →",
    SCHICHTEN_UNBEKANNTER_AG: "Unbekannt",
    SCHICHTEN_UEBERNOMMEN: "✓ In Stundenzettel übernommen",
    SCHICHTEN_UEBERNEHMEN: "In Stundenzettel übernehmen →",
    SCHICHTEN_LOESCHEN_FRAGE: "Schicht am {datum} löschen?",
    SCHICHTEN_FORM_START: "Start",
    SCHICHTEN_FORM_ENDE: "Ende",
    VERF_TITEL: "Verfügbarkeit",
    VERF_KALENDER_AKTUALISIEREN: "Kalender aktualisieren",
    VERF_AB_LABEL: "Ab (wird auf Sonntag eingerastet)",
    VERF_WOCHEN_LABEL: "Wochen",
    VERF_BUNDESLAND_LABEL: "Bundesland (Feiertage)",
    VERF_NICHT_EINGERICHTET: "Für {name} ist die Verfügbarkeit noch nicht eingerichtet",
    VERF_GOOGLE_HINWEIS: "Hinweis: Google aktualisiert Kalender-Feeds teilweise erst nach einigen Stunden.",
    VERF_KEINE_KALENDER: "Noch keine Kalender eingerichtet.",
    VERF_KALENDER_PROFIL_VOR: "Kalender unter",
    VERF_KALENDER_PROFIL_LINK: "Profil → Kalender",
    VERF_KALENDER_PROFIL_NACH: "hinterlegen.",
    VERF_AUSGEWAEHLT: "Ausgewählt",
    VERF_WOCHE: "Woche",
    VERF_NICHT_VERFUEGBAR: "— nicht verfügbar",
    VERF_KEINE_BLOECKE: "— keine freien Blöcke ≥ {min}",
    VERF_SCHICHTEN_LADEN_FEHLER: "Schichten anderer Arbeitgeber konnten nicht geladen werden — Verfügbarkeit wird ohne diese Sperre berechnet.",
    VERF_KALENDER_FEHLER_MIT_STAND: "Kalender „{name}“ konnte nicht geladen werden – Stand: {stand}",
    VERF_KALENDER_FEHLER_OHNE_STAND: "Kalender „{name}“ konnte nicht geladen werden – ohne diesen Kalender berechnet",
    VERF_ZULETZT_EXPORTIERT: "Zuletzt exportiert",
    PROFIL_TITEL: "Profil",
    SEKTION_KALENDER: "Kalender",
    SEKTION_ARBEITGEBER: "Arbeitgeber",
    SEKTION_MINUSSTUNDEN: "Minusstunden",
    SEKTION_EMAIL_VORLAGEN: "E-Mail-Vorlagen",
    SEKTION_EMAIL_VERSAND: "E-Mail-Versand",
    SEKTION_STEUER: "Steuer-Einstellungen",
    SEKTION_SPRACHE: "Sprache",
    SEKTION_ERSCHEINUNGSBILD: "Erscheinungsbild",
    SEKTION_KONTO: "Konto",
    KAL_VERWALTEN: "Kalender verwalten",
    KAL_NEU_ARIA: "Neuen Kalender hinzufügen",
    KAL_NOCH_KEINE: "Noch keine Kalender.",
    KAL_ERSTEN_ANLEGEN: "Ersten anlegen →",
    KAL_LOESCHEN_FRAGE: "„{name}“ wirklich löschen?",
    KAL_BEARBEITEN: "Bearbeiten",
    KAL_SCHLIESSEN: "Schließen",
    KAL_TERMINE_PRUEFEN: "Termine prüfen",
    KAL_FORM_DEFAULT_STATUS: "Standard-Status:",
    KAL_FORM_URL_HINT_BEARBEITUNG: "URL nur ausfüllen wenn du sie ändern möchtest.",
    KAL_FORM_URL_HINT_NEU: "iCal-Link (Kalender-Export). Bei Google: „Geheime Adresse im iCal-Format”. Bei Uni-Portalen: der iCal-Export-Link. Die Adresse ist wie ein Passwort.",
    KAL_FORM_PUBLIC_WARNUNG: "Das ist die öffentliche Adresse. Sie funktioniert nur, wenn dein Kalender öffentlich ist. Sonst nimm die geheime Adresse (…/private-…/basic.ics).",
    KAL_FORM_URL_PLACEHOLDER_BEARBEITUNG: "Neue URL (leer lassen = unverändert)",
    KAL_PLACEHOLDER_NAME: "Name (z.B. HAW Stundenplan)",
    AG_VERWALTEN: "Arbeitgeber verwalten",
    ZURUECK: "Zurück",
    AG_NEU_ARIA: "Neuer Arbeitgeber",
    AG_KEINE: "Noch keine Arbeitgeber.",
    AG_ERSTEN_ANLEGEN: "Ersten anlegen →",
    AG_ARCHIVIERT: "{count} archiviert",
    AG_VERF_AENDERN: "Verfügbarkeits-Einstellungen ändern",
    AG_VERF_EINRICHTEN: "Verfügbarkeit einrichten",
    ARCHIVIEREN: "Archivieren",
    REAKTIVIEREN: "Reaktivieren",
    AG_BESCHAEFTIGUNGSART: "Beschäftigungsart",
    AG_STUNDENLOHN: "Stundenlohn (EUR)",
    AG_PERSONALNUMMER: "Personalnummer",
    AG_ZUSCHLAG_SO: "Sonntag %",
    AG_ZUSCHLAG_FT: "Feiertag %",
    AG_ZUSCHLAG_NACHT: "Nacht %",
    AG_ART_WERKSTUDENT: "Werkstudent",
    AG_ART_KURZFRISTIG: "Kurzfristig",
    AG_ART_MINIJOB: "Minijob",
    AG_ART_SONSTIGES: "Sonstiges",
    AG_ABBR_SO: "So",
    AG_ABBR_FT: "FT",
    AG_ABBR_NACHT: "Nacht",
    AG_PLACEHOLDER_NAME: "z.B. TechCorp GmbH",
    AG_PLACEHOLDER_PERSONALNR: "z. B. 123456",
    MINUS_EINTRAEGE: "Einträge",
    MINUS_NEU_ARIA: "Minusstunden eintragen",
    MINUS_KEINE: "Keine Minusstunden eingetragen.",
    MINUS_ERSTEN_EINTRAGEN: "Ersten eintragen →",
    MINUS_LOESCHEN_FRAGE: "Eintrag löschen?",
    MINUS_PDF_ANZEIGE: "PDF-Anzeige",
    MINUS_PDF_LABEL: "Minusstunden im PDF",
    MINUS_PDF_ARIA: "Minusstunden im PDF anzeigen",
    MINUS_ZUERST_AG: "Bitte zuerst einen Arbeitgeber anlegen.",
    MINUS_AG_WAEHLEN: "Arbeitgeber wählen…",
    MINUS_STUNDEN: "Stunden",
    MINUS_GRUND: "Grund",
    VORLAGE_HEADER: "Vorlagen",
    VORLAGE_NEU_ARIA: "Neue Vorlage",
    VORLAGE_NOCH_KEINE: "Noch keine Vorlagen.",
    VORLAGE_ERSTE_ANLEGEN: "Erste anlegen →",
    VORLAGE_BEARBEITEN: "Bearbeiten",
    VORLAGE_LOESCHEN_FRAGE: "„{name}“ löschen?",
    VORLAGE_PLATZHALTER: "Platzhalter:",
    VORLAGE_NAME: "Name der Vorlage",
    VORLAGE_EMPFAENGER: "Empfänger (An)",
    VORLAGE_OPT_MEHRERE: "optional, mehrere durch Komma",
    VORLAGE_BETREFF: "Betreff",
    VORLAGE_TEXT: "Text",
    VORLAGE_ANLEGEN: "Anlegen",
    EMAIL_VERSAND_VOR_LINK: "Verfügbarkeiten werden über dein eigenes Gmail-Konto versendet. Du benötigst ein",
    EMAIL_VERSAND_LINK: "App-Passwort",
    EMAIL_VERSAND_NACH_LINK: "(2FA aktivieren → myaccount.google.com/apppasswords).",
    EMAIL_GMAIL_ADRESSE: "Gmail-Adresse",
    EMAIL_APP_PASSWORT: "App-Passwort",
    EMAIL_APP_PASSWORT_NEU: "neu eingeben",
    EMAIL_AENDERN: "Ändern",
    EMAIL_ENTFERNEN: "Entfernen",
    EMAIL_ENTFERNEN_FRAGE: "E-Mail-Konto wirklich entfernen?",
    EMAIL_AKTUALISIEREN: "Aktualisieren",
    STEUER_KLASSE: "Steuerklasse",
    STEUER_KIRCHENSTEUER: "Kirchensteuer",
    STEUER_PAUSCHAL: "Lohnsteuer pauschal 25 % (§40a EStG)",
    FARBSCHEMA: "Farbschema",
    ANGEMELDET_ALS: "Angemeldet als",
    ABMELDEN: "Abmelden",
    DATEN_EXPORTIEREN: "Daten exportieren",
    SPEICHERN: "Speichern",
    SPEICHERT: "Speichert…",
    BEARBEITEN: "Bearbeiten",
    SCHLIESSEN: "Schließen",
    ANLEGEN: "Anlegen",
    EINTRAGEN: "Eintragen",
    ARIA_VORMONAT: "Vormonat",
    ARIA_NAECHSTER_MONAT: "Nächster Monat",
    ARIA_FARBE: "Farbe",
    OPTIONAL: "optional",
    ABMELDEN_FRAGE: "Wirklich abmelden?",
    ABMELDEN_BESTAETIGUNG: "Du wirst als {email} abgemeldet. Lokale Daten (Kalender-Cache, Auswahl) werden gelöscht.",
    KONTO_LOESCHEN_TITEL: "Konto unwiderruflich löschen?",
    KONTO_LOESCHEN_WARNUNG: "Diese Aktion kann nicht rückgängig gemacht werden. Gelöscht werden:",
    KONTO_LOESCHEN_ITEM1: "Alle Schichten, Arbeitgeber und Einstellungen",
    KONTO_LOESCHEN_ITEM2: "E-Mail-Vorlagen und Abrechnungsabgleiche",
    KONTO_LOESCHEN_ITEM3: "Geplante Schichten und Minusstunden-Einträge",
    KONTO_LOESCHEN_ITEM4: "Kalender-URLs (inkl. Token) und iCal-Cache",
    KONTO_LOESCHEN_ITEM5: "Gmail-Zugangsdaten",
    KONTO_LOESCHEN_ITEM6: "Dein Google-Konto-Zugang zu dieser App",
    KONTO_LOESCHEN_POPUP: "Es öffnet sich ein Google-Popup zur Bestätigung deiner Identität.",
    KONTO_LOESCHEN_EINGABE: "Gib deine E-Mail-Adresse oder LÖSCHEN ein",
    KONTO_LOESCHEN_BTN: "Konto löschen",
    KONTO_LOESCHEN_LAEUFT: "Wird gelöscht…",
    KONTO_LOESCHEN_WORT: "LÖSCHEN",
    EXPORT_TITEL: "Daten exportieren",
    EXPORT_ENTHAELT: "Die Exportdatei enthält:",
    EXPORT_ITEM1: "Schichten, Arbeitgeber, Einstellungen",
    EXPORT_ITEM2: "Minusstunden, geplante Schichten, Abgleiche",
    EXPORT_ITEM3: "E-Mail-Vorlagen",
    EXPORT_ITEM4: "Gmail-Adresse (falls hinterlegt)",
    EXPORT_ITEM5: "Kalender-Liste (Name, Farbe – keine URLs)",
    EXPORT_NICHT_ENTHALTEN: "Nicht enthalten:",
    EXPORT_NICHT_ENTHALTEN_TEXT: "Passwörter und iCal-URLs. iCal-URLs enthalten persönliche Authentifizierungstoken und werden nicht exportiert.",
    EXPORT_DATENSCHUTZ: "Die Datei enthält personenbezogene Daten — bitte sicher aufbewahren.",
    EXPORT_HERUNTERGELADEN: "Export heruntergeladen.",
    EXPORT_HERUNTERLADEN: "Herunterladen",
    EXPORT_LAEUFT: "Wird erstellt…",
    TERMIN_VON: "Von",
    TERMIN_BIS: "Bis",
    TERMIN_LADEN: "Laden",
    TERMIN_KEINE: "Noch keine Termine geladen.",
    TERMIN_SUMMARY: "{count} Termine · {locked} LOCKED · {flexible} FLEXIBLE",
    SPAETER: "Später",
    WEITER: "Weiter →",
    BESTAETIGEN: "Bestätigen",
    TAG_SO: "So",
    TAG_MO: "Mo",
    TAG_DI: "Di",
    TAG_MI: "Mi",
    TAG_DO: "Do",
    TAG_FR: "Fr",
    TAG_SA: "Sa",
    TAG_LANG_SO: "Sonntag",
    TAG_LANG_MO: "Montag",
    TAG_LANG_DI: "Dienstag",
    TAG_LANG_MI: "Mittwoch",
    TAG_LANG_DO: "Donnerstag",
    TAG_LANG_FR: "Freitag",
    TAG_LANG_SA: "Samstag",
    EINR_TITEL_BUNDESLAND: "Bundesland",
    EINR_TITEL_WOCHENTAGE: "Wochentage",
    EINR_TITEL_ZEITFENSTER: "Zeitfenster",
    EINR_TITEL_WEGEZEITEN: "Wegezeiten",
    EINR_TITEL_PDF: "PDF-Einstellungen",
    EINR_TITEL_SPERRZEITEN: "Sperrzeiten",
    EINR_SCHRITT_VON: "Schritt {step} von {total}",
    EINR_EINSCHRAENKUNGEN: "Welche Einschränkungen gelten bei {name}?",
    EINR_BUNDESLAND_FRAGE: "In welchem Bundesland arbeitest du bei diesem Arbeitgeber? (Für Feiertagsberechnung)",
    EINR_BUNDESLAND_PLACEHOLDER: "Bundesland wählen…",
    EINR_WOCHENTAGE_FRAGE: "An welchen Tagen kannst du prinzipiell arbeiten?",
    EINR_WOCHENSTART: "Wochenbeginn in der PDF-Anzeige",
    EINR_WOCHENSTART_SO: "Sonntag (z. B. TK Maxx)",
    EINR_FRUEHESTENS: "Frühestens",
    EINR_SPAETESTENS: "Spätestens",
    EINR_MINDESTDAUER: "Mindestdauer eines Blocks (Minuten)",
    EINR_RUNDUNG: "Runden auf (Start auf-, Ende abrunden)",
    EINR_PUFFER_STD: "Standard-Pufferzeit (Minuten, für unbekannte Orte)",
    EINR_PUFFER_STD_HINT: "0 = kein Puffer. Gilt wenn kein Ortstext erkannt wird.",
    EINR_PUFFER_ORTE_TITEL: "Ortsabhängige Wegezeiten",
    EINR_PUFFER_LEER: "Keine eingetragen — Standard-Puffer gilt überall.",
    EINR_PUFFER_ORT_PLACEHOLDER: "Ortstext (z. B. Berliner Tor)",
    EINR_PUFFER_VOR: "Vor Termin (min)",
    EINR_PUFFER_NACH: "Nach Termin (min)",
    EINR_PDF_NAME: "Dein Name für das PDF",
    EINR_PDF_NAME_PLACEHOLDER: "z. B. Max Mustermann",
    EINR_KW_SYSTEM: "Kalenderwochen-System",
    EINR_KW_KEINE: "Kein KW-Label",
    EINR_KW_ISO: "ISO-Wochen (Montag–Sonntag)",
    EINR_KW_TKMAXX: "TK Maxx (Sonntag–Samstag, mit Ankerdatum)",
    EINR_ANKERDATUM: "Ankerdatum (Sonntag der ersten KW)",
    EINR_ANKERDATUM_HINT: "Muss ein Sonntag sein, z. B. 2026-02-01.",
    EINR_PDF_FUSSZEILE: "PDF-Fußzeile",
    EINR_PDF_FUSSZEILE_PLACEHOLDER: "z. B. Shiftslot",
    EINR_SPERR_FRAGE: "Gibt es regelmäßige Termine, die immer gesperrt sind (Vorlesung, Gebet o. ä.)? Leer lassen, wenn keine gelten.",
    EINR_SPERR_BEZEICHNUNG_PLACEHOLDER: "Bezeichnung (z. B. Vorlesung, Freitagsgebet)",
    EINR_VAL_BUNDESLAND: "Bitte ein Bundesland wählen.",
    EINR_VAL_WOCHENTAGE: "Mindestens ein Wochentag muss ausgewählt sein.",
    EINR_VAL_ZEITFENSTER: "Frühestens muss vor Spätestens liegen.",
    EINR_VAL_MINDESTDAUER: "Mindestdauer muss größer als 0 Minuten sein.",
    EINR_VAL_MINDESTDAUER_FENSTER: "Mindestdauer ({mindest} min) überschreitet das Zeitfenster ({fenster} min).",
    EINR_VAL_RUNDUNG: "Rundung muss 15, 30 oder 60 Minuten sein.",
    EINR_VAL_ORT_LEER: "Ortstext darf nicht leer sein.",
    EINR_VAL_PUFFER_NEGATIV: "Pufferzeiten müssen 0 oder größer sein.",
    EINR_VAL_PDF_NAME: "Bitte deinen Namen für das PDF eingeben.",
    EINR_VAL_ANKERDATUM: "Bitte ein Ankerdatum für das TK-Maxx-KW-System eingeben.",
    EINR_VAL_SPERRZEIT_FELDER: "Alle Felder einer Sperrzeit müssen ausgefüllt sein.",
    EINR_VAL_SPERRZEIT_ZEITEN: "Anfangszeit einer Sperrzeit muss vor der Endzeit liegen.",
    EINR_SPEICHERN_FEHLER: "Speichern fehlgeschlagen.",
    SEKTION_NEUIGKEITEN: "Neuigkeiten",
    UPD_DIALOG_TITEL: "Neu in Shiftslot",
    UPD_VERSION_PREFIX: "Version",
    UPD_LOSGEH: "Los geht's",
    UPD_ZUM_PROFIL: "Profil → Neuigkeiten",
    UPD_2_1_0_ITEM1: "Neuer Name und neues Aussehen: Stundenfassen heißt jetzt Shiftslot – mit neuem Logo und App-Symbol",
    UPD_2_1_0_ITEM2: "Neuer Anmeldebildschirm mit animiertem Logo",
    UPD_2_1_0_ITEM3: "Vier Sprachen: Deutsch, Englisch, Russisch, Französisch – wählbar beim Anmelden oder unter Profil → Sprache; separate Dokumentensprache",
    UPD_2_1_0_ITEM4: "Hell, dunkel oder automatisch – unter Profil → Erscheinungsbild oder direkt am Anmeldebildschirm",
    UPD_2_1_0_ITEM5: "Ruhigerer Ladevorgang: neuer Shiftslot-Lader überall, „Erneut versuchen“ nach Timeout, hilfreiche Karte wenn kein Arbeitgeber vorhanden",
    UPD_2_1_0_ITEM6: "Bessere Kalenderbehandlung: klarere Fehler pro Kalender, ein defekter blockiert nicht die anderen, „Stand: …“-Banner, verbesserte iCal-Link-Hilfe",
    UPD_2_1_0_ITEM7: "Deine Daten, deine Kontrolle: Datenschutzerklärung und Impressum in der App, Daten als Datei exportieren, Konto löschen im Profil",
    UPD_2_1_0_ITEM9: "Neue Webadresse: {url} – Auf dem Startbildschirm installierte Apps unter der alten Adresse funktionieren weiter; für das neue Symbol und die neue Adresse die neue URL öffnen und zur Startseite hinzufügen",
    UPD_2_0_ITEM1: "Verfügbarkeit pro Arbeitgeber einrichten: Wochentage, früheste und späteste Zeit, Mindestdauer, Wegezeiten",
    UPD_2_0_ITEM2: "Feste Zeiten sperren, z. B. Gebetszeit, Uni oder Lerngruppe",
    UPD_2_0_ITEM3: "Dein Name im PDF: du legst selbst fest, was im Kopf steht",
    UPD_2_0_ITEM4: "Feiertage nach Bundesland des Arbeitgebers",
    UPD_2_0_ITEM5: "Verfügbarkeit per E-Mail senden, mit Vorlagen und CC",
    UPD_2_0_ITEM6: "Minusstunden pro Arbeitgeber, wahlweise im PDF",
    UPD_2_0_ITEM7: "Lohnsteuer pauschal pro Arbeitgeber (bei kurzfristiger Beschäftigung)",
    UPD_2_0_ITEM8: "Kalender lädt schneller und aktualisiert sich beim Zurückkehren in die App",
    UPD_2_0_ITEM9: "Abmelden im Profil-Tab",
    SE_TAB_ARBEITSZEIT: "Arbeitszeit",
    SE_TAB_MINUS: "Minusstunden",
    SE_NEUE_SCHICHT: "Neue Schicht",
    SE_PAUSE_VON: "Pause von",
    SE_PAUSE_BIS: "Pause bis",
    SE_LETZTE_KOPIEREN: "↩ Letzte kopieren",
    SE_SCHICHT_SPEICHERN: "Schicht speichern",
    SE_FEHLER_PAUSE: "Pause von und Pause bis müssen beide angegeben oder beide leer sein.",
    SE_FEHLER_SCHICHT: "Schicht konnte nicht gespeichert werden.",
    SE_MINUS_EINTRAGEN: "Minusstunden eintragen",
    SE_MINUS_HINWEIS: "Erscheinen im Verfügbarkeits-PDF oben rechts.",
    SE_PH_STUNDEN: "z.B. 2 oder 1.5",
    SE_GRUND_NOTIZ: "Grund / Notiz",
    SE_PH_NOTIZ: "z.B. Krankmeldung, Korrektur",
    SE_MINUS_SPEICHERN: "Minusstunden speichern",
    SE_FEHLER_STUNDEN: "Bitte eine positive Stundenanzahl eingeben.",
    SE_FEHLER_EINTRAG: "Eintrag konnte nicht gespeichert werden.",
    SPAL_WOCHENTAG: "Wochentag",
    SPAL_STD: "Std",
    SPAL_BRUTTO: "Brutto",
    SCHICHT_BEARBEITEN_ARIA: "Schicht bearbeiten",
    SCHICHT_LOESCHEN_ARIA: "Schicht löschen",
    PAUSE_ZU_KURZ: "Pause zu kurz",
    PAUSE_LABEL: "Pause",
    MONAT_KEINE_SCHICHTEN: "Keine Schichten in diesem Monat",
    MONAT_SCHICHTEN_EINZEL: "1 Schicht",
    MONAT_SCHICHTEN_N: "{{n}} Schichten",
    VERFUEG_WARN_TITEL: "Verfügbarkeit nicht eingerichtet",
    VERFUEG_WARN_TEXT: "Für diesen Arbeitgeber ist die Verfügbarkeitsansicht noch nicht eingerichtet. Trotzdem fortfahren?",
    TROTZDEM_FORTFAHREN: "Trotzdem fortfahren",
    PDF_ERSTELLEN_BTN: "↓ PDF erstellen",
    PDF_LAEDT_BTN: "Erstelle PDF…",
    EMAIL_PER_EMAIL_BTN: "✉ Per E-Mail",
    GESENDET: "Gesendet!",
    SCHLIESSEN_COUNTDOWN: "Schließen ({{s}}s)",
    EMAIL_VORLAGE_VOR: "Bitte zuerst eine Vorlage im",
    EMAIL_VORLAGE_LINK: "Profil-Tab",
    EMAIL_VORLAGE_NACH: "anlegen.",
    VORLAGE_DIALOG_LABEL: "Vorlage",
    AN_LABEL: "An",
    VORSCHAU_LABEL: "Vorschau",
    BETREFF_LABEL: "Betreff:",
    KEIN_EMAIL_KONTO_TITEL: "Kein E-Mail-Konto hinterlegt",
    KEIN_EMAIL_KONTO_VOR: "Bitte zuerst eigenes Gmail-Konto im",
    KEIN_EMAIL_KONTO_LINK: "Profil-Tab einrichten →",
    CC_FEHLER: "Ungültige E-Mail-Adresse(n) — Komma zwischen mehreren.",
    SENDET_LABEL: "Sendet…",
    SENDEN_BTN: "✉ Senden",
    DOK_SPRACHE_LABEL: "Dokumentensprache",
    VORLAGE_PH_BETREFF: "Verfügbarkeit {{zeitraum_von}} – {{zeitraum_bis}}",
  },
  en: {
    LAEDT: "Loading…",
    ERNEUT_VERSUCHEN: "Try again",
    LADE_FEHLER_PREFIX: "Error:",
    LOESCHEN: "Delete",
    ABBRECHEN: "Cancel",
    HINZUFUEGEN: "Add",
    ARBEITGEBER_LABEL: "Employer",
    DATUM_LABEL: "Date",
    JETZT_EINRICHTEN: "Set up now",
    KEIN_ARBEITGEBER_TITEL: "No employer added",
    KEIN_ARBEITGEBER_TEXT: "Add an employer first to use this page.",
    KEIN_ARBEITGEBER_CTA: "Add employer →",
    THEME_ARIA_LABEL: "Color scheme",
    THEME_SYSTEM: "Auto",
    THEME_LIGHT: "Light",
    THEME_DARK: "Dark",
    THEME_SYSTEM_ARIA: "System theme",
    THEME_LIGHT_ARIA: "Light theme",
    THEME_DARK_ARIA: "Dark theme",
    AUTH_LAEDT_FEHLER: "Sign-in is taking too long — reload the app.",
    AUTH_NEU_LADEN: "Reload app",
    AUTH_FEHLER_DOMAIN: "This domain is not authorized for sign-in.",
    AUTH_FEHLER_POPUP_BLOCKIERT: "The sign-in window was blocked. Please allow pop-ups for this site and try again.",
    AUTH_REAUTH_POPUP_BLOCKIERT: "The sign-in pop-up was blocked. Please open the app in your browser (Safari → Share → Open in Browser) and try again.",
    AUTH_FEHLER_NETZWERK: "No network connection. Please check your internet.",
    AUTH_FEHLER_ABGEBROCHEN: "Sign-in was cancelled. Please try again.",
    AUTH_FEHLER_ALLGEMEIN: "Sign-in failed. Please try again.",
    ANMELDEN_LAEUFT: "Signing in…",
    MIT_GOOGLE_ANMELDEN: "Sign in with Google",
    ANMELDUNG_ZUSTIMMUNG_PRAEFIX: "By signing in, you agree to our",
    DATENSCHUTZERKLAERUNG: "Privacy Policy",
    DATENSCHUTZ: "Privacy",
    IMPRESSUM: "Imprint",
    TAGLINE: "Shifts, hours, free time",
    TAB_HOME: "Home",
    TAB_KALENDER: "Calendar",
    TAB_SCHICHTEN: "Shifts",
    TAB_PROFIL: "Profile",
    SCHICHTEN_KW_PREFIX: "CW",
    SCHICHTEN_ARIA_PREV: "Previous week",
    SCHICHTEN_ARIA_NEXT: "Next week",
    SCHICHTEN_EINGETEILT: "Scheduled",
    SCHICHTEN_ANGEBOTEN_PDF: "Offered (last PDF)",
    SCHICHTEN_NEUE_EINTRAGEN: "Add new shift",
    SCHICHTEN_KEINE_DIESE_WOCHE: "No shifts this week.",
    SCHICHTEN_ERSTE_EINTRAGEN: "Add the first one →",
    SCHICHTEN_UNBEKANNTER_AG: "Unknown",
    SCHICHTEN_UEBERNOMMEN: "✓ Added to timesheet",
    SCHICHTEN_UEBERNEHMEN: "Add to timesheet →",
    SCHICHTEN_LOESCHEN_FRAGE: "Delete shift on {datum}?",
    SCHICHTEN_FORM_START: "Start",
    SCHICHTEN_FORM_ENDE: "End",
    VERF_TITEL: "Availability",
    VERF_KALENDER_AKTUALISIEREN: "Refresh calendar",
    VERF_AB_LABEL: "From (snaps to Sunday)",
    VERF_WOCHEN_LABEL: "Weeks",
    VERF_BUNDESLAND_LABEL: "State (holidays)",
    VERF_NICHT_EINGERICHTET: "Availability not set up for {name}",
    VERF_GOOGLE_HINWEIS: "Note: Google may take several hours to update calendar feeds.",
    VERF_KEINE_KALENDER: "No calendars added yet.",
    VERF_KALENDER_PROFIL_VOR: "Add calendars in",
    VERF_KALENDER_PROFIL_LINK: "Profile → Calendars",
    VERF_KALENDER_PROFIL_NACH: "to get started.",
    VERF_AUSGEWAEHLT: "Selected",
    VERF_WOCHE: "Week",
    VERF_NICHT_VERFUEGBAR: "— not available",
    VERF_KEINE_BLOECKE: "— no free blocks ≥ {min}",
    VERF_SCHICHTEN_LADEN_FEHLER: "Shifts from other employers could not be loaded — availability calculated without this block.",
    VERF_KALENDER_FEHLER_MIT_STAND: "Calendar \"{name}\" could not be loaded – last update: {stand}",
    VERF_KALENDER_FEHLER_OHNE_STAND: "Calendar \"{name}\" could not be loaded – calculated without it",
    VERF_ZULETZT_EXPORTIERT: "Recently exported",
    PROFIL_TITEL: "Profile",
    SEKTION_KALENDER: "Calendars",
    SEKTION_ARBEITGEBER: "Employers",
    SEKTION_MINUSSTUNDEN: "Negative hours",
    SEKTION_EMAIL_VORLAGEN: "Email templates",
    SEKTION_EMAIL_VERSAND: "Email sending",
    SEKTION_STEUER: "Tax settings",
    SEKTION_SPRACHE: "Language",
    SEKTION_ERSCHEINUNGSBILD: "Appearance",
    SEKTION_KONTO: "Account",
    KAL_VERWALTEN: "Manage calendars",
    KAL_NEU_ARIA: "Add new calendar",
    KAL_NOCH_KEINE: "No calendars yet.",
    KAL_ERSTEN_ANLEGEN: "Add the first one →",
    KAL_LOESCHEN_FRAGE: "Delete \"{name}\"?",
    KAL_BEARBEITEN: "Edit",
    KAL_SCHLIESSEN: "Close",
    KAL_TERMINE_PRUEFEN: "Check events",
    KAL_FORM_DEFAULT_STATUS: "Default status:",
    KAL_FORM_URL_HINT_BEARBEITUNG: "Only fill in the URL if you want to change it.",
    KAL_FORM_URL_HINT_NEU: "iCal link (calendar export). For Google: \"Secret address in iCal format\". For university portals: the iCal export link. The address is like a password.",
    KAL_FORM_PUBLIC_WARNUNG: "This is the public address. It only works if your calendar is public. Otherwise use the secret address (…/private-…/basic.ics).",
    KAL_FORM_URL_PLACEHOLDER_BEARBEITUNG: "New URL (leave blank = keep current)",
    KAL_PLACEHOLDER_NAME: "Name (e.g. University timetable)",
    AG_VERWALTEN: "Manage employers",
    ZURUECK: "Back",
    AG_NEU_ARIA: "New employer",
    AG_KEINE: "No employers yet.",
    AG_ERSTEN_ANLEGEN: "Add first →",
    AG_ARCHIVIERT: "{count} archived",
    AG_VERF_AENDERN: "Change availability settings",
    AG_VERF_EINRICHTEN: "Set up availability",
    ARCHIVIEREN: "Archive",
    REAKTIVIEREN: "Restore",
    AG_BESCHAEFTIGUNGSART: "Employment type",
    AG_STUNDENLOHN: "Hourly wage (EUR)",
    AG_PERSONALNUMMER: "Employee number",
    AG_ZUSCHLAG_SO: "Sunday %",
    AG_ZUSCHLAG_FT: "Holiday %",
    AG_ZUSCHLAG_NACHT: "Night %",
    AG_ART_WERKSTUDENT: "Working student",
    AG_ART_KURZFRISTIG: "Short-term",
    AG_ART_MINIJOB: "Mini-job",
    AG_ART_SONSTIGES: "Other",
    AG_ABBR_SO: "Sun",
    AG_ABBR_FT: "PH",
    AG_ABBR_NACHT: "Night",
    AG_PLACEHOLDER_NAME: "e.g. TechCorp GmbH",
    AG_PLACEHOLDER_PERSONALNR: "e.g. 123456",
    MINUS_EINTRAEGE: "Entries",
    MINUS_NEU_ARIA: "Add negative hours",
    MINUS_KEINE: "No negative hours recorded.",
    MINUS_ERSTEN_EINTRAGEN: "Record the first one →",
    MINUS_LOESCHEN_FRAGE: "Delete entry?",
    MINUS_PDF_ANZEIGE: "PDF display",
    MINUS_PDF_LABEL: "Negative hours in PDF",
    MINUS_PDF_ARIA: "Show negative hours in PDF",
    MINUS_ZUERST_AG: "Please add an employer first.",
    MINUS_AG_WAEHLEN: "Select employer…",
    MINUS_STUNDEN: "Hours",
    MINUS_GRUND: "Reason",
    VORLAGE_HEADER: "Templates",
    VORLAGE_NEU_ARIA: "New template",
    VORLAGE_NOCH_KEINE: "No templates yet.",
    VORLAGE_ERSTE_ANLEGEN: "Create the first one →",
    VORLAGE_BEARBEITEN: "Edit",
    VORLAGE_LOESCHEN_FRAGE: "Delete \"{name}\"?",
    VORLAGE_PLATZHALTER: "Placeholders:",
    VORLAGE_NAME: "Template name",
    VORLAGE_EMPFAENGER: "Recipient (To)",
    VORLAGE_OPT_MEHRERE: "optional, multiple separated by comma",
    VORLAGE_BETREFF: "Subject",
    VORLAGE_TEXT: "Text",
    VORLAGE_ANLEGEN: "Create",
    EMAIL_VERSAND_VOR_LINK: "Availability is sent via your own Gmail account. You need an",
    EMAIL_VERSAND_LINK: "app password",
    EMAIL_VERSAND_NACH_LINK: "(enable 2FA → myaccount.google.com/apppasswords).",
    EMAIL_GMAIL_ADRESSE: "Gmail address",
    EMAIL_APP_PASSWORT: "App password",
    EMAIL_APP_PASSWORT_NEU: "re-enter",
    EMAIL_AENDERN: "Change",
    EMAIL_ENTFERNEN: "Remove",
    EMAIL_ENTFERNEN_FRAGE: "Remove email account?",
    EMAIL_AKTUALISIEREN: "Update",
    STEUER_KLASSE: "Tax class",
    STEUER_KIRCHENSTEUER: "Church tax",
    STEUER_PAUSCHAL: "Flat-rate wage tax 25% (§40a EStG)",
    FARBSCHEMA: "Color scheme",
    ANGEMELDET_ALS: "Signed in as",
    ABMELDEN: "Sign out",
    DATEN_EXPORTIEREN: "Export data",
    SPEICHERN: "Save",
    SPEICHERT: "Saving…",
    BEARBEITEN: "Edit",
    SCHLIESSEN: "Close",
    ANLEGEN: "Create",
    EINTRAGEN: "Enter",
    ARIA_VORMONAT: "Previous month",
    ARIA_NAECHSTER_MONAT: "Next month",
    ARIA_FARBE: "Color",
    OPTIONAL: "optional",
    ABMELDEN_FRAGE: "Sign out?",
    ABMELDEN_BESTAETIGUNG: "You will be signed out as {email}. Local data (calendar cache, selection) will be deleted.",
    KONTO_LOESCHEN_TITEL: "Permanently delete account?",
    KONTO_LOESCHEN_WARNUNG: "This action cannot be undone. The following will be deleted:",
    KONTO_LOESCHEN_ITEM1: "All shifts, employers and settings",
    KONTO_LOESCHEN_ITEM2: "Email templates and billing reconciliations",
    KONTO_LOESCHEN_ITEM3: "Planned shifts and negative hour entries",
    KONTO_LOESCHEN_ITEM4: "Calendar URLs (incl. token) and iCal cache",
    KONTO_LOESCHEN_ITEM5: "Gmail credentials",
    KONTO_LOESCHEN_ITEM6: "Your Google account access to this app",
    KONTO_LOESCHEN_POPUP: "A Google pop-up will open to verify your identity.",
    KONTO_LOESCHEN_EINGABE: "Enter your email address or DELETE",
    KONTO_LOESCHEN_BTN: "Delete account",
    KONTO_LOESCHEN_LAEUFT: "Deleting…",
    KONTO_LOESCHEN_WORT: "DELETE",
    EXPORT_TITEL: "Export data",
    EXPORT_ENTHAELT: "The export file contains:",
    EXPORT_ITEM1: "Shifts, employers, settings",
    EXPORT_ITEM2: "Negative hours, planned shifts, reconciliations",
    EXPORT_ITEM3: "Email templates",
    EXPORT_ITEM4: "Gmail address (if saved)",
    EXPORT_ITEM5: "Calendar list (name, colour – no URLs)",
    EXPORT_NICHT_ENTHALTEN: "Not included:",
    EXPORT_NICHT_ENTHALTEN_TEXT: "Passwords and iCal URLs. iCal URLs contain personal authentication tokens and are not exported.",
    EXPORT_DATENSCHUTZ: "The file contains personal data — please store securely.",
    EXPORT_HERUNTERGELADEN: "Export downloaded.",
    EXPORT_HERUNTERLADEN: "Download",
    EXPORT_LAEUFT: "Creating…",
    TERMIN_VON: "From",
    TERMIN_BIS: "To",
    TERMIN_LADEN: "Load",
    TERMIN_KEINE: "No events loaded yet.",
    TERMIN_SUMMARY: "{count} events · {locked} LOCKED · {flexible} FLEXIBLE",
    SPAETER: "Later",
    WEITER: "Next →",
    BESTAETIGEN: "Confirm",
    TAG_SO: "Sun",
    TAG_MO: "Mon",
    TAG_DI: "Tue",
    TAG_MI: "Wed",
    TAG_DO: "Thu",
    TAG_FR: "Fri",
    TAG_SA: "Sat",
    TAG_LANG_SO: "Sunday",
    TAG_LANG_MO: "Monday",
    TAG_LANG_DI: "Tuesday",
    TAG_LANG_MI: "Wednesday",
    TAG_LANG_DO: "Thursday",
    TAG_LANG_FR: "Friday",
    TAG_LANG_SA: "Saturday",
    EINR_TITEL_BUNDESLAND: "State/Region",
    EINR_TITEL_WOCHENTAGE: "Days of week",
    EINR_TITEL_ZEITFENSTER: "Time window",
    EINR_TITEL_WEGEZEITEN: "Travel times",
    EINR_TITEL_PDF: "PDF settings",
    EINR_TITEL_SPERRZEITEN: "Blocked times",
    EINR_SCHRITT_VON: "Step {step} of {total}",
    EINR_EINSCHRAENKUNGEN: "What constraints apply at {name}?",
    EINR_BUNDESLAND_FRAGE: "In which state do you work for this employer? (For public holiday calculation)",
    EINR_BUNDESLAND_PLACEHOLDER: "Select state…",
    EINR_WOCHENTAGE_FRAGE: "On which days can you generally work?",
    EINR_WOCHENSTART: "Week start in PDF display",
    EINR_WOCHENSTART_SO: "Sunday (e.g. TK Maxx)",
    EINR_FRUEHESTENS: "Earliest",
    EINR_SPAETESTENS: "Latest",
    EINR_MINDESTDAUER: "Minimum block duration (minutes)",
    EINR_RUNDUNG: "Round to (round start up, end down)",
    EINR_PUFFER_STD: "Default buffer time (minutes, for unknown locations)",
    EINR_PUFFER_STD_HINT: "0 = no buffer. Applies when no location text is recognized.",
    EINR_PUFFER_ORTE_TITEL: "Location-based travel times",
    EINR_PUFFER_LEER: "None added — default buffer applies everywhere.",
    EINR_PUFFER_ORT_PLACEHOLDER: "Location text (e.g. Berliner Tor)",
    EINR_PUFFER_VOR: "Before appointment (min)",
    EINR_PUFFER_NACH: "After appointment (min)",
    EINR_PDF_NAME: "Your name for the PDF",
    EINR_PDF_NAME_PLACEHOLDER: "e.g. Max Mustermann",
    EINR_KW_SYSTEM: "Calendar week system",
    EINR_KW_KEINE: "No week label",
    EINR_KW_ISO: "ISO weeks (Monday–Sunday)",
    EINR_KW_TKMAXX: "TK Maxx (Sunday–Saturday, with anchor date)",
    EINR_ANKERDATUM: "Anchor date (Sunday of first week)",
    EINR_ANKERDATUM_HINT: "Must be a Sunday, e.g. 2026-02-01.",
    EINR_PDF_FUSSZEILE: "PDF footer",
    EINR_PDF_FUSSZEILE_PLACEHOLDER: "e.g. Shiftslot",
    EINR_SPERR_FRAGE: "Are there recurring appointments that are always blocked (lectures, prayers, etc.)? Leave empty if none apply.",
    EINR_SPERR_BEZEICHNUNG_PLACEHOLDER: "Name (e.g. lecture, Friday prayer)",
    EINR_VAL_BUNDESLAND: "Please select a state.",
    EINR_VAL_WOCHENTAGE: "At least one day of the week must be selected.",
    EINR_VAL_ZEITFENSTER: "Earliest must be before latest.",
    EINR_VAL_MINDESTDAUER: "Minimum duration must be greater than 0 minutes.",
    EINR_VAL_MINDESTDAUER_FENSTER: "Minimum duration ({mindest} min) exceeds the time window ({fenster} min).",
    EINR_VAL_RUNDUNG: "Rounding must be 15, 30, or 60 minutes.",
    EINR_VAL_ORT_LEER: "Location text cannot be empty.",
    EINR_VAL_PUFFER_NEGATIV: "Buffer times must be 0 or greater.",
    EINR_VAL_PDF_NAME: "Please enter your name for the PDF.",
    EINR_VAL_ANKERDATUM: "Please enter an anchor date for the TK Maxx week system.",
    EINR_VAL_SPERRZEIT_FELDER: "All fields of a blocked time must be filled in.",
    EINR_VAL_SPERRZEIT_ZEITEN: "Start time of a blocked slot must be before the end time.",
    EINR_SPEICHERN_FEHLER: "Save failed.",
    SEKTION_NEUIGKEITEN: "What's new",
    UPD_DIALOG_TITEL: "What's new in Shiftslot",
    UPD_VERSION_PREFIX: "Version",
    UPD_LOSGEH: "Let's go",
    UPD_ZUM_PROFIL: "Profile → What's new",
    UPD_2_1_0_ITEM1: "New name and look: Stundenfassen is now Shiftslot – with a new logo and app icon",
    UPD_2_1_0_ITEM2: "New sign-in screen with animated logo",
    UPD_2_1_0_ITEM3: "Four languages: German, English, Russian, French – choose on the sign-in screen or under Profile → Language; separate document language",
    UPD_2_1_0_ITEM4: "Light, dark or automatic appearance – under Profile → Appearance or directly on the sign-in screen",
    UPD_2_1_0_ITEM5: "Calmer loading: new Shiftslot loader everywhere, \"Try again\" after timeout, helpful card when no employer is set up",
    UPD_2_1_0_ITEM6: "Better calendar handling: clearer errors per calendar, one broken calendar doesn't block others, \"As of: …\" banner, improved iCal link help",
    UPD_2_1_0_ITEM7: "Your data, your control: privacy policy and legal notice inside the app, export data as a file, delete account from Profile",
    UPD_2_1_0_ITEM9: "New web address: {url} – Apps installed on the home screen from the old address keep working; for the new icon and address, open the new URL and add it to your home screen again",
    UPD_2_0_ITEM1: "Set up availability per employer: weekdays, earliest and latest time, minimum duration, travel times",
    UPD_2_0_ITEM2: "Block fixed times, e.g. prayer time, university or study group",
    UPD_2_0_ITEM3: "Your name in the PDF: you decide what appears in the header",
    UPD_2_0_ITEM4: "Public holidays by the employer's state",
    UPD_2_0_ITEM5: "Send availability by email, with templates and CC",
    UPD_2_0_ITEM6: "Minus hours per employer, optionally shown in PDF",
    UPD_2_0_ITEM7: "Flat-rate wage tax per employer (for short-term employment)",
    UPD_2_0_ITEM8: "Calendar loads faster and updates when you return to the app",
    UPD_2_0_ITEM9: "Sign out in the Profile tab",
    SE_TAB_ARBEITSZEIT: "Working hours",
    SE_TAB_MINUS: "Negative hours",
    SE_NEUE_SCHICHT: "New shift",
    SE_PAUSE_VON: "Break from",
    SE_PAUSE_BIS: "Break until",
    SE_LETZTE_KOPIEREN: "↩ Copy last",
    SE_SCHICHT_SPEICHERN: "Save shift",
    SE_FEHLER_PAUSE: "Break from and Break until must both be given or both empty.",
    SE_FEHLER_SCHICHT: "Shift could not be saved.",
    SE_MINUS_EINTRAGEN: "Enter negative hours",
    SE_MINUS_HINWEIS: "Appear in the availability PDF top right.",
    SE_PH_STUNDEN: "e.g. 2 or 1.5",
    SE_GRUND_NOTIZ: "Reason / Note",
    SE_PH_NOTIZ: "e.g. sick note, correction",
    SE_MINUS_SPEICHERN: "Save negative hours",
    SE_FEHLER_STUNDEN: "Please enter a positive number of hours.",
    SE_FEHLER_EINTRAG: "Entry could not be saved.",
    SPAL_WOCHENTAG: "Weekday",
    SPAL_STD: "Hrs",
    SPAL_BRUTTO: "Gross",
    SCHICHT_BEARBEITEN_ARIA: "Edit shift",
    SCHICHT_LOESCHEN_ARIA: "Delete shift",
    PAUSE_ZU_KURZ: "Break too short",
    PAUSE_LABEL: "Break",
    MONAT_KEINE_SCHICHTEN: "No shifts this month",
    MONAT_SCHICHTEN_EINZEL: "1 shift",
    MONAT_SCHICHTEN_N: "{{n}} shifts",
    VERFUEG_WARN_TITEL: "Availability not set up",
    VERFUEG_WARN_TEXT: "Availability view is not yet configured for this employer. Continue anyway?",
    TROTZDEM_FORTFAHREN: "Continue anyway",
    PDF_ERSTELLEN_BTN: "↓ Create PDF",
    PDF_LAEDT_BTN: "Creating PDF…",
    EMAIL_PER_EMAIL_BTN: "✉ Send by e-mail",
    GESENDET: "Sent!",
    SCHLIESSEN_COUNTDOWN: "Close ({{s}}s)",
    EMAIL_VORLAGE_VOR: "Please first create a template in the",
    EMAIL_VORLAGE_LINK: "Profile tab",
    EMAIL_VORLAGE_NACH: ".",
    VORLAGE_DIALOG_LABEL: "Template",
    AN_LABEL: "To",
    VORSCHAU_LABEL: "Preview",
    BETREFF_LABEL: "Subject:",
    KEIN_EMAIL_KONTO_TITEL: "No e-mail account linked",
    KEIN_EMAIL_KONTO_VOR: "Please first set up your Gmail account in the",
    KEIN_EMAIL_KONTO_LINK: "Profile tab →",
    CC_FEHLER: "Invalid e-mail address(es) — separate multiple with a comma.",
    SENDET_LABEL: "Sending…",
    SENDEN_BTN: "✉ Send",
    DOK_SPRACHE_LABEL: "Document language",
    VORLAGE_PH_BETREFF: "Availability {{zeitraum_von}} – {{zeitraum_bis}}",
  },
  ru: {
    LAEDT: "Загрузка…",
    ERNEUT_VERSUCHEN: "Повторить",
    LADE_FEHLER_PREFIX: "Ошибка:",
    LOESCHEN: "Удалить",
    ABBRECHEN: "Отмена",
    HINZUFUEGEN: "Добавить",
    ARBEITGEBER_LABEL: "Работодатель",
    DATUM_LABEL: "Дата",
    JETZT_EINRICHTEN: "Настроить сейчас",
    KEIN_ARBEITGEBER_TITEL: "Работодатель не добавлен",
    KEIN_ARBEITGEBER_TEXT: "Сначала добавьте работодателя, чтобы использовать эту страницу.",
    KEIN_ARBEITGEBER_CTA: "Добавить работодателя →",
    THEME_ARIA_LABEL: "Цветовая схема",
    THEME_SYSTEM: "Авто",
    THEME_LIGHT: "Светлая",
    THEME_DARK: "Тёмная",
    THEME_SYSTEM_ARIA: "Системная тема",
    THEME_LIGHT_ARIA: "Светлая тема",
    THEME_DARK_ARIA: "Тёмная тема",
    AUTH_LAEDT_FEHLER: "Вход занимает слишком долго — перезагрузите приложение.",
    AUTH_NEU_LADEN: "Перезагрузить",
    AUTH_FEHLER_DOMAIN: "Этот домен не разрешён для входа.",
    AUTH_FEHLER_POPUP_BLOCKIERT: "Окно входа заблокировано. Разрешите всплывающие окна для этого сайта и попробуйте снова.",
    AUTH_REAUTH_POPUP_BLOCKIERT: "Всплывающее окно входа заблокировано. Откройте приложение в браузере (Safari → Поделиться → Открыть в браузере) и повторите попытку.",
    AUTH_FEHLER_NETZWERK: "Нет подключения к сети. Проверьте интернет-соединение.",
    AUTH_FEHLER_ABGEBROCHEN: "Вход отменён. Попробуйте ещё раз.",
    AUTH_FEHLER_ALLGEMEIN: "Вход не выполнен. Попробуйте ещё раз.",
    ANMELDEN_LAEUFT: "Вход…",
    MIT_GOOGLE_ANMELDEN: "Войти через Google",
    ANMELDUNG_ZUSTIMMUNG_PRAEFIX: "Регистрируясь, вы принимаете",
    DATENSCHUTZERKLAERUNG: "Политику конфиденциальности",
    DATENSCHUTZ: "Конфиденциальность",
    IMPRESSUM: "Об авторе",
    TAGLINE: "Смены, часы, свободное время",
    TAB_HOME: "Главная",
    TAB_KALENDER: "Календарь",
    TAB_SCHICHTEN: "Смены",
    TAB_PROFIL: "Профиль",
    SCHICHTEN_KW_PREFIX: "НД",
    SCHICHTEN_ARIA_PREV: "Предыдущая неделя",
    SCHICHTEN_ARIA_NEXT: "Следующая неделя",
    SCHICHTEN_EINGETEILT: "Запланировано",
    SCHICHTEN_ANGEBOTEN_PDF: "Предложено (последний PDF)",
    SCHICHTEN_NEUE_EINTRAGEN: "Добавить смену",
    SCHICHTEN_KEINE_DIESE_WOCHE: "Нет смен на этой неделе.",
    SCHICHTEN_ERSTE_EINTRAGEN: "Добавить первую →",
    SCHICHTEN_UNBEKANNTER_AG: "Неизвестно",
    SCHICHTEN_UEBERNOMMEN: "✓ Добавлено в табель",
    SCHICHTEN_UEBERNEHMEN: "Добавить в табель →",
    SCHICHTEN_LOESCHEN_FRAGE: "Удалить смену {datum}?",
    SCHICHTEN_FORM_START: "Начало",
    SCHICHTEN_FORM_ENDE: "Конец",
    VERF_TITEL: "Доступность",
    VERF_KALENDER_AKTUALISIEREN: "Обновить календарь",
    VERF_AB_LABEL: "С (привязывается к воскресенью)",
    VERF_WOCHEN_LABEL: "Недели",
    VERF_BUNDESLAND_LABEL: "Земля (праздники)",
    VERF_NICHT_EINGERICHTET: "Для {name} доступность ещё не настроена",
    VERF_GOOGLE_HINWEIS: "Примечание: Google может обновлять фиды календарей с задержкой несколько часов.",
    VERF_KEINE_KALENDER: "Календари ещё не добавлены.",
    VERF_KALENDER_PROFIL_VOR: "Добавьте календари в",
    VERF_KALENDER_PROFIL_LINK: "Профиль → Календари",
    VERF_KALENDER_PROFIL_NACH: ".",
    VERF_AUSGEWAEHLT: "Выбрано",
    VERF_WOCHE: "Неделя",
    VERF_NICHT_VERFUEGBAR: "— недоступно",
    VERF_KEINE_BLOECKE: "— нет свободных блоков ≥ {min}",
    VERF_SCHICHTEN_LADEN_FEHLER: "Смены других работодателей не удалось загрузить — доступность рассчитана без этих блокировок.",
    VERF_KALENDER_FEHLER_MIT_STAND: "Календарь «{name}» не удалось загрузить – данные на {stand}",
    VERF_KALENDER_FEHLER_OHNE_STAND: "Календарь «{name}» не удалось загрузить – рассчитано без него",
    VERF_ZULETZT_EXPORTIERT: "Недавно экспортировано",
    PROFIL_TITEL: "Профиль",
    SEKTION_KALENDER: "Календари",
    SEKTION_ARBEITGEBER: "Работодатели",
    SEKTION_MINUSSTUNDEN: "Минус-часы",
    SEKTION_EMAIL_VORLAGEN: "Шаблоны писем",
    SEKTION_EMAIL_VERSAND: "Отправка писем",
    SEKTION_STEUER: "Настройки налогов",
    SEKTION_SPRACHE: "Язык",
    SEKTION_ERSCHEINUNGSBILD: "Оформление",
    SEKTION_KONTO: "Аккаунт",
    KAL_VERWALTEN: "Управление календарями",
    KAL_NEU_ARIA: "Добавить новый календарь",
    KAL_NOCH_KEINE: "Календарей пока нет.",
    KAL_ERSTEN_ANLEGEN: "Добавить первый →",
    KAL_LOESCHEN_FRAGE: "Удалить «{name}»?",
    KAL_BEARBEITEN: "Редактировать",
    KAL_SCHLIESSEN: "Закрыть",
    KAL_TERMINE_PRUEFEN: "Проверить события",
    KAL_FORM_DEFAULT_STATUS: "Статус по умолчанию:",
    KAL_FORM_URL_HINT_BEARBEITUNG: "Заполняйте URL только если хотите его изменить.",
    KAL_FORM_URL_HINT_NEU: "Ссылка iCal (экспорт календаря). Для Google: «Секретный адрес в формате iCal». Для порталов вузов: ссылка на экспорт iCal. Адрес — как пароль.",
    KAL_FORM_PUBLIC_WARNUNG: "Это публичный адрес. Он работает только если ваш календарь публичный. Иначе используйте секретный адрес (…/private-…/basic.ics).",
    KAL_FORM_URL_PLACEHOLDER_BEARBEITUNG: "Новый URL (оставьте пустым = без изменений)",
    KAL_PLACEHOLDER_NAME: "Название (напр. расписание ВУЗа)",
    AG_VERWALTEN: "Управление работодателями",
    ZURUECK: "Назад",
    AG_NEU_ARIA: "Новый работодатель",
    AG_KEINE: "Работодателей пока нет.",
    AG_ERSTEN_ANLEGEN: "Добавить первого →",
    AG_ARCHIVIERT: "{count} в архиве",
    AG_VERF_AENDERN: "Изменить настройки доступности",
    AG_VERF_EINRICHTEN: "Настроить доступность",
    ARCHIVIEREN: "В архив",
    REAKTIVIEREN: "Восстановить",
    AG_BESCHAEFTIGUNGSART: "Тип занятости",
    AG_STUNDENLOHN: "Почасовая оплата (EUR)",
    AG_PERSONALNUMMER: "Табельный номер",
    AG_ZUSCHLAG_SO: "Воскр. %",
    AG_ZUSCHLAG_FT: "Праздник %",
    AG_ZUSCHLAG_NACHT: "Ночь %",
    AG_ART_WERKSTUDENT: "Студент-работник",
    AG_ART_KURZFRISTIG: "Краткосрочный",
    AG_ART_MINIJOB: "Мини-джоб",
    AG_ART_SONSTIGES: "Прочее",
    AG_ABBR_SO: "Вс",
    AG_ABBR_FT: "Пр",
    AG_ABBR_NACHT: "Ночь",
    AG_PLACEHOLDER_NAME: "напр. TechCorp GmbH",
    AG_PLACEHOLDER_PERSONALNR: "напр. 123456",
    MINUS_EINTRAEGE: "Записи",
    MINUS_NEU_ARIA: "Добавить минус-часы",
    MINUS_KEINE: "Минус-часов не записано.",
    MINUS_ERSTEN_EINTRAGEN: "Добавить первую запись →",
    MINUS_LOESCHEN_FRAGE: "Удалить запись?",
    MINUS_PDF_ANZEIGE: "Отображение в PDF",
    MINUS_PDF_LABEL: "Минус-часы в PDF",
    MINUS_PDF_ARIA: "Показывать минус-часы в PDF",
    MINUS_ZUERST_AG: "Сначала добавьте работодателя.",
    MINUS_AG_WAEHLEN: "Выбрать работодателя…",
    MINUS_STUNDEN: "Часы",
    MINUS_GRUND: "Причина",
    VORLAGE_HEADER: "Шаблоны",
    VORLAGE_NEU_ARIA: "Новый шаблон",
    VORLAGE_NOCH_KEINE: "Шаблонов пока нет.",
    VORLAGE_ERSTE_ANLEGEN: "Создать первый →",
    VORLAGE_BEARBEITEN: "Редактировать",
    VORLAGE_LOESCHEN_FRAGE: "Удалить «{name}»?",
    VORLAGE_PLATZHALTER: "Заполнители:",
    VORLAGE_NAME: "Название шаблона",
    VORLAGE_EMPFAENGER: "Получатель (Кому)",
    VORLAGE_OPT_MEHRERE: "необязательно, несколько через запятую",
    VORLAGE_BETREFF: "Тема",
    VORLAGE_TEXT: "Текст",
    VORLAGE_ANLEGEN: "Создать",
    EMAIL_VERSAND_VOR_LINK: "Доступность отправляется через ваш аккаунт Gmail. Вам нужен",
    EMAIL_VERSAND_LINK: "пароль приложения",
    EMAIL_VERSAND_NACH_LINK: "(включить 2FA → myaccount.google.com/apppasswords).",
    EMAIL_GMAIL_ADRESSE: "Адрес Gmail",
    EMAIL_APP_PASSWORT: "Пароль приложения",
    EMAIL_APP_PASSWORT_NEU: "ввести заново",
    EMAIL_AENDERN: "Изменить",
    EMAIL_ENTFERNEN: "Удалить",
    EMAIL_ENTFERNEN_FRAGE: "Удалить аккаунт электронной почты?",
    EMAIL_AKTUALISIEREN: "Обновить",
    STEUER_KLASSE: "Налоговый класс",
    STEUER_KIRCHENSTEUER: "Церковный налог",
    STEUER_PAUSCHAL: "Паушальный налог 25% (§40a EStG)",
    FARBSCHEMA: "Цветовая схема",
    ANGEMELDET_ALS: "Вы вошли как",
    ABMELDEN: "Выйти",
    DATEN_EXPORTIEREN: "Экспортировать данные",
    SPEICHERN: "Сохранить",
    SPEICHERT: "Сохраняется…",
    BEARBEITEN: "Редактировать",
    SCHLIESSEN: "Закрыть",
    ANLEGEN: "Создать",
    EINTRAGEN: "Ввести",
    ARIA_VORMONAT: "Предыдущий месяц",
    ARIA_NAECHSTER_MONAT: "Следующий месяц",
    ARIA_FARBE: "Цвет",
    OPTIONAL: "необязательно",
    ABMELDEN_FRAGE: "Выйти из аккаунта?",
    ABMELDEN_BESTAETIGUNG: "Вы выйдете как {email}. Локальные данные (кеш календаря, выборка) будут удалены.",
    KONTO_LOESCHEN_TITEL: "Удалить аккаунт безвозвратно?",
    KONTO_LOESCHEN_WARNUNG: "Это действие нельзя отменить. Будет удалено:",
    KONTO_LOESCHEN_ITEM1: "Все смены, работодатели и настройки",
    KONTO_LOESCHEN_ITEM2: "Шаблоны писем и сверки расчётов",
    KONTO_LOESCHEN_ITEM3: "Запланированные смены и записи минус-часов",
    KONTO_LOESCHEN_ITEM4: "URL-адреса календарей (включая токены) и кеш iCal",
    KONTO_LOESCHEN_ITEM5: "Данные для входа в Gmail",
    KONTO_LOESCHEN_ITEM6: "Доступ вашего аккаунта Google к этому приложению",
    KONTO_LOESCHEN_POPUP: "Откроется всплывающее окно Google для подтверждения личности.",
    KONTO_LOESCHEN_EINGABE: "Введите ваш email или УДАЛИТЬ",
    KONTO_LOESCHEN_BTN: "Удалить аккаунт",
    KONTO_LOESCHEN_LAEUFT: "Удаление…",
    KONTO_LOESCHEN_WORT: "УДАЛИТЬ",
    EXPORT_TITEL: "Экспортировать данные",
    EXPORT_ENTHAELT: "Файл экспорта содержит:",
    EXPORT_ITEM1: "Смены, работодатели, настройки",
    EXPORT_ITEM2: "Минус-часы, запланированные смены, сверки",
    EXPORT_ITEM3: "Шаблоны писем",
    EXPORT_ITEM4: "Адрес Gmail (если указан)",
    EXPORT_ITEM5: "Список календарей (название, цвет — без URL)",
    EXPORT_NICHT_ENTHALTEN: "Не включено:",
    EXPORT_NICHT_ENTHALTEN_TEXT: "Пароли и URL-адреса iCal. URL-адреса iCal содержат персональные токены аутентификации и не экспортируются.",
    EXPORT_DATENSCHUTZ: "Файл содержит персональные данные — храните его в безопасном месте.",
    EXPORT_HERUNTERGELADEN: "Экспорт загружен.",
    EXPORT_HERUNTERLADEN: "Скачать",
    EXPORT_LAEUFT: "Создаётся…",
    TERMIN_VON: "С",
    TERMIN_BIS: "По",
    TERMIN_LADEN: "Загрузить",
    TERMIN_KEINE: "События ещё не загружены.",
    TERMIN_SUMMARY: "{count} событий · {locked} LOCKED · {flexible} FLEXIBLE",
    SPAETER: "Позже",
    WEITER: "Далее →",
    BESTAETIGEN: "Подтвердить",
    TAG_SO: "Вс",
    TAG_MO: "Пн",
    TAG_DI: "Вт",
    TAG_MI: "Ср",
    TAG_DO: "Чт",
    TAG_FR: "Пт",
    TAG_SA: "Сб",
    TAG_LANG_SO: "Воскресенье",
    TAG_LANG_MO: "Понедельник",
    TAG_LANG_DI: "Вторник",
    TAG_LANG_MI: "Среда",
    TAG_LANG_DO: "Четверг",
    TAG_LANG_FR: "Пятница",
    TAG_LANG_SA: "Суббота",
    EINR_TITEL_BUNDESLAND: "Регион",
    EINR_TITEL_WOCHENTAGE: "Дни недели",
    EINR_TITEL_ZEITFENSTER: "Временной диапазон",
    EINR_TITEL_WEGEZEITEN: "Время в пути",
    EINR_TITEL_PDF: "Настройки PDF",
    EINR_TITEL_SPERRZEITEN: "Заблокированные часы",
    EINR_SCHRITT_VON: "Шаг {step} из {total}",
    EINR_EINSCHRAENKUNGEN: "Какие ограничения действуют у {name}?",
    EINR_BUNDESLAND_FRAGE: "В каком регионе вы работаете у этого работодателя? (Для расчёта праздников)",
    EINR_BUNDESLAND_PLACEHOLDER: "Выбрать регион…",
    EINR_WOCHENTAGE_FRAGE: "В какие дни вы можете работать?",
    EINR_WOCHENSTART: "Начало недели в PDF",
    EINR_WOCHENSTART_SO: "Воскресенье (напр. TK Maxx)",
    EINR_FRUEHESTENS: "Не раньше",
    EINR_SPAETESTENS: "Не позже",
    EINR_MINDESTDAUER: "Минимальная длина блока (мин)",
    EINR_RUNDUNG: "Округлять (начало вверх, конец вниз)",
    EINR_PUFFER_STD: "Стандартное буферное время (мин, для неизвестных мест)",
    EINR_PUFFER_STD_HINT: "0 = без буфера. Применяется, если место не распознано.",
    EINR_PUFFER_ORTE_TITEL: "Буферное время по месту",
    EINR_PUFFER_LEER: "Нет записей — стандартный буфер применяется везде.",
    EINR_PUFFER_ORT_PLACEHOLDER: "Текст места (напр. Berliner Tor)",
    EINR_PUFFER_VOR: "До встречи (мин)",
    EINR_PUFFER_NACH: "После встречи (мин)",
    EINR_PDF_NAME: "Ваше имя для PDF",
    EINR_PDF_NAME_PLACEHOLDER: "напр. Иван Иванов",
    EINR_KW_SYSTEM: "Система календарных недель",
    EINR_KW_KEINE: "Без метки недели",
    EINR_KW_ISO: "ISO-недели (Пн–Вс)",
    EINR_KW_TKMAXX: "TK Maxx (Вс–Сб, с якорной датой)",
    EINR_ANKERDATUM: "Якорная дата (воскресенье первой недели)",
    EINR_ANKERDATUM_HINT: "Должно быть воскресенье, напр. 2026-02-01.",
    EINR_PDF_FUSSZEILE: "Нижний колонтитул PDF",
    EINR_PDF_FUSSZEILE_PLACEHOLDER: "напр. Shiftslot",
    EINR_SPERR_FRAGE: "Есть ли регулярные занятия, всегда заблокированные (лекции, молитвы и т. д.)? Оставьте пустым, если нет.",
    EINR_SPERR_BEZEICHNUNG_PLACEHOLDER: "Название (напр. лекция, пятничная молитва)",
    EINR_VAL_BUNDESLAND: "Пожалуйста, выберите регион.",
    EINR_VAL_WOCHENTAGE: "Нужно выбрать хотя бы один день недели.",
    EINR_VAL_ZEITFENSTER: "Начало должно быть раньше конца.",
    EINR_VAL_MINDESTDAUER: "Минимальная продолжительность должна быть больше 0 минут.",
    EINR_VAL_MINDESTDAUER_FENSTER: "Минимальная длина ({mindest} мин) превышает диапазон ({fenster} мин).",
    EINR_VAL_RUNDUNG: "Округление должно быть 15, 30 или 60 минут.",
    EINR_VAL_ORT_LEER: "Текст места не может быть пустым.",
    EINR_VAL_PUFFER_NEGATIV: "Буферное время должно быть не менее 0.",
    EINR_VAL_PDF_NAME: "Введите ваше имя для PDF.",
    EINR_VAL_ANKERDATUM: "Введите якорную дату для системы недель TK Maxx.",
    EINR_VAL_SPERRZEIT_FELDER: "Все поля блокировки должны быть заполнены.",
    EINR_VAL_SPERRZEIT_ZEITEN: "Начало блокировки должно быть раньше конца.",
    EINR_SPEICHERN_FEHLER: "Ошибка сохранения.",
    SEKTION_NEUIGKEITEN: "Новости",
    UPD_DIALOG_TITEL: "Что нового в Shiftslot",
    UPD_VERSION_PREFIX: "Версия",
    UPD_LOSGEH: "Начать",
    UPD_ZUM_PROFIL: "Профиль → Новости",
    UPD_2_1_0_ITEM1: "Новое имя и внешний вид: Stundenfassen теперь называется Shiftslot – новый логотип и значок приложения",
    UPD_2_1_0_ITEM2: "Новый экран входа с анимированным логотипом",
    UPD_2_1_0_ITEM3: "Четыре языка: немецкий, английский, русский, французский – выбор на экране входа или в разделе Профиль → Язык; отдельный язык документа",
    UPD_2_1_0_ITEM4: "Светлое, тёмное или автоматическое оформление – в разделе Профиль → Оформление или прямо на экране входа",
    UPD_2_1_0_ITEM5: "Спокойная загрузка: новый загрузчик Shiftslot везде, «Повторить» после таймаута, подсказка при отсутствии работодателя",
    UPD_2_1_0_ITEM6: "Улучшенная работа с календарями: чёткие ошибки по каждому календарю, один сломанный не блокирует другие, баннер «Данные на: …», улучшенная справка по iCal-ссылке",
    UPD_2_1_0_ITEM7: "Ваши данные, ваш контроль: политика конфиденциальности и правовая информация в приложении, экспорт данных в файл, удаление аккаунта из раздела Профиль",
    UPD_2_1_0_ITEM9: "Новый веб-адрес: {url} – Приложения, добавленные на главный экран со старого адреса, продолжают работать; для нового значка и адреса откройте новый URL и добавьте приложение снова",
    UPD_2_0_ITEM1: "Настройка доступности для каждого работодателя: дни недели, ранний и поздний предел, минимальная длительность, время в пути",
    UPD_2_0_ITEM2: "Блокировка фиксированных периодов, например времени молитвы, занятий или учёбы",
    UPD_2_0_ITEM3: "Ваше имя в PDF: вы сами решаете, что отображается в заголовке",
    UPD_2_0_ITEM4: "Праздники по федеральной земле работодателя",
    UPD_2_0_ITEM5: "Отправка доступности по электронной почте с шаблонами и копией",
    UPD_2_0_ITEM6: "Минус-часы для каждого работодателя, опционально в PDF",
    UPD_2_0_ITEM7: "Паушальный подоходный налог для каждого работодателя (при краткосрочной занятости)",
    UPD_2_0_ITEM8: "Календарь загружается быстрее и обновляется при возвращении в приложение",
    UPD_2_0_ITEM9: "Выход в разделе Профиль",
    SE_TAB_ARBEITSZEIT: "Рабочее время",
    SE_TAB_MINUS: "Минус-часы",
    SE_NEUE_SCHICHT: "Новая смена",
    SE_PAUSE_VON: "Перерыв с",
    SE_PAUSE_BIS: "Перерыв до",
    SE_LETZTE_KOPIEREN: "↩ Копировать последнюю",
    SE_SCHICHT_SPEICHERN: "Сохранить смену",
    SE_FEHLER_PAUSE: "«Перерыв с» и «Перерыв до» должны быть указаны оба или оба пусты.",
    SE_FEHLER_SCHICHT: "Не удалось сохранить смену.",
    SE_MINUS_EINTRAGEN: "Ввести минус-часы",
    SE_MINUS_HINWEIS: "Отображается в PDF доступности вверху справа.",
    SE_PH_STUNDEN: "напр. 2 или 1.5",
    SE_GRUND_NOTIZ: "Причина / Заметка",
    SE_PH_NOTIZ: "напр. больничный, корректировка",
    SE_MINUS_SPEICHERN: "Сохранить минус-часы",
    SE_FEHLER_STUNDEN: "Пожалуйста, введите положительное количество часов.",
    SE_FEHLER_EINTRAG: "Не удалось сохранить запись.",
    SPAL_WOCHENTAG: "День недели",
    SPAL_STD: "Ч",
    SPAL_BRUTTO: "Брутто",
    SCHICHT_BEARBEITEN_ARIA: "Редактировать смену",
    SCHICHT_LOESCHEN_ARIA: "Удалить смену",
    PAUSE_ZU_KURZ: "Перерыв слишком короткий",
    PAUSE_LABEL: "Перерыв",
    MONAT_KEINE_SCHICHTEN: "В этом месяце нет смен",
    MONAT_SCHICHTEN_EINZEL: "1 смена",
    MONAT_SCHICHTEN_N: "{{n}} смен",
    VERFUEG_WARN_TITEL: "Доступность не настроена",
    VERFUEG_WARN_TEXT: "Для этого работодателя доступность ещё не настроена. Продолжить всё равно?",
    TROTZDEM_FORTFAHREN: "Продолжить",
    PDF_ERSTELLEN_BTN: "↓ Создать PDF",
    PDF_LAEDT_BTN: "Создаю PDF…",
    EMAIL_PER_EMAIL_BTN: "✉ По e-mail",
    GESENDET: "Отправлено!",
    SCHLIESSEN_COUNTDOWN: "Закрыть ({{s}}с)",
    EMAIL_VORLAGE_VOR: "Сначала создайте шаблон во вкладке",
    EMAIL_VORLAGE_LINK: "Профиль",
    EMAIL_VORLAGE_NACH: ".",
    VORLAGE_DIALOG_LABEL: "Шаблон",
    AN_LABEL: "Кому",
    VORSCHAU_LABEL: "Предпросмотр",
    BETREFF_LABEL: "Тема:",
    KEIN_EMAIL_KONTO_TITEL: "E-mail аккаунт не привязан",
    KEIN_EMAIL_KONTO_VOR: "Сначала настройте Gmail во вкладке",
    KEIN_EMAIL_KONTO_LINK: "Профиль →",
    CC_FEHLER: "Недействительный e-mail — несколько адресов разделяйте запятой.",
    SENDET_LABEL: "Отправка…",
    SENDEN_BTN: "✉ Отправить",
    DOK_SPRACHE_LABEL: "Язык документов",
    VORLAGE_PH_BETREFF: "Доступность {{zeitraum_von}} – {{zeitraum_bis}}",
  },
  fr: {
    LAEDT: "Chargement…",
    ERNEUT_VERSUCHEN: "Réessayer",
    LADE_FEHLER_PREFIX: "Erreur :",
    LOESCHEN: "Supprimer",
    ABBRECHEN: "Annuler",
    HINZUFUEGEN: "Ajouter",
    ARBEITGEBER_LABEL: "Employeur",
    DATUM_LABEL: "Date",
    JETZT_EINRICHTEN: "Configurer maintenant",
    KEIN_ARBEITGEBER_TITEL: "Aucun employeur ajouté",
    KEIN_ARBEITGEBER_TEXT: "Ajoutez d'abord un employeur pour utiliser cette page.",
    KEIN_ARBEITGEBER_CTA: "Ajouter un employeur →",
    THEME_ARIA_LABEL: "Thème",
    THEME_SYSTEM: "Auto",
    THEME_LIGHT: "Clair",
    THEME_DARK: "Sombre",
    THEME_SYSTEM_ARIA: "Thème système",
    THEME_LIGHT_ARIA: "Thème clair",
    THEME_DARK_ARIA: "Thème sombre",
    AUTH_LAEDT_FEHLER: "La connexion prend trop de temps — rechargez l'application.",
    AUTH_NEU_LADEN: "Recharger",
    AUTH_FEHLER_DOMAIN: "Ce domaine n'est pas autorisé pour la connexion.",
    AUTH_FEHLER_POPUP_BLOCKIERT: "La fenêtre de connexion a été bloquée. Autorisez les fenêtres contextuelles pour ce site et réessayez.",
    AUTH_REAUTH_POPUP_BLOCKIERT: "La fenêtre contextuelle de connexion a été bloquée. Ouvrez l'application dans votre navigateur (Safari → Partager → Ouvrir dans le navigateur) et réessayez.",
    AUTH_FEHLER_NETZWERK: "Pas de connexion réseau. Vérifiez votre connexion internet.",
    AUTH_FEHLER_ABGEBROCHEN: "Connexion annulée. Veuillez réessayer.",
    AUTH_FEHLER_ALLGEMEIN: "Échec de la connexion. Veuillez réessayer.",
    ANMELDEN_LAEUFT: "Connexion…",
    MIT_GOOGLE_ANMELDEN: "Se connecter avec Google",
    ANMELDUNG_ZUSTIMMUNG_PRAEFIX: "En vous connectant, vous acceptez la",
    DATENSCHUTZERKLAERUNG: "Politique de confidentialité",
    DATENSCHUTZ: "Confidentialité",
    IMPRESSUM: "Mentions légales",
    TAGLINE: "Quarts, heures, temps libre",
    TAB_HOME: "Accueil",
    TAB_KALENDER: "Calendrier",
    TAB_SCHICHTEN: "Quarts",
    TAB_PROFIL: "Profil",
    SCHICHTEN_KW_PREFIX: "S",
    SCHICHTEN_ARIA_PREV: "Semaine précédente",
    SCHICHTEN_ARIA_NEXT: "Semaine suivante",
    SCHICHTEN_EINGETEILT: "Planifié",
    SCHICHTEN_ANGEBOTEN_PDF: "Proposé (dernier PDF)",
    SCHICHTEN_NEUE_EINTRAGEN: "Ajouter un quart",
    SCHICHTEN_KEINE_DIESE_WOCHE: "Aucun quart cette semaine.",
    SCHICHTEN_ERSTE_EINTRAGEN: "Ajouter le premier →",
    SCHICHTEN_UNBEKANNTER_AG: "Inconnu",
    SCHICHTEN_UEBERNOMMEN: "✓ Ajouté à la feuille de temps",
    SCHICHTEN_UEBERNEHMEN: "Ajouter à la feuille de temps →",
    SCHICHTEN_LOESCHEN_FRAGE: "Supprimer le quart du {datum} ?",
    SCHICHTEN_FORM_START: "Début",
    SCHICHTEN_FORM_ENDE: "Fin",
    VERF_TITEL: "Disponibilité",
    VERF_KALENDER_AKTUALISIEREN: "Actualiser le calendrier",
    VERF_AB_LABEL: "À partir de (calé sur dimanche)",
    VERF_WOCHEN_LABEL: "Semaines",
    VERF_BUNDESLAND_LABEL: "Land (jours fériés)",
    VERF_NICHT_EINGERICHTET: "La disponibilité n'est pas encore configurée pour {name}",
    VERF_GOOGLE_HINWEIS: "Remarque : Google peut mettre plusieurs heures à mettre à jour les flux de calendrier.",
    VERF_KEINE_KALENDER: "Aucun calendrier ajouté.",
    VERF_KALENDER_PROFIL_VOR: "Ajoutez des calendriers dans",
    VERF_KALENDER_PROFIL_LINK: "Profil → Calendriers",
    VERF_KALENDER_PROFIL_NACH: "pour commencer.",
    VERF_AUSGEWAEHLT: "Sélectionné",
    VERF_WOCHE: "Semaine",
    VERF_NICHT_VERFUEGBAR: "— non disponible",
    VERF_KEINE_BLOECKE: "— aucun bloc libre ≥ {min}",
    VERF_SCHICHTEN_LADEN_FEHLER: "Les quarts d'autres employeurs n'ont pas pu être chargés — la disponibilité est calculée sans ce blocage.",
    VERF_KALENDER_FEHLER_MIT_STAND: "Le calendrier « {name} » n'a pas pu être chargé – mise à jour : {stand}",
    VERF_KALENDER_FEHLER_OHNE_STAND: "Le calendrier « {name} » n'a pas pu être chargé – calculé sans lui",
    VERF_ZULETZT_EXPORTIERT: "Récemment exporté",
    PROFIL_TITEL: "Profil",
    SEKTION_KALENDER: "Calendriers",
    SEKTION_ARBEITGEBER: "Employeurs",
    SEKTION_MINUSSTUNDEN: "Heures négatives",
    SEKTION_EMAIL_VORLAGEN: "Modèles d'e-mail",
    SEKTION_EMAIL_VERSAND: "Envoi d'e-mails",
    SEKTION_STEUER: "Paramètres fiscaux",
    SEKTION_SPRACHE: "Langue",
    SEKTION_ERSCHEINUNGSBILD: "Apparence",
    SEKTION_KONTO: "Compte",
    KAL_VERWALTEN: "Gérer les calendriers",
    KAL_NEU_ARIA: "Ajouter un nouveau calendrier",
    KAL_NOCH_KEINE: "Aucun calendrier pour l'instant.",
    KAL_ERSTEN_ANLEGEN: "Créer le premier →",
    KAL_LOESCHEN_FRAGE: "Supprimer « {name} » ?",
    KAL_BEARBEITEN: "Modifier",
    KAL_SCHLIESSEN: "Fermer",
    KAL_TERMINE_PRUEFEN: "Vérifier les événements",
    KAL_FORM_DEFAULT_STATUS: "Statut par défaut :",
    KAL_FORM_URL_HINT_BEARBEITUNG: "Ne renseignez l'URL que si vous souhaitez la modifier.",
    KAL_FORM_URL_HINT_NEU: "Lien iCal (export du calendrier). Pour Google : « Adresse secrète au format iCal ». Pour les portails universitaires : le lien d'export iCal. L'adresse est comme un mot de passe.",
    KAL_FORM_PUBLIC_WARNUNG: "Il s'agit de l'adresse publique. Elle ne fonctionne que si votre calendrier est public. Sinon, utilisez l'adresse secrète (…/private-…/basic.ics).",
    KAL_FORM_URL_PLACEHOLDER_BEARBEITUNG: "Nouvelle URL (laisser vide = inchangée)",
    KAL_PLACEHOLDER_NAME: "Nom (ex. emploi du temps)",
    AG_VERWALTEN: "Gérer les employeurs",
    ZURUECK: "Retour",
    AG_NEU_ARIA: "Nouvel employeur",
    AG_KEINE: "Aucun employeur pour l'instant.",
    AG_ERSTEN_ANLEGEN: "Ajouter le premier →",
    AG_ARCHIVIERT: "{count} archivé(s)",
    AG_VERF_AENDERN: "Modifier les paramètres de disponibilité",
    AG_VERF_EINRICHTEN: "Configurer la disponibilité",
    ARCHIVIEREN: "Archiver",
    REAKTIVIEREN: "Restaurer",
    AG_BESCHAEFTIGUNGSART: "Type d'emploi",
    AG_STUNDENLOHN: "Salaire horaire (EUR)",
    AG_PERSONALNUMMER: "Numéro de matricule",
    AG_ZUSCHLAG_SO: "Dimanche %",
    AG_ZUSCHLAG_FT: "Jour férié %",
    AG_ZUSCHLAG_NACHT: "Nuit %",
    AG_ART_WERKSTUDENT: "Étudiant salarié",
    AG_ART_KURZFRISTIG: "Courte durée",
    AG_ART_MINIJOB: "Mini-job",
    AG_ART_SONSTIGES: "Autre",
    AG_ABBR_SO: "Dim",
    AG_ABBR_FT: "JF",
    AG_ABBR_NACHT: "Nuit",
    AG_PLACEHOLDER_NAME: "ex. TechCorp GmbH",
    AG_PLACEHOLDER_PERSONALNR: "ex. 123456",
    MINUS_EINTRAEGE: "Entrées",
    MINUS_NEU_ARIA: "Ajouter des heures négatives",
    MINUS_KEINE: "Aucune heure négative enregistrée.",
    MINUS_ERSTEN_EINTRAGEN: "Enregistrer la première →",
    MINUS_LOESCHEN_FRAGE: "Supprimer l'entrée ?",
    MINUS_PDF_ANZEIGE: "Affichage PDF",
    MINUS_PDF_LABEL: "Heures négatives dans le PDF",
    MINUS_PDF_ARIA: "Afficher les heures négatives dans le PDF",
    MINUS_ZUERST_AG: "Veuillez d'abord ajouter un employeur.",
    MINUS_AG_WAEHLEN: "Sélectionner un employeur…",
    MINUS_STUNDEN: "Heures",
    MINUS_GRUND: "Motif",
    VORLAGE_HEADER: "Modèles",
    VORLAGE_NEU_ARIA: "Nouveau modèle",
    VORLAGE_NOCH_KEINE: "Aucun modèle pour l'instant.",
    VORLAGE_ERSTE_ANLEGEN: "Créer le premier →",
    VORLAGE_BEARBEITEN: "Modifier",
    VORLAGE_LOESCHEN_FRAGE: "Supprimer « {name} » ?",
    VORLAGE_PLATZHALTER: "Variables :",
    VORLAGE_NAME: "Nom du modèle",
    VORLAGE_EMPFAENGER: "Destinataire (À)",
    VORLAGE_OPT_MEHRERE: "facultatif, plusieurs séparés par une virgule",
    VORLAGE_BETREFF: "Objet",
    VORLAGE_TEXT: "Texte",
    VORLAGE_ANLEGEN: "Créer",
    EMAIL_VERSAND_VOR_LINK: "Les disponibilités sont envoyées via votre propre compte Gmail. Vous avez besoin d'un",
    EMAIL_VERSAND_LINK: "mot de passe d'application",
    EMAIL_VERSAND_NACH_LINK: "(activer la 2FA → myaccount.google.com/apppasswords).",
    EMAIL_GMAIL_ADRESSE: "Adresse Gmail",
    EMAIL_APP_PASSWORT: "Mot de passe d'application",
    EMAIL_APP_PASSWORT_NEU: "ressaisir",
    EMAIL_AENDERN: "Modifier",
    EMAIL_ENTFERNEN: "Supprimer",
    EMAIL_ENTFERNEN_FRAGE: "Supprimer le compte e-mail ?",
    EMAIL_AKTUALISIEREN: "Mettre à jour",
    STEUER_KLASSE: "Classe fiscale",
    STEUER_KIRCHENSTEUER: "Taxe ecclésiastique",
    STEUER_PAUSCHAL: "Impôt salarial forfaitaire 25 % (§40a EStG)",
    FARBSCHEMA: "Schéma de couleurs",
    ANGEMELDET_ALS: "Connecté en tant que",
    ABMELDEN: "Se déconnecter",
    DATEN_EXPORTIEREN: "Exporter les données",
    SPEICHERN: "Enregistrer",
    SPEICHERT: "Enregistrement…",
    BEARBEITEN: "Modifier",
    SCHLIESSEN: "Fermer",
    ANLEGEN: "Créer",
    EINTRAGEN: "Saisir",
    ARIA_VORMONAT: "Mois précédent",
    ARIA_NAECHSTER_MONAT: "Mois suivant",
    ARIA_FARBE: "Couleur",
    OPTIONAL: "facultatif",
    ABMELDEN_FRAGE: "Se déconnecter ?",
    ABMELDEN_BESTAETIGUNG: "Vous serez déconnecté en tant que {email}. Les données locales (cache calendrier, sélection) seront supprimées.",
    KONTO_LOESCHEN_TITEL: "Supprimer définitivement le compte ?",
    KONTO_LOESCHEN_WARNUNG: "Cette action est irréversible. Les éléments suivants seront supprimés :",
    KONTO_LOESCHEN_ITEM1: "Tous les quarts, employeurs et paramètres",
    KONTO_LOESCHEN_ITEM2: "Modèles d'e-mail et rapprochements de facturation",
    KONTO_LOESCHEN_ITEM3: "Quarts planifiés et entrées d'heures négatives",
    KONTO_LOESCHEN_ITEM4: "URL des calendriers (incl. jetons) et cache iCal",
    KONTO_LOESCHEN_ITEM5: "Identifiants Gmail",
    KONTO_LOESCHEN_ITEM6: "L'accès de votre compte Google à cette application",
    KONTO_LOESCHEN_POPUP: "Une fenêtre contextuelle Google s'ouvrira pour vérifier votre identité.",
    KONTO_LOESCHEN_EINGABE: "Saisissez votre adresse e-mail ou SUPPRIMER",
    KONTO_LOESCHEN_BTN: "Supprimer le compte",
    KONTO_LOESCHEN_LAEUFT: "Suppression…",
    KONTO_LOESCHEN_WORT: "SUPPRIMER",
    EXPORT_TITEL: "Exporter les données",
    EXPORT_ENTHAELT: "Le fichier d'export contient :",
    EXPORT_ITEM1: "Quarts, employeurs, paramètres",
    EXPORT_ITEM2: "Heures négatives, quarts planifiés, rapprochements",
    EXPORT_ITEM3: "Modèles d'e-mail",
    EXPORT_ITEM4: "Adresse Gmail (si renseignée)",
    EXPORT_ITEM5: "Liste des calendriers (nom, couleur – sans URL)",
    EXPORT_NICHT_ENTHALTEN: "Non inclus :",
    EXPORT_NICHT_ENTHALTEN_TEXT: "Mots de passe et URL iCal. Les URL iCal contiennent des jetons d'authentification personnels et ne sont pas exportées.",
    EXPORT_DATENSCHUTZ: "Le fichier contient des données personnelles — veuillez le conserver en lieu sûr.",
    EXPORT_HERUNTERGELADEN: "Export téléchargé.",
    EXPORT_HERUNTERLADEN: "Télécharger",
    EXPORT_LAEUFT: "Création en cours…",
    TERMIN_VON: "De",
    TERMIN_BIS: "À",
    TERMIN_LADEN: "Charger",
    TERMIN_KEINE: "Aucun événement chargé.",
    TERMIN_SUMMARY: "{count} événements · {locked} LOCKED · {flexible} FLEXIBLE",
    SPAETER: "Plus tard",
    WEITER: "Suivant →",
    BESTAETIGEN: "Confirmer",
    TAG_SO: "Dim",
    TAG_MO: "Lun",
    TAG_DI: "Mar",
    TAG_MI: "Mer",
    TAG_DO: "Jeu",
    TAG_FR: "Ven",
    TAG_SA: "Sam",
    TAG_LANG_SO: "Dimanche",
    TAG_LANG_MO: "Lundi",
    TAG_LANG_DI: "Mardi",
    TAG_LANG_MI: "Mercredi",
    TAG_LANG_DO: "Jeudi",
    TAG_LANG_FR: "Vendredi",
    TAG_LANG_SA: "Samedi",
    EINR_TITEL_BUNDESLAND: "Région",
    EINR_TITEL_WOCHENTAGE: "Jours de semaine",
    EINR_TITEL_ZEITFENSTER: "Plage horaire",
    EINR_TITEL_WEGEZEITEN: "Temps de trajet",
    EINR_TITEL_PDF: "Paramètres PDF",
    EINR_TITEL_SPERRZEITEN: "Créneaux bloqués",
    EINR_SCHRITT_VON: "Étape {step} sur {total}",
    EINR_EINSCHRAENKUNGEN: "Quelles contraintes s'appliquent chez {name} ?",
    EINR_BUNDESLAND_FRAGE: "Dans quel Land travaillez-vous chez cet employeur ? (Pour le calcul des jours fériés)",
    EINR_BUNDESLAND_PLACEHOLDER: "Choisir une région…",
    EINR_WOCHENTAGE_FRAGE: "Quels jours pouvez-vous travailler en général ?",
    EINR_WOCHENSTART: "Début de semaine dans le PDF",
    EINR_WOCHENSTART_SO: "Dimanche (ex. TK Maxx)",
    EINR_FRUEHESTENS: "Au plus tôt",
    EINR_SPAETESTENS: "Au plus tard",
    EINR_MINDESTDAUER: "Durée minimale d'un bloc (minutes)",
    EINR_RUNDUNG: "Arrondir (début au plafond, fin au plancher)",
    EINR_PUFFER_STD: "Temps tampon par défaut (minutes, lieux inconnus)",
    EINR_PUFFER_STD_HINT: "0 = pas de tampon. S'applique si aucun lieu n'est reconnu.",
    EINR_PUFFER_ORTE_TITEL: "Temps de trajet par lieu",
    EINR_PUFFER_LEER: "Aucune entrée — le tampon par défaut s'applique partout.",
    EINR_PUFFER_ORT_PLACEHOLDER: "Texte du lieu (ex. Berliner Tor)",
    EINR_PUFFER_VOR: "Avant rendez-vous (min)",
    EINR_PUFFER_NACH: "Après rendez-vous (min)",
    EINR_PDF_NAME: "Votre nom pour le PDF",
    EINR_PDF_NAME_PLACEHOLDER: "ex. Jean Dupont",
    EINR_KW_SYSTEM: "Système de semaines calendaires",
    EINR_KW_KEINE: "Pas d'étiquette de semaine",
    EINR_KW_ISO: "Semaines ISO (lundi–dimanche)",
    EINR_KW_TKMAXX: "TK Maxx (dimanche–samedi, avec date d'ancrage)",
    EINR_ANKERDATUM: "Date d'ancrage (dimanche de la première semaine)",
    EINR_ANKERDATUM_HINT: "Doit être un dimanche, ex. 2026-02-01.",
    EINR_PDF_FUSSZEILE: "Pied de page PDF",
    EINR_PDF_FUSSZEILE_PLACEHOLDER: "ex. Shiftslot",
    EINR_SPERR_FRAGE: "Y a-t-il des rendez-vous récurrents toujours bloqués (cours, prières, etc.) ? Laisser vide si aucun.",
    EINR_SPERR_BEZEICHNUNG_PLACEHOLDER: "Nom (ex. cours, prière du vendredi)",
    EINR_VAL_BUNDESLAND: "Veuillez sélectionner une région.",
    EINR_VAL_WOCHENTAGE: "Au moins un jour de la semaine doit être sélectionné.",
    EINR_VAL_ZEITFENSTER: "L'heure de début doit être avant l'heure de fin.",
    EINR_VAL_MINDESTDAUER: "La durée minimale doit être supérieure à 0 minute.",
    EINR_VAL_MINDESTDAUER_FENSTER: "La durée minimale ({mindest} min) dépasse la plage horaire ({fenster} min).",
    EINR_VAL_RUNDUNG: "L'arrondi doit être de 15, 30 ou 60 minutes.",
    EINR_VAL_ORT_LEER: "Le texte du lieu ne peut pas être vide.",
    EINR_VAL_PUFFER_NEGATIV: "Les temps tampons doivent être supérieurs ou égaux à 0.",
    EINR_VAL_PDF_NAME: "Veuillez entrer votre nom pour le PDF.",
    EINR_VAL_ANKERDATUM: "Veuillez entrer une date d'ancrage pour le système de semaines TK Maxx.",
    EINR_VAL_SPERRZEIT_FELDER: "Tous les champs d'un créneau bloqué doivent être renseignés.",
    EINR_VAL_SPERRZEIT_ZEITEN: "L'heure de début d'un créneau bloqué doit être avant l'heure de fin.",
    EINR_SPEICHERN_FEHLER: "Échec de l'enregistrement.",
    SEKTION_NEUIGKEITEN: "Nouveautés",
    UPD_DIALOG_TITEL: "Nouveautés dans Shiftslot",
    UPD_VERSION_PREFIX: "Version",
    UPD_LOSGEH: "C'est parti",
    UPD_ZUM_PROFIL: "Profil → Nouveautés",
    UPD_2_1_0_ITEM1: "Nouveau nom et nouvelle apparence : Stundenfassen s'appelle désormais Shiftslot – avec un nouveau logo et une nouvelle icône",
    UPD_2_1_0_ITEM2: "Nouvel écran de connexion avec logo animé",
    UPD_2_1_0_ITEM3: "Quatre langues : allemand, anglais, russe, français – à choisir sur l'écran de connexion ou dans Profil → Langue ; langue de document séparée",
    UPD_2_1_0_ITEM4: "Apparence claire, sombre ou automatique – dans Profil → Apparence ou directement sur l'écran de connexion",
    UPD_2_1_0_ITEM5: "Chargement plus calme : nouveau chargeur Shiftslot partout, « Réessayer » après délai, carte d'aide si aucun employeur",
    UPD_2_1_0_ITEM6: "Meilleure gestion des calendriers : erreurs claires par calendrier, un calendrier cassé ne bloque pas les autres, bannière « À jour : … », aide iCal améliorée",
    UPD_2_1_0_ITEM7: "Vos données, votre contrôle : politique de confidentialité et mentions légales dans l'app, export des données en fichier, suppression du compte depuis Profil",
    UPD_2_1_0_ITEM9: "Nouvelle adresse web : {url} – Les apps installées sur l'écran d'accueil depuis l'ancienne adresse continuent de fonctionner ; pour la nouvelle icône et adresse, ouvrez la nouvelle URL et ajoutez-la à l'écran d'accueil",
    UPD_2_0_ITEM1: "Configurer la disponibilité par employeur : jours de la semaine, horaire le plus tôt et le plus tard, durée minimale, temps de trajet",
    UPD_2_0_ITEM2: "Bloquer des créneaux fixes, par ex. prière, cours ou groupe d'étude",
    UPD_2_0_ITEM3: "Votre nom dans le PDF : vous choisissez ce qui apparaît dans l'en-tête",
    UPD_2_0_ITEM4: "Jours fériés selon le Land de l'employeur",
    UPD_2_0_ITEM5: "Envoyer la disponibilité par e-mail, avec modèles et CC",
    UPD_2_0_ITEM6: "Heures négatives par employeur, affichables dans le PDF",
    UPD_2_0_ITEM7: "Impôt sur les salaires forfaitaire par employeur (pour emploi de courte durée)",
    UPD_2_0_ITEM8: "Le calendrier se charge plus vite et se met à jour au retour dans l'app",
    UPD_2_0_ITEM9: "Se déconnecter dans l'onglet Profil",
    SE_TAB_ARBEITSZEIT: "Heures de travail",
    SE_TAB_MINUS: "Heures négatives",
    SE_NEUE_SCHICHT: "Nouveau quart",
    SE_PAUSE_VON: "Pause de",
    SE_PAUSE_BIS: "Pause jusqu'à",
    SE_LETZTE_KOPIEREN: "↩ Copier le dernier",
    SE_SCHICHT_SPEICHERN: "Enregistrer le quart",
    SE_FEHLER_PAUSE: "Pause de et Pause jusqu'à doivent être tous deux renseignés ou tous deux vides.",
    SE_FEHLER_SCHICHT: "Impossible d'enregistrer le quart.",
    SE_MINUS_EINTRAGEN: "Saisir les heures négatives",
    SE_MINUS_HINWEIS: "Apparaît dans le PDF de disponibilité en haut à droite.",
    SE_PH_STUNDEN: "p. ex. 2 ou 1.5",
    SE_GRUND_NOTIZ: "Raison / Note",
    SE_PH_NOTIZ: "p. ex. arrêt maladie, correction",
    SE_MINUS_SPEICHERN: "Enregistrer les heures négatives",
    SE_FEHLER_STUNDEN: "Veuillez saisir un nombre d'heures positif.",
    SE_FEHLER_EINTRAG: "Impossible d'enregistrer la saisie.",
    SPAL_WOCHENTAG: "Jour",
    SPAL_STD: "H",
    SPAL_BRUTTO: "Brut",
    SCHICHT_BEARBEITEN_ARIA: "Modifier le quart",
    SCHICHT_LOESCHEN_ARIA: "Supprimer le quart",
    PAUSE_ZU_KURZ: "Pause trop courte",
    PAUSE_LABEL: "Pause",
    MONAT_KEINE_SCHICHTEN: "Aucun quart ce mois-ci",
    MONAT_SCHICHTEN_EINZEL: "1 quart",
    MONAT_SCHICHTEN_N: "{{n}} quarts",
    VERFUEG_WARN_TITEL: "Disponibilité non configurée",
    VERFUEG_WARN_TEXT: "La vue disponibilité n'est pas encore configurée pour cet employeur. Continuer quand même ?",
    TROTZDEM_FORTFAHREN: "Continuer quand même",
    PDF_ERSTELLEN_BTN: "↓ Créer PDF",
    PDF_LAEDT_BTN: "Création PDF…",
    EMAIL_PER_EMAIL_BTN: "✉ Par e-mail",
    GESENDET: "Envoyé !",
    SCHLIESSEN_COUNTDOWN: "Fermer ({{s}}s)",
    EMAIL_VORLAGE_VOR: "Veuillez d'abord créer un modèle dans l'onglet",
    EMAIL_VORLAGE_LINK: "Profil",
    EMAIL_VORLAGE_NACH: ".",
    VORLAGE_DIALOG_LABEL: "Modèle",
    AN_LABEL: "À",
    VORSCHAU_LABEL: "Aperçu",
    BETREFF_LABEL: "Objet :",
    KEIN_EMAIL_KONTO_TITEL: "Aucun compte e-mail enregistré",
    KEIN_EMAIL_KONTO_VOR: "Veuillez d'abord configurer votre compte Gmail dans l'onglet",
    KEIN_EMAIL_KONTO_LINK: "Profil →",
    CC_FEHLER: "Adresse(s) e-mail invalide(s) — séparez plusieurs adresses par une virgule.",
    SENDET_LABEL: "Envoi…",
    SENDEN_BTN: "✉ Envoyer",
    DOK_SPRACHE_LABEL: "Langue des documents",
    VORLAGE_PH_BETREFF: "Disponibilité {{zeitraum_von}} – {{zeitraum_bis}}",
  },
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  try {
    const stored = localStorage.getItem("sf_lang") as Locale | null
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored
  } catch { /* ignore */ }
  const nav = navigator.language.split("-")[0].toLowerCase()
  if ((LOCALES as readonly string[]).includes(nav)) return nav as Locale
  return DEFAULT_LOCALE
}
