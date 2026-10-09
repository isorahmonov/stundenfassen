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
  // Auth / login screen
  AUTH_LAEDT_FEHLER: string
  AUTH_NEU_LADEN: string
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
    AUTH_LAEDT_FEHLER: "Anmeldung dauert zu lange — App neu laden.",
    AUTH_NEU_LADEN: "App neu laden",
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
    AUTH_LAEDT_FEHLER: "Sign-in is taking too long — reload the app.",
    AUTH_NEU_LADEN: "Reload app",
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
    AUTH_LAEDT_FEHLER: "Вход занимает слишком долго — перезагрузите приложение.",
    AUTH_NEU_LADEN: "Перезагрузить",
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
    AUTH_LAEDT_FEHLER: "La connexion prend trop de temps — rechargez l'application.",
    AUTH_NEU_LADEN: "Recharger",
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
