import type { Abgleich, Employer, Settings, Shift } from "@/lib/types";
import type { StundenDb } from "./dexie/StundenDb";

const TECHCORP_ID = "11111111-1111-1111-1111-111111111111";
const CAFE_BRAUN_ID = "22222222-2222-2222-2222-222222222222";

const SEED_EMPLOYERS: Employer[] = [
  {
    id: TECHCORP_ID,
    name: "TechCorp",
    farbe: "#2563eb",
    stundenlohnCent: 1500,
    art: "werkstudent",
    zuschlagSonntagProzent: 50,
    zuschlagFeiertagProzent: 100,
    zuschlagNachtProzent: 25,
  },
  {
    id: CAFE_BRAUN_ID,
    name: "Café Braun",
    farbe: "#b45309",
    stundenlohnCent: 1200,
    art: "minijob",
    zuschlagSonntagProzent: 25,
    zuschlagFeiertagProzent: 50,
    zuschlagNachtProzent: 20,
  },
];

const SEED_SETTINGS: Settings = {
  id: "default",
  bundesland: "BY",
  steuerklasse: 1,
  kirchensteuer: false,
  kurzfristigPauschal: false,
};

const SEED_SHIFTS: Shift[] = [
  {
    id: "aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa",
    employerId: TECHCORP_ID,
    datum: "2026-08-03",
    start: "09:00",
    ende: "17:00",
    pauseVon: "12:00",
    pauseBis: "12:30",
    notiz: "Sprint-Start",
  },
  {
    id: "aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa",
    employerId: TECHCORP_ID,
    datum: "2026-08-05",
    start: "09:00",
    ende: "17:00",
    pauseVon: "13:00",
    pauseBis: "13:30",
  },
  {
    id: "aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa",
    employerId: TECHCORP_ID,
    datum: "2026-08-10",
    start: "10:00",
    ende: "18:00",
    pauseVon: "13:00",
    pauseBis: "13:30",
  },
  {
    id: "aaaaaaaa-0004-0004-0004-aaaaaaaaaaaa",
    employerId: TECHCORP_ID,
    datum: "2026-08-17",
    start: "09:00",
    ende: "13:00",
    notiz: "halber Tag",
  },
  {
    id: "aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa",
    employerId: TECHCORP_ID,
    datum: "2026-08-24",
    start: "09:00",
    ende: "17:00",
    pauseVon: "12:30",
    pauseBis: "13:00",
  },
  {
    id: "bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb",
    employerId: CAFE_BRAUN_ID,
    datum: "2026-08-02",
    start: "10:00",
    ende: "15:00",
    notiz: "Sonntagsdienst",
  },
  {
    id: "bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb",
    employerId: CAFE_BRAUN_ID,
    datum: "2026-08-13",
    start: "18:00",
    ende: "23:00",
    pauseVon: "20:00",
    pauseBis: "20:15",
    notiz: "Abendschicht",
  },
  {
    id: "bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb",
    employerId: CAFE_BRAUN_ID,
    datum: "2026-08-22",
    start: "20:00",
    ende: "01:00",
    notiz: "Nachtschicht",
  },
];

const SEED_ABGLEICH: Abgleich[] = [
  {
    id: "cccccccc-0001-0001-0001-cccccccccccc",
    employerId: TECHCORP_ID,
    monat: 8,
    jahr: 2026,
    lautAbrechnungStunden: 34.5,
    tatsaechlichAusgezahltCent: 50250,
  },
  {
    id: "cccccccc-0002-0002-0002-cccccccccccc",
    employerId: CAFE_BRAUN_ID,
    monat: 8,
    jahr: 2026,
    lautAbrechnungStunden: 12.0,
    tatsaechlichAusgezahltCent: 14400,
  },
];

export async function seedDatabase(db: StundenDb): Promise<void> {
  const existing = await db.employers.bulkGet([TECHCORP_ID, CAFE_BRAUN_ID]);
  if (existing.some((e) => e !== undefined)) return;

  // bulkPut ist idempotent – kein BulkError bei doppeltem Aufruf (React StrictMode).
  await db.transaction("rw", [db.employers, db.shifts, db.settings, db.abgleich], async () => {
    await db.employers.bulkPut(SEED_EMPLOYERS);
    await db.settings.put(SEED_SETTINGS);
    await db.shifts.bulkPut(SEED_SHIFTS);
    await db.abgleich.bulkPut(SEED_ABGLEICH);
  });
}
