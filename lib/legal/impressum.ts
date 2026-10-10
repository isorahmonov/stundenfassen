import type { Locale } from "@/lib/i18n"

export type ImpressumStrings = {
  title: string
  back: string
  datenschutzLink: string
  backToApp: string
  ddgHeading: string
  ddgIntro: string
  emailLabel: string
}

const CONTENT: Record<Locale, ImpressumStrings> = {
  de: {
    title: "Impressum",
    back: "← Zurück",
    datenschutzLink: "Datenschutz",
    backToApp: "Zurück zur App",
    ddgHeading: "Angaben gemäß § 5 DDG",
    ddgIntro:
      "Verantwortlich für den Inhalt dieser Website und der Applikation im Sinne von § 5 DDG:",
    emailLabel: "E-Mail",
  },
  en: {
    title: "Legal notice",
    back: "← Back",
    datenschutzLink: "Privacy policy",
    backToApp: "Back to app",
    ddgHeading: "Information pursuant to § 5 DDG",
    ddgIntro:
      "Responsible for the content of this website and the application within the meaning of § 5 DDG:",
    emailLabel: "Email",
  },
  ru: {
    title: "Выходные данные",
    back: "← Назад",
    datenschutzLink: "Политика конфиденциальности",
    backToApp: "Вернуться в приложение",
    ddgHeading: "Сведения согласно § 5 DDG",
    ddgIntro:
      "Ответственный за содержание данного сайта и приложения в соответствии с § 5 DDG:",
    emailLabel: "Электронная почта",
  },
  fr: {
    title: "Mentions légales",
    back: "← Retour",
    datenschutzLink: "Politique de confidentialité",
    backToApp: "Retour à l'application",
    ddgHeading: "Informations conformément au § 5 DDG",
    ddgIntro:
      "Responsable du contenu de ce site web et de l'application au sens du § 5 DDG :",
    emailLabel: "E-mail",
  },
}

export function getImpressumStrings(locale: Locale): ImpressumStrings {
  return CONTENT[locale]
}
