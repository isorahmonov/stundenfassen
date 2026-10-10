import type { Locale } from "@/lib/i18n"

interface PdfStrings {
  monate: string[]
  wochentageKurz: string[]
  wochentangeLang: string[]
  stunden: string
  minusKonto: string
  schichten: string
  abgleich: string
  lautAbrText: string // "laut Abr. · {laut} erfasst" — template uses {laut} and {erfasst}
  abgleichZeile: string // "{laut} laut Abr. · {erfasst} erfasst"
  datum: string
  wochentag: string
  start: string
  pauseVon: string
  pauseBis: string
  ende: string
  std: string
  verfuegbarkeit: string
  mitarbeiter: string
  personalnummer: string
  minusKontoVerfueg: string
  kwPrefix: string
  verfuegbareZeit: string
  nichtVerfuegbar: string
  summe: string
}

const de: PdfStrings = {
  monate: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  wochentageKurz: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  wochentangeLang: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  stunden: "Stunden",
  minusKonto: "Minus-Konto",
  schichten: "Schichten",
  abgleich: "Abgleich",
  lautAbrText: "laut Abr. · {erfasst} erfasst",
  abgleichZeile: "{laut} laut Abr. · {erfasst} erfasst",
  datum: "Datum",
  wochentag: "Wochentag",
  start: "Start",
  pauseVon: "P.von",
  pauseBis: "P.bis",
  ende: "Ende",
  std: "Std",
  verfuegbarkeit: "Verfügbarkeit",
  mitarbeiter: "Mitarbeiter",
  personalnummer: "Personalnummer",
  minusKontoVerfueg: "Minus-Konto",
  kwPrefix: "KW",
  verfuegbareZeit: "Verfügbare Zeit",
  nichtVerfuegbar: "nicht verfügbar",
  summe: "Summe",
}

const en: PdfStrings = {
  monate: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  wochentageKurz: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  wochentangeLang: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  stunden: "Hours",
  minusKonto: "Minus Balance",
  schichten: "Shifts",
  abgleich: "Reconciliation",
  lautAbrText: "per payslip · {erfasst} recorded",
  abgleichZeile: "{laut} per payslip · {erfasst} recorded",
  datum: "Date",
  wochentag: "Weekday",
  start: "Start",
  pauseVon: "Br.fr.",
  pauseBis: "Br.to",
  ende: "End",
  std: "Hrs",
  verfuegbarkeit: "Availability",
  mitarbeiter: "Employee",
  personalnummer: "Staff no.",
  minusKontoVerfueg: "Minus Balance",
  kwPrefix: "CW",
  verfuegbareZeit: "Available Time",
  nichtVerfuegbar: "not available",
  summe: "Total",
}

const ru: PdfStrings = {
  monate: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  wochentageKurz: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  wochentangeLang: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  stunden: "Часы",
  minusKonto: "Долг часов",
  schichten: "Смены",
  abgleich: "Сверка",
  lautAbrText: "по расч. · {erfasst} записано",
  abgleichZeile: "{laut} по расч. · {erfasst} записано",
  datum: "Дата",
  wochentag: "День недели",
  start: "Начало",
  pauseVon: "Пер.с",
  pauseBis: "Пер.до",
  ende: "Конец",
  std: "Ч",
  verfuegbarkeit: "Доступность",
  mitarbeiter: "Сотрудник",
  personalnummer: "Таб. №",
  minusKontoVerfueg: "Долг часов",
  kwPrefix: "КН",
  verfuegbareZeit: "Доступное время",
  nichtVerfuegbar: "недоступно",
  summe: "Итого",
}

const fr: PdfStrings = {
  monate: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  wochentageKurz: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
  wochentangeLang: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  stunden: "Heures",
  minusKonto: "Débit",
  schichten: "Quarts",
  abgleich: "Rapprochement",
  lautAbrText: "selon fiche · {erfasst} enregistré",
  abgleichZeile: "{laut} selon fiche · {erfasst} enregistré",
  datum: "Date",
  wochentag: "Jour",
  start: "Début",
  pauseVon: "P.de",
  pauseBis: "P.à",
  ende: "Fin",
  std: "H",
  verfuegbarkeit: "Disponibilité",
  mitarbeiter: "Employé(e)",
  personalnummer: "N° pers.",
  minusKontoVerfueg: "Débit",
  kwPrefix: "SC",
  verfuegbareZeit: "Temps disponible",
  nichtVerfuegbar: "non disponible",
  summe: "Total",
}

export const pdfStrings: Record<Locale, PdfStrings> = { de, en, ru, fr }
