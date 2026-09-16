import { describe, expect, it } from "vitest"
import { parseIcal } from "@/lib/verfuegbarkeit/icalParser"

// Weites Fenster, das alle Test-Termine abdeckt
const VON = new Date("2026-08-01T00:00:00Z")
const BIS = new Date("2026-10-31T23:59:59Z")

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function ical(vevents: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Test//Test//EN",
    vevents.trim(),
    "END:VCALENDAR",
  ].join("\r\n")
}

function icalMitTimezone(vtimezone: string, vevents: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Test//Test//EN",
    vtimezone.trim(),
    vevents.trim(),
    "END:VCALENDAR",
  ].join("\r\n")
}

// Minimale aber korrekte VTIMEZONE-Definition für Europe/Berlin (CET/CEST)
const VTIMEZONE_BERLIN = `BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
END:DAYLIGHT
END:VTIMEZONE`

// ─── Test 1: RRULE ──────────────────────────────────────────────────────────

describe("RRULE — wiederkehrende Termine werden aufgelöst", () => {
  it("expandiert eine wöchentliche Serie mit COUNT=3 zu drei Einzelterminen", () => {
    const text = ical(`
BEGIN:VEVENT
UID:rrule-test@test
DTSTART:20260901T100000Z
DTEND:20260901T110000Z
RRULE:FREQ=WEEKLY;COUNT=3
SUMMARY:Wöchentliches Meeting
END:VEVENT`)

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(3)
    expect(termine[0].beginn.toISOString()).toBe("2026-09-01T10:00:00.000Z")
    expect(termine[1].beginn.toISOString()).toBe("2026-09-08T10:00:00.000Z")
    expect(termine[2].beginn.toISOString()).toBe("2026-09-15T10:00:00.000Z")
    expect(termine[0].titel).toBe("Wöchentliches Meeting")
  })
})

// ─── Test 2: EXDATE ─────────────────────────────────────────────────────────

describe("EXDATE — ausgefallene Termine verschwinden", () => {
  it("überspringt den per EXDATE ausgeschlossenen Termin (09-08)", () => {
    const text = ical(`
BEGIN:VEVENT
UID:exdate-test@test
DTSTART:20260901T100000Z
DTEND:20260901T110000Z
RRULE:FREQ=WEEKLY;COUNT=3
EXDATE:20260908T100000Z
SUMMARY:Meeting mit Ausfall
END:VEVENT`)

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(2)
    const daten = termine.map((t) => t.beginn.toISOString())
    expect(daten).toContain("2026-09-01T10:00:00.000Z")
    expect(daten).toContain("2026-09-15T10:00:00.000Z")
    expect(daten).not.toContain("2026-09-08T10:00:00.000Z")
  })
})

// ─── Test 3: RECURRENCE-ID ──────────────────────────────────────────────────

describe("RECURRENCE-ID — verschobene Einzeltermine ersetzen die Serieninstanz", () => {
  it("gibt den verschobenen Termin genau einmal zurück, nicht zweimal", () => {
    const text = ical(`
BEGIN:VEVENT
UID:recid-test@test
DTSTART:20260901T100000Z
DTEND:20260901T110000Z
RRULE:FREQ=WEEKLY;COUNT=3
SUMMARY:Meeting (Serie)
END:VEVENT
BEGIN:VEVENT
UID:recid-test@test
RECURRENCE-ID:20260908T100000Z
DTSTART:20260908T140000Z
DTEND:20260908T150000Z
SUMMARY:Meeting (verschoben)
END:VEVENT`)

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(3)

    const sep8 = termine.filter((t) =>
      t.beginn.toISOString().startsWith("2026-09-08"),
    )
    expect(sep8).toHaveLength(1)
    // Verschobene Zeit: 14:00 UTC, nicht 10:00 UTC
    expect(sep8[0].beginn.toISOString()).toBe("2026-09-08T14:00:00.000Z")
    expect(sep8[0].titel).toBe("Meeting (verschoben)")
  })
})

// ─── Test 4: Zeitzone Europe/Berlin ─────────────────────────────────────────

describe("Zeitzone Europe/Berlin — Sommerzeitumstellung korrekt", () => {
  it("wandelt TZID=Europe/Berlin 11:00 (CEST = UTC+2) korrekt in 09:00 UTC um", () => {
    // 2026-09-20 liegt zwischen Sommerzeitbeginn (letzter So März) und -ende (letzter So Oktober),
    // also gilt CEST = UTC+2. 11:00 CEST = 09:00 UTC.
    const text = icalMitTimezone(
      VTIMEZONE_BERLIN,
      `
BEGIN:VEVENT
UID:tz-test@test
DTSTART;TZID=Europe/Berlin:20260920T110000
DTEND;TZID=Europe/Berlin:20260920T120000
SUMMARY:Vorlesung Berlin
END:VEVENT`,
    )

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(1)
    expect(termine[0].beginn.toISOString()).toBe("2026-09-20T09:00:00.000Z")
    expect(termine[0].ende.toISOString()).toBe("2026-09-20T10:00:00.000Z")
  })

  it("wandelt einen Winterzeit-Termin (CET = UTC+1) korrekt um", () => {
    // 2026-11-10 liegt nach dem Sommerzeitende am 25.10.2026 → CET = UTC+1
    // 10:00 CET = 09:00 UTC
    const text = icalMitTimezone(
      VTIMEZONE_BERLIN,
      `
BEGIN:VEVENT
UID:tz-winter-test@test
DTSTART;TZID=Europe/Berlin:20261110T100000
DTEND;TZID=Europe/Berlin:20261110T110000
SUMMARY:Vorlesung Winter
END:VEVENT`,
    )

    const termine = parseIcal(
      text,
      new Date("2026-11-01T00:00:00Z"),
      new Date("2026-11-30T23:59:59Z"),
    )

    expect(termine).toHaveLength(1)
    expect(termine[0].beginn.toISOString()).toBe("2026-11-10T09:00:00.000Z")
  })
})

// ─── Test 5: Ganztägige Termine ──────────────────────────────────────────────

describe("Ganztägige Termine — VALUE=DATE blockiert den gesamten Tag", () => {
  it("setzt ganztaegig=true und liefert einen Termin ohne Uhrzeit", () => {
    const text = ical(`
BEGIN:VEVENT
UID:allday-test@test
DTSTART;VALUE=DATE:20260920
DTEND;VALUE=DATE:20260921
SUMMARY:Ganztägige Veranstaltung
END:VEVENT`)

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(1)
    expect(termine[0].ganztaegig).toBe(true)
    expect(termine[0].titel).toBe("Ganztägige Veranstaltung")
  })

  it("setzt ganztaegig=false für normale Termine mit Uhrzeit", () => {
    const text = ical(`
BEGIN:VEVENT
UID:timed-test@test
DTSTART:20260920T090000Z
DTEND:20260920T100000Z
SUMMARY:Normaler Termin
END:VEVENT`)

    const termine = parseIcal(text, VON, BIS)

    expect(termine).toHaveLength(1)
    expect(termine[0].ganztaegig).toBe(false)
  })
})
