# Translation Review

Keys added for the 2.1.0 "What's new" announcement (all 4 locales: DE, EN, RU, FR).

## Profil section

| Key | DE | EN | RU | FR |
|---|---|---|---|---|
| `SEKTION_NEUIGKEITEN` | Neuigkeiten | What's new | Новости | Nouveautés |

## Dialog UI

| Key | DE | EN | RU | FR |
|---|---|---|---|---|
| `UPD_DIALOG_TITEL` | Neu in Shiftslot | What's new in Shiftslot | Что нового в Shiftslot | Nouveautés dans Shiftslot |
| `UPD_VERSION_PREFIX` | Version | Version | Версия | Version |
| `UPD_LOSGEH` | Los geht's | Let's go | Начать | C'est parti |
| `UPD_ZUM_PROFIL` | Profil → Neuigkeiten | Profile → What's new | Профиль → Новости | Profil → Nouveautés |

## 2.1.0 bullet items

| Key | Notes |
|---|---|
| `UPD_2_1_0_ITEM1` | New name/look (Stundenfassen → Shiftslot) |
| `UPD_2_1_0_ITEM2` | New sign-in screen |
| `UPD_2_1_0_ITEM3` | Four languages |
| `UPD_2_1_0_ITEM4` | Light/dark/auto appearance |
| `UPD_2_1_0_ITEM5` | Calmer loading |
| `UPD_2_1_0_ITEM6` | Better calendar handling |
| `UPD_2_1_0_ITEM7` | Data & privacy controls |
| `UPD_2_1_0_ITEM9` | New web address — uses `{url}` placeholder filled from `APP_DOMAINS.current[0]` at render time |

Note: bullet 8 (expired sessions / auto-logout) was dropped — feature not implemented in codebase.

## Datenschutz page – GROUP C update (2026-10-10)

New keys added to `DatenschutzStrings` in `lib/legal/datenschutz.ts`. All 4 locales (DE/EN/RU/FR).

| Key | DE | EN | RU | FR |
|---|---|---|---|---|
| `standLine` | "Stand: 10. Oktober 2026" | "Last updated: 10 October 2026" | "Актуально на: 10 октября 2026 г." | "Mis à jour le : 10 octobre 2026" |
| `govNote` | _(empty)_ | "This is a translation of the German original. In the event of discrepancies, the German version prevails." | "Настоящая политика конфиденциальности является переводом немецкого оригинала. В случае расхождений немецкая версия имеет преимущественную силу." | "Il s'agit d'une traduction de l'original allemand. En cas de divergences, la version allemande fait foi." |
| `s2settingsHeading` | "Nutzereinstellungen" | "User preferences" | "Пользовательские настройки" | "Préférences utilisateur" |
| `s2settingsBody` | Theme + dokSprache + lastSeen in Firestore; sf_lang localStorage only | same | same | same |
| `s7item3desc` | sf_theme — Darstellungsthema, Firestore-sync | appearance theme, Firestore-sync | тема оформления, Firestore-sync | thème d'affichage, Firestore-sync |
| `s7item4desc` | sf_lang — UI-Sprache, nur lokal | UI language preference, local only | языковые настройки, только локально | préférence de langue, local uniquement |
| `s7item5desc` | sf_seen_version — letzte App-Version, Firestore-sync | last seen app version, Firestore-sync | последняя версия, Firestore-sync | dernière version, Firestore-sync |
| `s7fontsNote` | Selbst gehostete Schriften, kein CDN | Self-hosted fonts, no CDN | Самостоятельно размещённые шрифты, CDN отсутствует | Polices auto-hébergées, aucun CDN |

**Note:** `govNote` is an empty string for DE and must remain so. EN/RU/FR: native-speaker review recommended before publication — legal "prevails" language varies by jurisdiction.

## i18n: remaining aria/placeholder strings + impressum parity (2026-10-10)

New keys added to `lib/i18n.ts` UiStrings interface + all 4 locales. New fields in `lib/legal/impressum.ts`.

| Key | DE | EN | RU | FR |
|---|---|---|---|---|
| `EINTRAGEN` | "Eintragen" | "Enter" | "Ввести" | "Saisir" |
| `ARIA_VORMONAT` | "Vormonat" | "Previous month" | "Предыдущий месяц" | "Mois précédent" |
| `ARIA_NAECHSTER_MONAT` | "Nächster Monat" | "Next month" | "Следующий месяц" | "Mois suivant" |
| `ARIA_FARBE` | "Farbe" | "Color" | "Цвет" | "Couleur" |
| `KAL_PLACEHOLDER_NAME` | "Name (z.B. HAW Stundenplan)" | "Name (e.g. University timetable)" | "Название (напр. расписание ВУЗа)" | "Nom (ex. emploi du temps)" |

**Impressum parity:** `standLine` and `govNote` added to `ImpressumStrings` with same values as Datenschutz. govNote is empty for DE; EN/RU/FR contain the translation-disclaimer text.

**Note:** RU/FR for `EINTRAGEN`, `ARIA_*`, `KAL_PLACEHOLDER_NAME` — native-speaker review recommended.

## Login / signup page – `/anmelden` (2026-10-10)

New keys added to `lib/i18n.ts` UiStrings interface + all 4 locales (DE/EN/RU/FR) for the
new split login/signup screen (providers, email/password, password reset, auth errors) and
the desktop product-preview card. DE/EN authored directly; RU/FR below need native-speaker
review. Firebase error messages are never shown raw — these are the friendly replacements.

| Key | FR | RU |
|---|---|---|
| `ANMELDEN_WILLKOMMEN` | Bon retour | С возвращением |
| `ANMELDEN_UNTERTITEL` | Connectez-vous pour continuer | Войдите, чтобы продолжить |
| `REGISTRIEREN_TITEL` | Créer un compte | Создать аккаунт |
| `REGISTRIEREN_UNTERTITEL` | Suivez vos services en un clin d'œil | Учитывайте смены без труда |
| `MIT_APPLE_ANMELDEN` | Se connecter avec Apple | Войти через Apple |
| `MIT_GITHUB_ANMELDEN` | Se connecter avec GitHub | Войти через GitHub |
| `BALD_VERFUEGBAR` | Bientôt disponible | Скоро |
| `ODER` | ou | или |
| `EMAIL_LABEL` | E-mail | Эл. почта |
| `EMAIL_PLATZHALTER` | vous@exemple.com | you@example.com |
| `PASSWORT_LABEL` | Mot de passe | Пароль |
| `PASSWORT_PLATZHALTER` | •••••••• | •••••••• |
| `ANMELDEN_AKTION` | Se connecter | Войти |
| `KONTO_ERSTELLEN_AKTION` | Créer un compte | Создать аккаунт |
| `KEIN_KONTO` | Pas encore de compte ? | Ещё нет аккаунта? |
| `ZUM_REGISTRIEREN` | S'inscrire | Зарегистрироваться |
| `HABE_KONTO` | Vous avez déjà un compte ? | Уже есть аккаунт? |
| `ZUM_ANMELDEN` | Se connecter | Войти |
| `PASSWORT_VERGESSEN` | Mot de passe oublié ? | Забыли пароль? |
| `PW_MIN_HINWEIS` | Au moins 8 caractères | Не менее 8 символов |
| `PW_STAERKE_SCHWACH` | Faible | Слабый |
| `PW_STAERKE_MITTEL` | Moyen | Средний |
| `PW_STAERKE_STARK` | Fort | Надёжный |
| `PW_RESET_HINWEIS` | Si un compte existe, nous avons envoyé un lien de réinitialisation. | Если аккаунт существует, мы отправили ссылку для сброса. |
| `PW_RESET_EMAIL_FEHLT` | Saisissez d'abord votre adresse e-mail. | Сначала введите адрес эл. почты. |
| `AUTH_FEHLER_FALSCHE_DATEN` | E-mail ou mot de passe incorrect. | Неверная эл. почта или пароль. |
| `AUTH_FEHLER_EMAIL_VERGEBEN` | Un compte existe déjà. Connectez-vous avec votre fournisseur d'origine. | Аккаунт уже существует. Войдите через исходный способ входа. |
| `AUTH_FEHLER_SCHWACHES_PW` | Le mot de passe est trop faible (au moins 8 caractères). | Пароль слишком простой (не менее 8 символов). |
| `AUTH_FEHLER_ZU_VIELE` | Trop de tentatives. Réessayez plus tard. | Слишком много попыток. Повторите позже. |
| `AUTH_FEHLER_EMAIL_UNGUELTIG` | Veuillez saisir une adresse e-mail valide. | Введите корректный адрес эл. почты. |
| `AUTH_FEHLER_KONTO_ANDERER_ANBIETER` | Un compte avec cet e-mail existe déjà via une autre méthode de connexion. Veuillez l'utiliser. | Для этой почты уже есть аккаунт с другим способом входа. Используйте его. |
| `PREVIEW_MONAT` | Ce mois-ci | Этот месяц |
| `PREVIEW_STUNDEN` | Heures | Часы |
| `PREVIEW_GESAMT` | Total | Итого |

**Note:** RU/FR above — native-speaker review recommended before publication.

## Datenschutz – new sign-in methods + Resend processor (2026-10-10) — **juristisch prüfen**

Phase (f). Updated `lib/legal/datenschutz.ts` for the new sign-in methods and the Resend
email processor. All 4 locales. **These are legal passages — lawyer / native-speaker review
required before publication.**

| Key | Change |
|---|---|
| `s2loginHeading` | Dropped "(Google OAuth)" — now just "Anmeldedaten" / "Login data" / etc. |
| `s2loginBody` | Rewritten: sign-in via Google, GitHub, Apple (if enabled) **or** email+password; federated data received (uid, email, display name, profile picture URL); for email/password the password is stored only by Firebase Authentication and not accessible to the app; a one-time verification email with a confirmation link is sent. |
| `s4resendHeading` | New. "Resend (Versand der Verifizierungs-E-Mail)" / "Resend (sending the verification email)" / RU / FR. |
| `s4resendBody` | New. Resend, Inc. (USA) delivers the verification email; only recipient email address + confirmation link transmitted; falls back to Firebase if unconfigured; third-country transfer on SCC/DPF basis. |
| `s5body` | Added "Resend" to the list of providers committed to GDPR third-country requirements. |

`Stand` line unchanged (10. Oktober 2026, localized).

## UI keys from landing + verify + auth (RU/FR) — review recommended

Previously-added RU/FR keys (phases c/d) not yet logged for review. English/German authored
directly; RU/FR below need native-speaker review.

| Key | FR | RU |
|---|---|---|
| `LANDING_HERO_TITEL` | Votre temps de travail, maîtrisé. | Ваше рабочее время под контролем. |
| `LANDING_HERO_UNTERTITEL` | Saisissez vos services, calculez automatiquement les heures et le salaire, exportez un relevé mensuel en PDF — pour les étudiants et les petits boulots en Allemagne. | Учитывайте смены, автоматически считайте часы и зарплату, выгружайте месячный отчёт в PDF — для студентов и подработки в Германии. |
| `LANDING_LOSLEGEN` | Commencer | Начать |
| `LANDING_FEATURES_TITEL` | Tout ce qu'il vous faut | Всё, что нужно |
| `LANDING_F1_TITEL` | Saisir vos services | Учёт смен |
| `LANDING_F1_TEXT` | Entrez vos horaires en quelques secondes — par employeur, avec pauses et heures fixes. | Вносите рабочее время за секунды — по каждому работодателю, с перерывами и фиксированными часами. |
| `LANDING_F2_TITEL` | Calculé pour vous | Всё посчитано |
| `LANDING_F2_TEXT` | Heures, salaire, majorations du dimanche et des jours fériés et pauses obligatoires — sans calcul. | Часы, зарплата, надбавки за воскресенья и праздники и обязательные перерывы — без расчётов. |
| `LANDING_F3_TITEL` | Relevé mensuel en PDF | Месячный отчёт в PDF |
| `LANDING_F3_TEXT` | Un relevé d'heures clair à votre nom, prêt à remettre ou à envoyer. | Аккуратный отчёт по часам с вашим именем, готовый к сдаче или отправке. |
| `LANDING_F4_TITEL` | Calendrier et disponibilité | Календарь и доступность |
| `LANDING_F4_TEXT` | Importez votre emploi du temps via iCal et partagez vos disponibilités par e-mail. | Импортируйте расписание через iCal и делитесь доступностью по эл. почте. |
| `VERIFY_TITEL` | Vérifiez votre e-mail | Подтвердите адрес эл. почты |
| `VERIFY_TEXT` | Nous avons envoyé un lien de vérification à {email}. Ouvrez-le pour continuer. | Мы отправили ссылку для подтверждения на {email}. Откройте её, чтобы продолжить. |
| `VERIFY_ICH_HABE_BESTAETIGT` | J'ai vérifié | Я подтвердил(а) |
| `VERIFY_NOCH_NICHT` | Pas encore vérifié. Veuillez consulter votre boîte de réception. | Пока не подтверждено. Проверьте почту. |
| `VERIFY_ERNEUT_SENDEN` | Renvoyer l'e-mail | Отправить письмо ещё раз |
| `VERIFY_ERNEUT_GESENDET` | Envoyé. Veuillez consulter votre boîte de réception. | Отправлено. Проверьте почту. |
| `VERIFY_COOLDOWN` | Renvoyer dans {sek}s | Повтор через {sek}с |
| `VERIFY_ANDERES_KONTO` | Utiliser un autre compte | Использовать другой аккаунт |
| `AUTH_REAUTH_POPUP_BLOCKIERT` | La fenêtre contextuelle de connexion a été bloquée. Ouvrez l'application dans votre navigateur (Safari → Partager → Ouvrir dans le navigateur) et réessayez. | Всплывающее окно входа заблокировано. Откройте приложение в браузере (Safari → Поделиться → Открыть в браузере) и повторите попытку. |
| `AUTH_FEHLER_NETZWERK` | Pas de connexion réseau. Vérifiez votre connexion internet. | Нет подключения к сети. Проверьте интернет-соединение. |
| `AUTH_FEHLER_ABGEBROCHEN` | Connexion annulée. Veuillez réessayer. | Вход отменён. Попробуйте ещё раз. |

**Note:** RU/FR above — native-speaker review recommended before publication.

## Auth error codes – phase (a) (2026-10-11)

New keys added to `lib/i18n.ts` UiStrings interface + all 4 locales (DE/EN/RU/FR).
New cases added to `mapAuthError` in `lib/auth/providers.ts`.

| Key | DE | EN | RU | FR |
|---|---|---|---|---|
| `AUTH_FEHLER_NICHT_AKTIVIERT` | Diese Anmeldemethode ist aktuell nicht aktiviert. | This sign-in method is currently not enabled. | Этот способ входа сейчас не активирован. | Cette méthode de connexion n'est pas activée actuellement. |
| `AUTH_FEHLER_DEAKTIVIERT` | Dieses Konto wurde deaktiviert. Bitte wende dich an den Support. | This account has been disabled. Please contact support. | Аккаунт заблокирован. Обратитесь в службу поддержки. | Ce compte a été désactivé. Veuillez contacter le support. |
| `AUTH_FEHLER_REAUTH_BENOETIGT` | Für diese Aktion ist eine erneute Anmeldung erforderlich. Bitte melde dich ab und wieder an. | This action requires a recent sign-in. Please sign out and sign in again. | Для этого действия требуется повторная авторизация. Выйдите и войдите снова. | Cette action nécessite une connexion récente. Déconnectez-vous et reconnectez-vous. |

**Note:** RU/FR — native-speaker review recommended.

## 2.0 bullet items (historical, shown in Profil → Neuigkeiten)

| Key | Notes |
|---|---|
| `UPD_2_0_ITEM1` | Availability setup per employer |
| `UPD_2_0_ITEM2` | Block fixed times |
| `UPD_2_0_ITEM3` | Your name in PDF |
| `UPD_2_0_ITEM4` | Public holidays by state |
| `UPD_2_0_ITEM5` | Send availability by email |
| `UPD_2_0_ITEM6` | Minus hours per employer |
| `UPD_2_0_ITEM7` | Flat-rate wage tax |
| `UPD_2_0_ITEM8` | Faster calendar loading |
| `UPD_2_0_ITEM9` | Sign out in Profile tab |
