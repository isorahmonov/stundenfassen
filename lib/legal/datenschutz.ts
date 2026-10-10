import type { Locale } from "@/lib/i18n"

export type DatenschutzStrings = {
  title: string
  back: string
  impressumLink: string
  backToApp: string
  s1heading: string
  s1intro: string
  s2heading: string
  s2loginHeading: string; s2loginBody: string
  s2appHeading: string; s2appBody: string; s2appBody2: string
  s2icalHeading: string; s2icalBody: string
  s2gmailHeading: string; s2gmailBody: string
  s2logsHeading: string; s2logsBody: string
  s3heading: string; s3body: string; s3body2: string
  s4heading: string
  s4firebaseHeading: string; s4firebaseBody: string
  s4vercelHeading: string; s4vercelBody: string
  s4smtpHeading: string; s4smtpBody: string
  s4calendarHeading: string; s4calendarBody: string
  s5heading: string; s5body: string
  s6heading: string; s6body: string; s6body2: string; s6body3: string
  s7heading: string; s7intro: string
  s7item1desc: string; s7item2desc: string
  s7body2: string; s7body3: string
  s8heading: string; s8body1: string; s8body1post: string; s8body2: string; s8body3: string
}

const SCC = {
  de: "Standardvertragsklauseln (SCC) und/oder EU-US Data Privacy Framework (DPF)",
  en: "Standard Contractual Clauses (SCC) and/or the EU–US Data Privacy Framework (DPF)",
  ru: "стандартных договорных положений (SCC) и/или Рамочного соглашения ЕС–США по защите данных (DPF)",
  fr: "clauses contractuelles types (SCC) et/ou du Cadre transatlantique de protection des données UE–États-Unis (DPF)",
}

const CONTENT: Record<Locale, DatenschutzStrings> = {
  de: {
    title: "Datenschutzerklärung",
    back: "← Zurück",
    impressumLink: "Impressum",
    backToApp: "Zurück zur App",
    s1heading: "1. Verantwortlicher",
    s1intro: "Verantwortlich im Sinne der DSGVO ist:",
    s2heading: "2. Welche Daten werden verarbeitet?",
    s2loginHeading: "Anmeldedaten (Google OAuth)",
    s2loginBody:
      "Die Anmeldung erfolgt ausschließlich über Google (OAuth 2.0). Dabei erhält die App von Google folgende Daten: interne Nutzer-ID (uid), E-Mail-Adresse, Anzeigename und Profilbild-URL. Es gibt keine eigene Passwort-Registrierung.",
    s2appHeading: "App-Daten (Zeiterfassung)",
    s2appBody:
      "In der App werden folgende arbeitsbezogene Daten gespeichert: Arbeitgeberdaten (Name, Farbe, Bundesland, Stundenlohn, Zuschläge, optionale Personalnummer), Schichteinträge (Datum, Zeiten, Pausen, optionale Notiz), Steuereinstellungen (Steuerklasse, Kirchensteuer), Minusstunden-Einträge (Datum, Minuten, optionale Notiz), geplante Schichten sowie E-Mail-Vorlagen (Empfänger, Betreff, Text) und Abrechnungsabgleiche.",
    s2appBody2:
      "Personalnummern, Notizen und Arbeitgeberbezeichnungen können personenbezogene Daten enthalten.",
    s2icalHeading: "Kalenderinhalte (iCal-Integration)",
    s2icalBody:
      "Wenn du eine iCal-URL (z. B. Google Kalender, Hochschulportal) hinterlegst, speichert die App die URL inklusive des darin enthaltenen Authentifizierungstokens ausschließlich serverseitig. Die abgerufenen Kalenderinhalte (iCal-Text) werden serverseitig für maximal 5 Minuten zwischengespeichert. Kalendereinträge können persönliche Termine enthalten (z. B. Arzttermine, Lehrveranstaltungen). Wenn du einen Kalender entfernst, wird der zugehörige Cache sofort gelöscht.",
    s2gmailHeading: "Gmail-App-Passwort (optional)",
    s2gmailBody:
      "Wenn du E-Mail-Versand konfigurierst, wird dein Gmail-App-Passwort serverseitig gespeichert. Es ist über den Browser nicht lesbar (gesichert durch Datenbankregeln). Es wird derzeit nicht verschlüsselt abgelegt; eine Verschlüsselung ist für eine spätere Version geplant.",
    s2logsHeading: "Server-Logs (Vercel)",
    s2logsBody:
      "Vercel erfasst technisch bedingt Zugriffsdaten wie IP-Adressen und Request-Metadaten in Server-Logs. Diese Logs sind für den Betrieb und die Fehlerdiagnose notwendig.",
    s3heading: "3. Zweck und Rechtsgrundlagen",
    s3body:
      "Die Verarbeitung erfolgt zur Erbringung der App-Funktionen (Zeiterfassung, Lohnberechnung, Kalenderabgleich) auf Basis des Vertrages mit dem Nutzer (Art. 6 Abs. 1 lit. b DSGVO) sowie auf Basis berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) für den sicheren und fehlerfreien Betrieb der App.",
    s3body2: "Es findet keine Werbung, kein Profiling und kein Tracking statt.",
    s4heading: "4. Auftragsverarbeiter und Drittanbieter",
    s4firebaseHeading: "Google Firebase (Auth & Firestore)",
    s4firebaseBody: `Authentifizierung und Datenspeicherung erfolgen über Google Firebase (Google LLC, USA). Alle oben beschriebenen Nutzerdaten werden in Firestore gespeichert. Drittlandübermittlung auf Basis von ${SCC.de}.`,
    s4vercelHeading: "Vercel",
    s4vercelBody: `Hosting und alle serverseitigen API-Funktionen werden über Vercel Inc. (USA) betrieben. Drittlandübermittlung auf Basis von ${SCC.de}.`,
    s4smtpHeading: "Gmail SMTP (optional)",
    s4smtpBody: `Wenn du E-Mail-Versand konfigurierst, werden E-Mails über Googles SMTP-Server (Google LLC, USA) versendet. Dies gilt nur, wenn du diese Funktion aktiv einrichtest. Drittlandübermittlung auf Basis von ${SCC.de}.`,
    s4calendarHeading: "Google Calendar / Hochschulportale (optional)",
    s4calendarBody:
      "Wenn du eine iCal-URL hinterlegst, ruft der Server die Kalenderinhalte von dem jeweiligen Anbieter ab (z. B. Google LLC oder dein Hochschulportal). Dies gilt nur, wenn du diese Funktion aktiv einrichtest. Die iCal-URL (inklusive Authentifizierungstoken) verlässt dabei nie den Browser und wird nur serverseitig verwendet.",
    s5heading: "5. Drittlandübermittlung",
    s5body: `Daten werden in die USA übermittelt. Grundlage sind ${SCC.de}. Alle genannten Anbieter (Google/Firebase, Vercel) haben sich verpflichtet, die DSGVO-Anforderungen für Drittlandübermittlungen einzuhalten.`,
    s6heading: "6. Speicherdauer",
    s6body:
      "App-Daten (Schichten, Arbeitgeber, Einstellungen etc.) werden bis zur Löschung deines Kontos gespeichert. Du kannst dein Konto jederzeit löschen; dabei werden alle Daten unwiderruflich entfernt (inkl. iCal-Cache und SMTP-Zugangsdaten).",
    s6body2:
      "Kalender-Cache: serverseitig maximal 5 Minuten. Nach Entfernen eines Kalenders wird der Cache sofort gelöscht.",
    s6body3:
      "Vercel-Server-Logs: entsprechend der Aufbewahrungszeit von Vercel (typisch wenige Tage bis Wochen).",
    s7heading: "7. Cookies, lokaler Speicher und Service Worker",
    s7intro:
      "Die App verwendet keine Tracking-Cookies. Im lokalen Speicher (localStorage) des Browsers werden technisch notwendige Daten gespeichert:",
    s7item1desc:
      "kurzzeitiger Kalender-Cache im Browser (max. 2 Minuten), um unnötige Server-Anfragen zu vermeiden.",
    s7item2desc: "Merken der Blockauswahl pro Woche innerhalb der aktuellen Sitzung.",
    s7body2:
      "Diese Einträge dienen ausschließlich der Funktionalität der App und werden beim Abmelden gelöscht. Es findet kein Tracking oder Profiling statt.",
    s7body3:
      "Die App registriert einen Service Worker für schnelles Laden und Offline-Fähigkeit. Der Service Worker speichert App-Dateien (HTML, CSS, JS) im Browser-Cache, aber keine personenbezogenen Nutzerdaten.",
    s8heading: "8. Deine Rechte",
    s8body1:
      "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie das Recht auf Widerspruch gegen die Verarbeitung (Art. 15–21 DSGVO). Zur Ausübung deiner Rechte wende dich an",
    s8body1post: ".",
    s8body2:
      "Du kannst dein Konto und alle gespeicherten Daten jederzeit selbst in der App unter Profil → Konto löschen.",
    s8body3: "Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.",
  },

  en: {
    title: "Privacy Policy",
    back: "← Back",
    impressumLink: "Legal notice",
    backToApp: "Back to app",
    s1heading: "1. Controller",
    s1intro: "The controller under the GDPR is:",
    s2heading: "2. What data is processed?",
    s2loginHeading: "Login data (Google OAuth)",
    s2loginBody:
      "Authentication is handled exclusively via Google (OAuth 2.0). The app receives the following data from Google: internal user ID (uid), email address, display name, and profile picture URL. There is no separate password registration.",
    s2appHeading: "App data (time tracking)",
    s2appBody:
      "The following work-related data is stored in the app: employer data (name, colour, federal state, hourly rate, supplements, optional employee number), shift entries (date, times, breaks, optional note), tax settings (tax class, church tax), minus-hours entries (date, minutes, optional note), planned shifts, email templates (recipient, subject, body), and payroll reconciliations.",
    s2appBody2: "Employee numbers, notes, and employer names may contain personal data.",
    s2icalHeading: "Calendar content (iCal integration)",
    s2icalBody:
      "If you enter an iCal URL (e.g. Google Calendar, university portal), the app stores the URL including the authentication token it contains exclusively server-side. Retrieved calendar content (iCal text) is cached server-side for up to 5 minutes. Calendar entries may contain personal appointments (e.g. medical appointments, lectures). When you remove a calendar, the associated cache is deleted immediately.",
    s2gmailHeading: "Gmail app password (optional)",
    s2gmailBody:
      "If you configure email sending, your Gmail app password is stored server-side. It cannot be read via the browser (secured by database rules). It is currently stored unencrypted; encryption is planned for a future version.",
    s2logsHeading: "Server logs (Vercel)",
    s2logsBody:
      "Vercel technically records access data such as IP addresses and request metadata in server logs. These logs are necessary for operation and error diagnosis.",
    s3heading: "3. Purpose and legal basis",
    s3body:
      "Processing is carried out to provide the app's functions (time tracking, payroll calculation, calendar synchronisation) on the basis of the contract with the user (Art. 6(1)(b) GDPR) and on the basis of legitimate interests (Art. 6(1)(f) GDPR) for the secure and error-free operation of the app.",
    s3body2: "There is no advertising, profiling, or tracking.",
    s4heading: "4. Processors and third parties",
    s4firebaseHeading: "Google Firebase (Auth & Firestore)",
    s4firebaseBody: `Authentication and data storage are provided by Google Firebase (Google LLC, USA). All user data described above is stored in Firestore. Third-country transfer on the basis of ${SCC.en}.`,
    s4vercelHeading: "Vercel",
    s4vercelBody: `Hosting and all server-side API functions are operated via Vercel Inc. (USA). Third-country transfer on the basis of ${SCC.en}.`,
    s4smtpHeading: "Gmail SMTP (optional)",
    s4smtpBody: `If you configure email sending, emails are sent via Google's SMTP server (Google LLC, USA). This only applies if you actively set up this function. Third-country transfer on the basis of ${SCC.en}.`,
    s4calendarHeading: "Google Calendar / University portals (optional)",
    s4calendarBody:
      "If you enter an iCal URL, the server retrieves calendar content from the respective provider (e.g. Google LLC or your university portal). This only applies if you actively set up this function. The iCal URL (including the authentication token) never leaves the browser and is only used server-side.",
    s5heading: "5. Third-country transfers",
    s5body: `Data is transferred to the USA. The basis is ${SCC.en}. All named providers (Google/Firebase, Vercel) have committed to complying with GDPR requirements for third-country transfers.`,
    s6heading: "6. Retention periods",
    s6body:
      "App data (shifts, employers, settings, etc.) is stored until your account is deleted. You can delete your account at any time; all data will be irrevocably removed (including iCal cache and SMTP credentials).",
    s6body2:
      "Calendar cache: server-side maximum 5 minutes. After removing a calendar, the cache is deleted immediately.",
    s6body3:
      "Vercel server logs: in accordance with Vercel's retention period (typically a few days to weeks).",
    s7heading: "7. Cookies, local storage and service worker",
    s7intro:
      "The app does not use tracking cookies. The following technically necessary data is stored in the browser's local storage (localStorage):",
    s7item1desc:
      "short-term calendar cache in the browser (max. 2 minutes) to avoid unnecessary server requests.",
    s7item2desc: "remembering the block selection per week within the current session.",
    s7body2:
      "These entries serve solely the functionality of the app and are deleted on logout. There is no tracking or profiling.",
    s7body3:
      "The app registers a service worker for fast loading and offline capability. The service worker stores app files (HTML, CSS, JS) in the browser cache, but no personal user data.",
    s8heading: "8. Your rights",
    s8body1:
      "You have the right to access, rectification, erasure, restriction of processing, data portability, and the right to object to processing (Art. 15–21 GDPR). To exercise your rights, contact",
    s8body1post: ".",
    s8body2:
      "You can delete your account and all stored data at any time in the app under Profile → Delete account.",
    s8body3:
      "You also have the right to lodge a complaint with a data protection supervisory authority.",
  },

  ru: {
    title: "Политика конфиденциальности",
    back: "← Назад",
    impressumLink: "Выходные данные",
    backToApp: "Вернуться в приложение",
    s1heading: "1. Ответственный контролёр",
    s1intro: "Ответственным в смысле GDPR/DSGVO является:",
    s2heading: "2. Какие данные обрабатываются?",
    s2loginHeading: "Данные для входа (Google OAuth)",
    s2loginBody:
      "Аутентификация осуществляется исключительно через Google (OAuth 2.0). Приложение получает от Google следующие данные: внутренний идентификатор пользователя (uid), адрес электронной почты, отображаемое имя и URL фотографии профиля. Самостоятельная регистрация с паролем не предусмотрена.",
    s2appHeading: "Данные приложения (учёт рабочего времени)",
    s2appBody:
      "В приложении хранятся следующие рабочие данные: данные работодателя (название, цвет, федеральная земля, часовая ставка, надбавки, табельный номер (необязательно)), записи о сменах (дата, время, перерывы, заметка (необязательно)), налоговые настройки (налоговый класс, церковный налог), записи о минус-часах (дата, минуты, заметка (необязательно)), запланированные смены, шаблоны электронной почты (получатель, тема, текст) и сверки расчётов.",
    s2appBody2:
      "Табельные номера, заметки и наименования работодателей могут содержать персональные данные.",
    s2icalHeading: "Содержимое календаря (интеграция iCal)",
    s2icalBody:
      "Если вы вводите URL iCal (например, Google Календарь, портал университета), приложение сохраняет URL вместе с токеном аутентификации исключительно на сервере. Полученное содержимое календаря (текст iCal) кэшируется на сервере не более 5 минут. Записи календаря могут содержать личные события (например, визиты к врачу, занятия). При удалении календаря соответствующий кэш немедленно удаляется.",
    s2gmailHeading: "Пароль приложения Gmail (необязательно)",
    s2gmailBody:
      "Если вы настраиваете отправку электронной почты, пароль приложения Gmail хранится на сервере. Через браузер он недоступен (защищён правилами базы данных). В настоящее время он хранится без шифрования; шифрование запланировано в будущей версии.",
    s2logsHeading: "Серверные журналы (Vercel)",
    s2logsBody:
      "Vercel технически фиксирует данные доступа, такие как IP-адреса и метаданные запросов, в серверных журналах. Эти журналы необходимы для работы приложения и диагностики ошибок.",
    s3heading: "3. Цель и правовые основания",
    s3body:
      "Обработка данных осуществляется для предоставления функций приложения (учёт рабочего времени, расчёт заработной платы, синхронизация с календарём) на основании договора с пользователем (ст. 6 (1)(b) GDPR) и на основании законных интересов (ст. 6 (1)(f) GDPR) для безопасной и безотказной работы приложения.",
    s3body2: "Реклама, профилирование и отслеживание не осуществляются.",
    s4heading: "4. Обработчики и третьи стороны",
    s4firebaseHeading: "Google Firebase (Auth и Firestore)",
    s4firebaseBody: `Аутентификация и хранение данных осуществляются через Google Firebase (Google LLC, США). Все описанные выше пользовательские данные хранятся в Firestore. Передача данных в третью страну на основании ${SCC.ru}.`,
    s4vercelHeading: "Vercel",
    s4vercelBody: `Хостинг и все серверные API-функции работают через Vercel Inc. (США). Передача данных в третью страну на основании ${SCC.ru}.`,
    s4smtpHeading: "Gmail SMTP (необязательно)",
    s4smtpBody: `Если вы настраиваете отправку электронной почты, письма отправляются через SMTP-сервер Google (Google LLC, США). Это применяется только в случае, если вы активно настроили данную функцию. Передача данных в третью страну на основании ${SCC.ru}.`,
    s4calendarHeading: "Google Календарь / Порталы университетов (необязательно)",
    s4calendarBody:
      "Если вы вводите URL iCal, сервер получает содержимое календаря от соответствующего провайдера (например, Google LLC или вашего университетского портала). Это применяется только в случае, если вы активно настроили данную функцию. URL iCal (включая токен аутентификации) никогда не покидает браузер и используется исключительно на сервере.",
    s5heading: "5. Передача данных в третьи страны",
    s5body: `Данные передаются в США. Основанием является ${SCC.ru}. Все указанные провайдеры (Google/Firebase, Vercel) взяли на себя обязательство соблюдать требования GDPR для передачи данных в третьи страны.`,
    s6heading: "6. Сроки хранения данных",
    s6body:
      "Данные приложения (смены, работодатели, настройки и т.д.) хранятся до удаления вашего аккаунта. Вы можете удалить аккаунт в любое время; все данные будут безвозвратно удалены (включая кэш iCal и учётные данные SMTP).",
    s6body2:
      "Кэш календаря: на сервере не более 5 минут. После удаления календаря кэш немедленно удаляется.",
    s6body3:
      "Серверные журналы Vercel: согласно срокам хранения Vercel (обычно от нескольких дней до нескольких недель).",
    s7heading: "7. Cookies, локальное хранилище и Service Worker",
    s7intro:
      "Приложение не использует отслеживающие cookies. В локальном хранилище браузера (localStorage) хранятся технически необходимые данные:",
    s7item1desc:
      "кратковременный кэш календаря в браузере (макс. 2 минуты) для уменьшения количества запросов к серверу.",
    s7item2desc: "запоминание выбора блоков по неделям в течение текущей сессии.",
    s7body2:
      "Эти записи служат исключительно функциональности приложения и удаляются при выходе из системы. Отслеживание и профилирование не применяются.",
    s7body3:
      "Приложение регистрирует Service Worker для быстрой загрузки и работы в офлайн-режиме. Service Worker кэширует файлы приложения (HTML, CSS, JS) в браузере, но не сохраняет персональные данные пользователей.",
    s8heading: "8. Ваши права",
    s8body1:
      "Вы имеете право на доступ к данным, исправление, удаление, ограничение обработки, переносимость данных, а также право на возражение против обработки (ст. 15–21 GDPR). Для осуществления ваших прав обратитесь по адресу",
    s8body1post: ".",
    s8body2:
      "Вы можете удалить свой аккаунт и все сохранённые данные в любое время в приложении в разделе Профиль → Удалить аккаунт.",
    s8body3:
      "Вы также имеете право подать жалобу в орган надзора за защитой данных.",
  },

  fr: {
    title: "Politique de confidentialité",
    back: "← Retour",
    impressumLink: "Mentions légales",
    backToApp: "Retour à l'application",
    s1heading: "1. Responsable du traitement",
    s1intro: "Le responsable du traitement au sens du RGPD est :",
    s2heading: "2. Quelles données sont traitées ?",
    s2loginHeading: "Données de connexion (Google OAuth)",
    s2loginBody:
      "L'authentification s'effectue exclusivement via Google (OAuth 2.0). L'application reçoit de Google les données suivantes : identifiant utilisateur interne (uid), adresse e-mail, nom d'affichage et URL de la photo de profil. Il n'y a pas d'inscription par mot de passe propre à l'application.",
    s2appHeading: "Données de l'application (suivi du temps)",
    s2appBody:
      "Les données professionnelles suivantes sont stockées dans l'application : données sur l'employeur (nom, couleur, Land allemand, taux horaire, suppléments, numéro de matricule optionnel), entrées de service (date, horaires, pauses, note optionnelle), paramètres fiscaux (classe fiscale, impôt ecclésiastique), entrées d'heures négatives (date, minutes, note optionnelle), services planifiés, modèles d'e-mail (destinataire, sujet, corps) et réconciliations de paie.",
    s2appBody2:
      "Les numéros de matricule, les notes et les noms d'employeurs peuvent contenir des données personnelles.",
    s2icalHeading: "Contenu du calendrier (intégration iCal)",
    s2icalBody:
      "Si vous saisissez une URL iCal (p. ex. Google Agenda, portail universitaire), l'application stocke l'URL, y compris le jeton d'authentification qu'elle contient, exclusivement côté serveur. Le contenu du calendrier récupéré (texte iCal) est mis en cache côté serveur pendant 5 minutes au maximum. Les entrées du calendrier peuvent contenir des rendez-vous personnels (p. ex. consultations médicales, cours). Lorsque vous supprimez un calendrier, le cache associé est immédiatement effacé.",
    s2gmailHeading: "Mot de passe d'application Gmail (optionnel)",
    s2gmailBody:
      "Si vous configurez l'envoi d'e-mails, votre mot de passe d'application Gmail est stocké côté serveur. Il n'est pas lisible via le navigateur (sécurisé par les règles de base de données). Il est actuellement stocké sans chiffrement ; un chiffrement est prévu dans une version future.",
    s2logsHeading: "Journaux serveur (Vercel)",
    s2logsBody:
      "Vercel enregistre techniquement les données d'accès telles que les adresses IP et les métadonnées des requêtes dans les journaux serveur. Ces journaux sont nécessaires au fonctionnement et au diagnostic des erreurs.",
    s3heading: "3. Finalité et bases légales",
    s3body:
      "Le traitement est effectué pour fournir les fonctions de l'application (suivi du temps, calcul des salaires, synchronisation du calendrier) sur la base du contrat avec l'utilisateur (art. 6, §1, lit. b RGPD) et sur la base des intérêts légitimes (art. 6, §1, lit. f RGPD) pour le fonctionnement sécurisé et sans erreur de l'application.",
    s3body2: "Il n'y a pas de publicité, de profilage ni de suivi.",
    s4heading: "4. Sous-traitants et tiers",
    s4firebaseHeading: "Google Firebase (Auth & Firestore)",
    s4firebaseBody: `L'authentification et le stockage des données sont assurés par Google Firebase (Google LLC, États-Unis). Toutes les données utilisateur décrites ci-dessus sont stockées dans Firestore. Transfert vers un pays tiers sur la base de ${SCC.fr}.`,
    s4vercelHeading: "Vercel",
    s4vercelBody: `L'hébergement et toutes les fonctions API côté serveur sont exploités via Vercel Inc. (États-Unis). Transfert vers un pays tiers sur la base de ${SCC.fr}.`,
    s4smtpHeading: "Gmail SMTP (optionnel)",
    s4smtpBody: `Si vous configurez l'envoi d'e-mails, les e-mails sont envoyés via le serveur SMTP de Google (Google LLC, États-Unis). Cela ne s'applique que si vous activez cette fonction. Transfert vers un pays tiers sur la base de ${SCC.fr}.`,
    s4calendarHeading: "Google Agenda / Portails universitaires (optionnel)",
    s4calendarBody:
      "Si vous saisissez une URL iCal, le serveur récupère le contenu du calendrier auprès du fournisseur concerné (p. ex. Google LLC ou votre portail universitaire). Cela ne s'applique que si vous activez cette fonction. L'URL iCal (y compris le jeton d'authentification) ne quitte jamais le navigateur et n'est utilisée que côté serveur.",
    s5heading: "5. Transferts vers des pays tiers",
    s5body: `Les données sont transférées aux États-Unis. La base est ${SCC.fr}. Tous les fournisseurs mentionnés (Google/Firebase, Vercel) se sont engagés à respecter les exigences du RGPD pour les transferts vers des pays tiers.`,
    s6heading: "6. Durées de conservation",
    s6body:
      "Les données de l'application (services, employeurs, paramètres, etc.) sont conservées jusqu'à la suppression de votre compte. Vous pouvez supprimer votre compte à tout moment ; toutes les données seront irrévocablement effacées (y compris le cache iCal et les identifiants SMTP).",
    s6body2:
      "Cache du calendrier : côté serveur 5 minutes maximum. Après la suppression d'un calendrier, le cache est immédiatement effacé.",
    s6body3:
      "Journaux serveur Vercel : selon la durée de conservation de Vercel (généralement quelques jours à quelques semaines).",
    s7heading: "7. Cookies, stockage local et service worker",
    s7intro:
      "L'application n'utilise pas de cookies de suivi. Les données techniquement nécessaires suivantes sont stockées dans le stockage local du navigateur (localStorage) :",
    s7item1desc:
      "cache de calendrier temporaire dans le navigateur (max. 2 minutes) pour éviter les requêtes serveur inutiles.",
    s7item2desc: "mémorisation de la sélection des blocs par semaine au cours de la session en cours.",
    s7body2:
      "Ces entrées servent uniquement à la fonctionnalité de l'application et sont supprimées lors de la déconnexion. Il n'y a pas de suivi ni de profilage.",
    s7body3:
      "L'application enregistre un service worker pour un chargement rapide et une capacité hors ligne. Le service worker stocke les fichiers de l'application (HTML, CSS, JS) dans le cache du navigateur, mais ne stocke aucune donnée personnelle des utilisateurs.",
    s8heading: "8. Vos droits",
    s8body1:
      "Vous avez le droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité des données ainsi que le droit d'opposition au traitement (art. 15–21 RGPD). Pour exercer vos droits, contactez",
    s8body1post: ".",
    s8body2:
      "Vous pouvez supprimer votre compte et toutes les données stockées à tout moment dans l'application sous Profil → Supprimer le compte.",
    s8body3:
      "Vous avez également le droit de déposer une réclamation auprès d'une autorité de contrôle de la protection des données.",
  },
}

export function getDatenschutzStrings(locale: Locale): DatenschutzStrings {
  return CONTENT[locale]
}
