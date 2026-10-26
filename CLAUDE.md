# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Shiftslot (user-facing brand name; the repo, `package.json` name, and Vercel project are deliberately kept as `stundenfassen` for continuity — see "Branding" below): a mobile-first PWA for tracking shifts across multiple student jobs (Werkstudent, kurzfristige Beschäftigung, Minijob), managing availability for scheduling, and exporting monthly PDF timesheets per employer. German-language source (variable names, comments) throughout; the UI itself is translated into German/English/Russian/French — keep new code consistent with both conventions.

## Commands

```bash
npm run dev      # Next.js dev server
npm run build    # production build
npm run lint      # eslint
npm run test      # vitest run (lib/calc, lib/verfuegbarkeit, lib/storage/firestore, lib/auth, ... __tests__)
npx vitest run path/to/file.test.ts   # single test file
npx tsc --noEmit  # typecheck (no dedicated script)
```

Copy `.env.example` to `.env.local` for `dev`/`build` against real data (Firebase client + admin credentials, optional Resend key for verification emails, an Apple-login feature flag). The pure calc/verfuegbarkeit/auth-logic unit tests under `lib/` need no env setup. `lib/legal.ts` holds the Impressum/Datenschutz entity data; **the Vercel build fails on purpose** (`assertKeinePlatzhalter`) if that file still contains template placeholders, so don't remove that check.

## Architecture

### Branding & i18n

`lib/brand.ts` is the single source for `APP_NAME` ("Shiftslot"), tagline, version, and known domains — all user-visible text, metadata, PDF footers, and the PWA manifest read from it, not hardcoded strings. The rename from "Stundenfassen" deliberately did *not* touch Firestore paths, the `sf_` localStorage prefix, URLs, the Vercel project, the repo name, or the service-worker cache name — don't "fix" those to match the new brand.

`lib/i18n.ts` defines `Locale = "de" | "en" | "ru" | "fr"` and the `UiStrings` dictionary (one flat key per string, no nesting); `app/components/LangProvider.tsx` exposes it via `useT()` (returns `t(key)`) and `useLang()`. Locale is client-only (detected from `localStorage["sf_lang"]`/browser), never server-rendered — components needing translated text must be client components. Adding a string means adding the key to `UiStrings` *and* all four locale objects in `lib/i18n.ts`; nothing enforces completeness except reading the file.

### Data layer: per-user Firestore behind repository interfaces

All persistence goes through repository interfaces in `lib/storage/interfaces/` (`IEmployerRepository`, `IShiftRepository`, `ISettingsRepository`, `IAbgleichRepository`, `IGeplanteSchichtRepository`, `IMinusEintragRepository`, `IEmailVorlageRepository`), implemented in `lib/storage/firestore/`. `lib/storage/index.ts` exports ready-made singleton instances (`employers`, `shifts`, `settings`, `abgleich`, `geplanteSchichten`, `minusEintraege`, `emailVorlagen`) — import those, don't instantiate repositories directly.

Every collection lives under `users/{uid}/{collection}` (see `uid()` / `userCol()` / `userDoc()` in `lib/storage/firestore/shared.ts`), scoped to the signed-in Firebase user. `shared.ts` holds the Firestore-document ↔ domain-type mappers — domain types in `lib/types.ts` never mirror the Firestore doc shape 1:1 (optional fields are stored as `null`, not omitted). When building a Firestore update payload from a partial domain-type `*Update`, follow the pattern in `lib/storage/firestore/employerUpdateRow.ts` (`buildUpdateRow`, a pure function kept dependency-free so it's directly unit-testable) plus `stripUndefined()` (`lib/storage/firestore/stripUndefined.ts`) — Firestore's `updateDoc`/`setDoc` throw on any `undefined` field value, which was a real production crash (see git history around "prevent undefined field values crashing updateDoc"); don't pass a raw partial object straight to Firestore.

The project was on Dexie/IndexedDB, then Supabase/Postgres, before landing on Firebase/Firestore — don't resurrect patterns from either earlier backend.

### Auth

Firebase Auth, multi-provider: Google, GitHub, Apple (behind `NEXT_PUBLIC_AUTH_APPLE_ENABLED`), and email+password. `app/components/AuthGate.tsx` is the single gate for the whole app (except `/datenschutz` and `/impressum`, which must stay public) and branches on: loading → `LoginView`/`LandingPage` (logged out, desktop gets a marketing landing page, mobile goes straight to login) → `VerifyEmailScreen` (password accounts only, until `emailVerified`) → the real app with `TabBar`. `lib/auth/providers.ts` centralizes provider instantiation, the verification-required check, and Firebase-error-code → translated-string mapping (`mapAuthError`) — raw Firebase error messages should never reach the UI. `lib/auth/sessionHint.ts` avoids a login-flash on reload by checking a `sf_session_hint` localStorage flag (and Firebase's own storage keys) before Firebase has finished resolving `onAuthStateChanged`. `lib/auth/rateLimit.ts` guards auth-adjacent endpoints. Verification emails go through Resend when configured, falling back to Firebase's own mailer (`lib/auth/verificationEmail.ts`).

### Calculation core (`lib/calc/`) — pure, no I/O

`time.ts` → `pause.ts`/`zuschlaege.ts` → `lohn.ts` → `aggregate.ts`/`warnings.ts`, plus `holidays.ts` (wraps `date-holidays`) and `format.ts` (display formatting only — internal math stays in integer minutes/cents; `format.ts` now also has locale-aware siblings, e.g. `formatEuroCentLokal`, for the i18n'd UI/PDFs alongside the original German-only formatters). Conventions, don't deviate without good reason:

- Times are resolved relative to shift start (`schichtIntervall` in `time.ts`): any `HH:mm` earlier than the start time is assumed to be the next day — how midnight-crossing shifts and their breaks are handled.
- Sunday/holiday/night surcharge minutes (`berechneZuschlagsminuten`) are computed independently and can overlap for the same worked minute (a Sunday-night hour on a holiday counts in all three) — intentional and additive, not mutually exclusive.
- All money math is integer cents; `centsFuerMinuten(stundenlohnCent, minuten, prozent)` rounds once per line item (base pay, Sunday/holiday/night surcharge computed and rounded separately, then summed) rather than cumulatively.
- `config/lohn.ts` (`schaetzeNetto`) is a deliberately simplified net-pay estimate (flat rate per `Steuerklasse`, not the real progressive `Lohnsteuertabelle`) — always surfaced in the UI as an estimate. `kurzfristigPauschal` (25%-flat-tax election) now lives primarily on `Employer` (per-employer), with `Settings.kurzfristigPauschal` kept only as a fallback for older records (see the `employer.kurzfristigPauschal ?? settings.kurzfristigPauschal ?? false` pattern in `aggregate.ts`) — don't write new data back to the `Settings`-level field.

**Known bug, still live:** `Employer.bundesland` exists so holiday calculation can be per-employer, and every *display* path (`SchichtTabelle`, `MonatsPDF`, `VerfuegbarkeitPDF`, the Verfügbarkeit page) correctly threads it into `feiertagName`/`istFeiertag`. But `berechneSchicht` (`lib/calc/lohn.ts`) still calls `berechneZuschlagsminuten(intervall)` with no second argument, so the actual Feiertagszuschlag euro amount is always computed against Bavaria's (`"BY"`) holiday calendar regardless of the employer's real Bundesland. This has survived a large refactor that fixed the equivalent problem for `kurzfristigPauschal`, so it's a real gap, not a stale note — worth fixing if touching this path.

### Verfügbarkeit (availability) feature

Computes free time blocks from an external calendar (university schedule) to hand to an employer for scheduling, now configured **per employer** via a multi-step setup wizard (`app/components/EinrichtungsDialog.tsx`, gated by `Employer.verfuegbarkeit.einrichtungBestaetigt`; `lib/verfuegbarkeit/einrichtungsUtils.ts` decides when to auto-open it). Core logic in `lib/verfuegbarkeit/`:
- `icalParser.ts` parses raw iCal text into `KalenderTermin`s.
- `status.ts` resolves a per-event LOCKED/FLEXIBLE/RELEASED status — title keyword matching overrides the calendar's configured default status.
- `verfuegbarkeit.ts` blocks out LOCKED/FLEXIBLE events (with per-location buffer minutes from `Employer.verfuegbarkeit.pufferOrte`, substring-matched against the event's `LOCATION`, plus fixed weekly lockouts from `festeSperrzeiten`), computes the remaining gaps within the employer's configured daily window, then rounds gap edges and drops anything under the configured minimum duration. All time math here is in `Europe/Berlin` wall-clock minutes (`berlinDatum`/`berlinMin`), not UTC.
- `kwBerechnung.ts`'s `tkWoche` is a custom Sunday-to-Saturday business-week numbering anchored to a configurable date, selectable per employer (`kwSystem: "tkmaxx" | "iso" | "keine"`) — only use it when `kwSystem === "tkmaxx"`; otherwise there's a standard ISO-week calculation alongside it (see `isoWoche` in `VerfuegbarkeitPDF.tsx`).
- `eventCache.ts` is a client-side (`localStorage` + in-memory) cache for parsed calendar events and the user's per-week block selections.

The iCal URL itself never reaches the client: `app/api/ical/route.ts` and `app/api/ical/[id]/route.ts` (Node runtime — `firebase-admin` needs Node APIs) store it server-side in Firestore `secrets/{uid}/kalender/{id}` and cache parsed results for 24h in `ical_cache/{uid}/kalender/{id}`. SSRF protection is centralized in `lib/ical/ssrfGuard.ts` (`validiereUndNormalisiereIcalUrl`, `holeSicherIcal`) — it does URL/structure validation, private IPv4/IPv6 range checks, and a connection-time DNS lookup to guard against DNS rebinding, not just a static hostname allowlist. Route both new and existing iCal fetches through that module rather than adding ad-hoc checks in a route handler.

### PDF export and sending

Every `@react-pdf/renderer` usage follows a `"use client"` wrapper + `dynamic(() => import("./XInner"), { ssr: false })` split to keep it out of SSR (`PDFButton`/`PDFButtonInner` → `MonatsPDF`; `PDFVerfuegbarkeitButton`/`PDFVerfuegbarkeitButtonInner` → `VerfuegbarkeitPDF`). `EmailVerfuegbarkeitButton`/`...Inner` follows the same wrapper pattern but, instead of downloading, renders the *same* `VerfuegbarkeitPDF` document to a blob, base64-encodes it, and POSTs it to `/api/verfuegbarkeit/send`, which emails it via the user's own Gmail App Password (configured in the Profil "E-Mail-Konto" section, sent through `lib/email/send.ts`/`nodemailer`) using an `EmailVorlage` (template) with `{{name}}`/`{{zeitraum_von}}`/`{{zeitraum_bis}}`/`{{personalnummer}}` placeholders. PDF fonts are registered once in `lib/pdf/fonts.ts` (self-hosted Noto Sans `.woff` in `public/fonts/`); locale-specific PDF copy lives in `lib/pdf/pdfStrings.ts`, keyed by the same `Locale` type as the UI. Error handling convention for these async button handlers: a local `fehler` state set from the caught error's message and rendered inline near the trigger — don't let a `try { … } finally { … }` swallow failures silently (that was a real bug: the availability PDF button failed with zero user feedback until a `catch` was added).

### Routing / navigation

Bottom `TabBar`, 4 tabs: `/` Home, `/verfuegbarkeit` Kalender, `/schichten` Schichten, `/profil` Profil. `/profil` is now the single settings hub — an accordion of sections (calendars/iCal, Arbeitgeber, Minusstunden, E-Mail-Vorlagen, E-Mail-Konto, Steuer, Erscheinungsbild/theme, Sprache, Konto incl. data export/delete, Neuigkeiten/changelog). `/arbeitgeber` and `/einstellungen` are now thin `redirect()` stubs to `/profil/arbeitgeber` and `/profil` — old links/bookmarks still work, but don't add new content to those routes.

### Legal & changelog

`/datenschutz` and `/impressum` are public (no auth) and render from `lib/legal/datenschutz.ts`/`impressum.ts`, which pull the responsible-entity data out of `lib/legal.ts` (see the build-failure note in Commands). `lib/changelog.ts` defines `CHANGELOG` entries (version, date, `UiStrings` item keys) read by `app/components/UpdateHinweis.tsx`, which shows a "what's new" dialog once per version per user (tracked in both `localStorage["sf_seen_version"]` and Firestore so it survives across devices).

### PWA

`app/manifest.ts` + `app/components/ServiceWorkerRegistrar.tsx` (cache name `sf-v1`, kept from the pre-rebrand name on purpose). Icons in `public/icons/`.
