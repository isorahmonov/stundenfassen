#!/usr/bin/env node
/**
 * seed-demo.ts  —  füllt ein NEUES Demo-Konto mit fiktiven Testdaten (alles Englisch).
 *
 * Usage (Node ≥ 22.18, Type-Stripping):
 *   node scripts/seed-demo.ts --uid <UID>            # Dry Run: nur Zusammenfassung + out/demo-uni.ics
 *   node scripts/seed-demo.ts --uid <UID> --write    # schreibt nach users/<UID>/…
 *   node scripts/seed-demo.ts --uid <UID> --write --force   # auch wenn schon Daten da sind
 *
 * Schreibt ausschließlich:
 *   users/<UID>/employers/seed-*      (3 Arbeitgeber inkl. Verfügbarkeits-Einstellungen)
 *   users/<UID>/shifts/seed-*         (Schichten 1. Nov 2026 – 28. Feb 2027)
 *   users/<UID>/settings/default      (merge: Steuerklasse 1, Dokumentsprache Englisch)
 * Der Stundenplan landet nur lokal in out/demo-uni.ics (gitignored) — zum Import in
 * einen Google-Kalender, dessen iCal-URL dann in der App hinterlegt wird.
 *
 * Zugangsdaten: dieselben FIREBASE_ADMIN_* wie lib/firebase/admin.ts, aus .env.local.
 */

import { mkdirSync, writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"
import {
  SEED_VON, SEED_BIS, SEED_SETTINGS,
  seedEmployers, seedShifts, seedIcs, zusammenfassung,
  employerDoc, shiftDoc, shiftId,
} from "../lib/demo/seed.ts"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// ─── Argumente ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const uidIndex = args.indexOf("--uid")
const uid = uidIndex >= 0 ? args[uidIndex + 1] : undefined
const write = args.includes("--write")
const force = args.includes("--force")

if (!uid || !/^[A-Za-z0-9]{20,128}$/.test(uid)) {
  console.error("Aufruf: node scripts/seed-demo.ts --uid <UID> [--write] [--force]")
  console.error("  <UID> = Firebase-Auth-UID des neuen Demo-Kontos (nur Buchstaben/Ziffern)")
  process.exit(1)
}

// ─── Daten erzeugen + Zusammenfassung ─────────────────────────────────────────
const employers = seedEmployers()
const shifts = seedShifts()
const name = new Map(employers.map((e) => [e.id, e.name]))
const stunden = (min: number) => (min / 60).toFixed(1).padStart(5)

console.log(`Demo-Seed für users/${uid}  (${write ? "WRITE" : "Dry Run"})\n`)
console.log("Arbeitgeber:")
for (const e of employers) {
  console.log(`  ${e.name.padEnd(18)} ${e.art.padEnd(11)} ${(e.stundenlohnCent / 100).toFixed(2)} €/h  ${e.bundesland}`)
}
console.log(`\nSchichten ${SEED_VON} – ${SEED_BIS}: ${shifts.length}`)
for (const [monat, proEmployer] of zusammenfassung(shifts)) {
  let summe = 0
  const teile = employers.filter((e) => proEmployer.has(e.id)).map((e) => {
    const { schichten, minuten } = proEmployer.get(e.id)!
    summe += minuten
    return `${name.get(e.id)} ${schichten}× ${stunden(minuten).trim()} h`
  })
  console.log(`  ${monat}  ${stunden(summe)} h   ${teile.join(" · ")}`)
}

const icsPfad = path.join(ROOT, "out", "demo-uni.ics")
mkdirSync(path.dirname(icsPfad), { recursive: true })
writeFileSync(icsPfad, seedIcs())
console.log(`\nStundenplan: ${path.relative(ROOT, icsPfad)}`)

if (!write) {
  console.log("\nDry Run — nichts geschrieben. Mit --write ausführen.")
  process.exit(0)
}

// ─── Schreiben ────────────────────────────────────────────────────────────────
config({ path: path.join(ROOT, ".env.local") })
for (const v of ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"]) {
  if (!process.env[v]) {
    console.error(`${v} fehlt (.env.local) — Abbruch.`)
    process.exit(1)
  }
}
const { adminDb, adminAuth } = await import("../lib/firebase/admin.ts")

// Konto muss existieren — schützt vor Tippfehlern in der UID
await adminAuth.getUser(uid)

const userRef = adminDb.collection("users").doc(uid)
const [vorhandeneEmployer, vorhandeneShifts] = await Promise.all([
  userRef.collection("employers").limit(1).get(),
  userRef.collection("shifts").limit(1).get(),
])
if ((!vorhandeneEmployer.empty || !vorhandeneShifts.empty) && !force) {
  console.error("\nKonto hat bereits Arbeitgeber oder Schichten — Abbruch (mit --force trotzdem schreiben).")
  process.exit(1)
}

const ops: [FirebaseFirestore.DocumentReference, object, boolean][] = [
  [userRef.collection("settings").doc("default"), SEED_SETTINGS, true],
  ...employers.map((e): [FirebaseFirestore.DocumentReference, object, boolean] =>
    [userRef.collection("employers").doc(e.id), employerDoc(e), false]),
  ...shifts.map((s): [FirebaseFirestore.DocumentReference, object, boolean] =>
    [userRef.collection("shifts").doc(shiftId(s)), shiftDoc(s), false]),
]
for (let i = 0; i < ops.length; i += 400) {
  const batch = adminDb.batch()
  for (const [ref, data, merge] of ops.slice(i, i + 400)) batch.set(ref, data, { merge })
  await batch.commit()
}
console.log(`\n✓ ${employers.length} Arbeitgeber, ${shifts.length} Schichten, Einstellungen nach users/${uid} geschrieben.`)
