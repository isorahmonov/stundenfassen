# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Stundenfassen: a mobile-first PWA for tracking shifts across multiple student jobs (Werkstudent, kurzfristige Beschäftigung, Minijob) and exporting monthly PDF timesheets per employer. German-language UI and domain terms throughout the codebase (variable names, comments, labels) — keep new code consistent with that.

## Commands

```bash
npm run dev      # Next.js dev server
npm run build    # production build
npm run lint      # eslint
npm run test      # vitest run (all tests, lib/calc/__tests__ + lib/verfuegbarkeit/__tests__)
npx vitest run path/to/file.test.ts   # single test file
npx tsc --noEmit  # typecheck (no dedicated script)
```

Firebase env vars (`NEXT_PUBLIC_FIREBASE_*` for the client SDK, `FIREBASE_ADMIN_PROJECT_ID`/`FIREBASE_ADMIN_CLIENT_EMAIL`/`FIREBASE_ADMIN_PRIVATE_KEY` for `firebase-admin`) are required for `dev`/`build` to run against real data — there is no `.env` checked in or present locally. The pure calc/verfuegbarkeit logic under `lib/` has no such dependency and its tests run without any env setup.

## Architecture

### Data layer: per-user Firestore behind repository interfaces

All persistence goes through repository interfaces in `lib/storage/interfaces/` (`IEmployerRepository`, `IShiftRepository`, `ISettingsRepository`, `IAbgleichRepository`, `IGeplanteSchichtRepository`, `IMinusEintragRepository`), implemented in `lib/storage/firestore/`. `lib/storage/index.ts` exports ready-made singleton instances (`employers`, `shifts`, `settings`, `abgleich`, `geplanteSchichten`, `minusEintraege`) — import those, don't instantiate repositories directly.

Every collection lives under `users/{uid}/{collection}` (see `uid()` / `userCol()` / `userDoc()` in `lib/storage/firestore/shared.ts`), scoped to the signed-in Firebase user. `shared.ts` also holds the Firestore-document ↔ domain-type mappers (`toEmployer`/`fromEmployer`, `toShift`/`fromShift`, etc.) — domain types in `lib/types.ts` never mirror the Firestore doc shape 1:1 (e.g. optional fields are stored as `null`, not omitted). The project was previously on Supabase/Postgres (`supabase/schema.sql` is leftover from that and no longer used) and before that on Dexie/IndexedDB — both fully replaced, don't resurrect patterns from them.

### Auth

Firebase Auth, Google sign-in only (`app/components/AuthGate.tsx` wraps the entire app and gates everything behind it, rendering the bottom `TabBar` once signed in). Client SDK config/init in `lib/firebase/client.ts` (persistent multi-tab Firestore cache, `browserLocalPersistence`). Server-side token verification for the `/api/ical` routes uses `firebase-admin` (`lib/firebase/admin.ts`), reading a Bearer ID token and calling `adminAuth.verifyIdToken`.

### Calculation core (`lib/calc/`) — pure, no I/O

`time.ts` → `pause.ts`/`zuschlaege.ts` → `lohn.ts` → `aggregate.ts`/`warnings.ts`, plus `holidays.ts` (wraps `date-holidays`) and `format.ts` (German display formatting only — all internal math stays in integer minutes/cents). Key conventions, don't deviate without good reason:

- Times are resolved relative to shift start (`schichtIntervall` in `time.ts`): any `HH:mm` earlier than the start time is assumed to be the next day, which is how midnight-crossing shifts and their breaks are handled.
- Sunday/holiday/night surcharge minutes (`berechneZuschlagsminuten`) are computed independently and can overlap for the same worked minute (a Sunday-night hour on a holiday counts in all three) — this is intentional, additive, not mutually exclusive.
- All money math is integer cents; `centsFuerMinuten(stundenlohnCent, minuten, prozent)` rounds once per line item (base pay, Sunday surcharge, holiday surcharge, night surcharge computed and rounded separately, then summed) rather than rounding cumulatively.
- `config/lohn.ts` (`schaetzeNetto`) is a deliberately simplified net-pay estimate (flat rate per `Steuerklasse`, not the real progressive `Lohnsteuertabelle`) — always surfaced in the UI as an estimate, not an authoritative payslip figure.

**Known inconsistency:** `Employer.bundesland` was added so holiday calculation could be per-employer, and the UI/PDF code (`SchichtTabelle`, `MonatsPDF`, `VerfuegbarkeitPDF`, `app/verfuegbarkeit/page.tsx`) correctly threads it into `feiertagName`/`istFeiertag`. But `berechneSchicht` (`lib/calc/lohn.ts`) calls `berechneZuschlagsminuten(intervall)` without passing `employer.bundesland`, so the actual Feiertagszuschlag euro amount is always computed against Bavaria's (`"BY"`) holiday calendar regardless of the employer's real Bundesland (default `"HH"`). Worth fixing if touching this path.

### Verfügbarkeit (availability) feature

Computes free time blocks from an external calendar (university schedule) to hand to an employer for scheduling, in `lib/verfuegbarkeit/`:
- `icalParser.ts` parses raw iCal text into `KalenderTermin`s.
- `status.ts` resolves a per-event LOCKED/FLEXIBLE/RELEASED status — title keyword matching (`LOCKED_KEYWORDS`: Praktikum/Labor/Übung/Klausur/Prüfung) overrides the calendar's configured default status.
- `verfuegbarkeit.ts` is the core: blocks out LOCKED/FLEXIBLE events (with per-location buffer minutes, configurable via substring match on the event's `LOCATION`), computes the remaining gaps within a daily window, then rounds gap edges to the nearest half hour and drops anything under the configured minimum duration. All time math here is done in `Europe/Berlin` wall-clock minutes (see `berlinDatum`/`berlinMin`), not UTC — don't swap in `date-fns` UTC helpers here.
- `kwBerechnung.ts` implements a custom Sunday-to-Saturday business week numbering (`tkWoche`) anchored to a configurable date — explicitly **not** ISO 8601 week numbering; don't substitute `getISOWeek`.
- `eventCache.ts` is a client-side (`localStorage` + in-memory) cache for parsed calendar events and the user's per-week block selections, separate from the server-side cache below.

The iCal URL itself never reaches the client. `app/api/ical/route.ts` and `app/api/ical/[id]/route.ts` (Node runtime, not Edge — `firebase-admin` needs Node APIs) store it server-side in Firestore `secrets/{uid}/kalender/{id}` and cache parsed results for 24h in `ical_cache/{uid}/kalender/{id}`; only `{id, name, farbe, defaultStatus}` goes to the browser. Source URLs are restricted to an explicit host allowlist (`ERLAUBTE_HOSTS`: `calendar.google.com`, `myhaw.haw-hamburg.de`) as SSRF protection — extend that allowlist deliberately, never remove the check.

### PDF export

Every PDF uses the same split to keep `@react-pdf/renderer` (which needs browser APIs: canvas, Blob) out of SSR: a thin `"use client"` wrapper (`PDFButton.tsx`, `PDFVerfuegbarkeitButton.tsx`) does `dynamic(() => import("./XInner"), { ssr: false })`, and the `*Inner.tsx` file does the real `PDFDownloadLink`/document rendering (`MonatsPDF.tsx`, `VerfuegbarkeitPDF.tsx`). Follow this pattern for any new PDF rather than importing `@react-pdf/renderer` directly into a page or a non-dynamic component.

### Routing / navigation

Bottom `TabBar` (fixed, 3 tabs: `/` Home, `/verfuegbarkeit` Kalender, `/schichten` Schichten) covers the main flows; `/arbeitgeber` (employer CRUD) and `/einstellungen` (settings, including the Kalender-iCal and Minus-Konto sub-tabs) are reachable via links from within those pages rather than being top-level tabs.

### PWA

`app/manifest.ts` + `app/components/ServiceWorkerRegistrar.tsx`. Icons live in `public/icons/`.
