import { describe, expect, it } from "vitest"
import {
  berechneVerfuegbarkeit,
  einstellungenVonArbeitgeber,
  NEUTRALE_EINSTELLUNGEN,
  type TerminMitStatus,
} from "@/lib/verfuegbarkeit/verfuegbarkeit"
import type { FesteSperrzeit, VerfuegbarkeitsEinstellungenArbeitgeber } from "@/lib/types"

const TAG_MO = "2026-09-21"  // Montag
const TAG_SO = "2026-09-20"  // Sonntag
const TAG_FR = "2026-09-25"  // Freitag

function berlinZu(datum: string, uhrzeit: string): Date {
  const [h, m] = uhrzeit.split(":").map(Number)
  const isoCEST = datum.startsWith("2026-09") || datum.startsWith("2026-10")
  const offset = isoCEST ? 2 : 1
  return new Date(Date.UTC(
    Number(datum.slice(0, 4)),
    Number(datum.slice(5, 7)) - 1,
    Number(datum.slice(8, 10)),
    h - offset, m
  ))
}

function termin(datum: string, von: string, bis: string): TerminMitStatus {
  return {
    uid: `${datum}-${von}`,
    titel: "Test",
    beginn: berlinZu(datum, von),
    ende:   berlinZu(datum, bis),
    ganztaegig: false,
    status: "LOCKED",
  }
}

// ─── Konverter ────────────────────────────────────────────────────────────────

describe("einstellungenVonArbeitgeber", () => {
  it("wandelt fruehestens/spaetestens korrekt in Minuten um", () => {
    const einst = einstellungenVonArbeitgeber(NEUTRALE_EINSTELLUNGEN)
    expect(einst.fensterStartMin).toBe(360)   // 06:00
    expect(einst.fensterEndeMin).toBe(1230)   // 20:30
  })

  it("wandelt pufferOrte korrekt um", () => {
    const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
      ...NEUTRALE_EINSTELLUNGEN,
      pufferOrte: [{ suchtext: "Test", vorMin: 15, nachMin: 20 }],
    }
    const einst = einstellungenVonArbeitgeber(arb)
    expect(einst.puffer[0]).toEqual({ suchtext: "Test", pufferVorMin: 15, pufferNachMin: 20 })
  })
})

// ─── Anderes Zeitfenster ──────────────────────────────────────────────────────

describe("Anderes Zeitfenster (08:00–18:00)", () => {
  // kein Puffer, damit die Blöcke klar bestimmbar sind
  const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
    ...NEUTRALE_EINSTELLUNGEN,
    fruehestens: "08:00",
    spaetestens: "18:00",
    mindestdauerMin: 60,
    pufferStandardMin: 0,
  }

  it("freier Tag ergibt 08:00–18:00", () => {
    const bloecke = berechneVerfuegbarkeit([], [TAG_MO], einstellungenVonArbeitgeber(arb))
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0]).toMatchObject({ start: "08:00", ende: "18:00", dauerMin: 600 })
  })

  it("Termin um 10:00–13:00 ergibt zwei Blöcke innerhalb 08–18", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin(TAG_MO, "10:00", "13:00")],
      [TAG_MO],
      einstellungenVonArbeitgeber(arb),
    )
    expect(bloecke).toHaveLength(2)
    expect(bloecke[0]).toMatchObject({ start: "08:00", ende: "10:00" })
    expect(bloecke[1]).toMatchObject({ start: "13:00", ende: "18:00" })
  })
})

// ─── Andere Mindestdauer ──────────────────────────────────────────────────────

describe("Andere Mindestdauer (60 min)", () => {
  const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
    ...NEUTRALE_EINSTELLUNGEN,
    mindestdauerMin: 60,
    pufferStandardMin: 0,
  }

  it("Lücke von 150 min erscheint bei Mindestdauer 60, nicht bei 180", () => {
    // mit 180 min würde diese Lücke verworfen (wie der bestehende Test belegt)
    const bloecke = berechneVerfuegbarkeit(
      [termin(TAG_MO, "06:00", "09:00"), termin(TAG_MO, "11:30", "20:30")],
      [TAG_MO],
      einstellungenVonArbeitgeber(arb),
    )
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0]).toMatchObject({ start: "09:00", ende: "11:30", dauerMin: 150 })
  })
})

// ─── Andere Wochentage ────────────────────────────────────────────────────────

describe("Wochentage-Einschränkung", () => {
  it("Sonntag (0) erscheint nicht bei Standard Mo–Sa", () => {
    const tage = [TAG_SO, TAG_MO]
    const einst = einstellungenVonArbeitgeber(NEUTRALE_EINSTELLUNGEN)
    // Standardmäßig sind nur 1–6 erlaubt; Sonntag (Index 0 im wochenDaten-Array) wird gefiltert
    const erlaubt = tage.filter((_, i) => NEUTRALE_EINSTELLUNGEN.wochentage.includes(i % 7))
    const bloecke = berechneVerfuegbarkeit([], erlaubt, einst)
    // Nur TAG_MO (Index 1) ist erlaubt
    expect(bloecke.every((b) => b.datum === TAG_MO)).toBe(true)
  })

  it("Sonntag erscheint wenn wochentage [0,1,2,3,4,5,6]", () => {
    const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
      ...NEUTRALE_EINSTELLUNGEN,
      wochentage: [0, 1, 2, 3, 4, 5, 6],
    }
    const tage = [TAG_SO, TAG_MO]
    const bloecke = berechneVerfuegbarkeit([], tage, einstellungenVonArbeitgeber(arb))
    expect(bloecke.some((b) => b.datum === TAG_SO)).toBe(true)
  })
})

// ─── Feste Sperrzeiten (festeSperrzeitenTermine-Logik) ───────────────────────

/** Spiegelt festeSperrzeitenTermine() aus app/verfuegbarkeit/page.tsx, aber mit
 *  explizitem Berlin-Offset, damit der Test in allen Timezones deterministisch läuft. */
function festeSperrzeitenTermine(
  sperrzeiten: FesteSperrzeit[],
  tage: string[],
): TerminMitStatus[] {
  return tage.flatMap((datum) => {
    const [y, m, d] = datum.split("-").map(Number)
    const wochentag = new Date(y, m - 1, d, 12).getDay()  // 0=So…6=Sa, lokal
    return sperrzeiten
      .filter((s) => s.wochentag === wochentag)
      .map((s) => ({
        uid: `fest-${datum}-${s.von}`,
        titel: s.bezeichnung,
        beginn: berlinZu(datum, s.von),
        ende:   berlinZu(datum, s.bis),
        ganztaegig: false,
        status: "LOCKED" as const,
      }))
  })
}

describe("Feste Sperrzeiten", () => {
  it("Freitagssperre 12–14 Uhr ergibt zwei Blöcke statt einem", () => {
    // Wie der Jumia-Block: Fr 12–14 LOCKED
    const sperrTermin: TerminMitStatus = {
      uid: "fest-fr-12",
      titel: "Jumia",
      beginn: berlinZu(TAG_FR, "12:00"),
      ende:   berlinZu(TAG_FR, "14:00"),
      ganztaegig: false,
      status: "LOCKED",
    }
    const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
      ...NEUTRALE_EINSTELLUNGEN,
      pufferOrte: [],
      pufferStandardMin: 0,
    }
    const bloecke = berechneVerfuegbarkeit([sperrTermin], [TAG_FR], einstellungenVonArbeitgeber(arb))
    expect(bloecke).toHaveLength(2)
    expect(bloecke[0]).toMatchObject({ start: "06:00", ende: "12:00" })
    expect(bloecke[1]).toMatchObject({ start: "14:00", ende: "20:30" })
  })

  it("festeSperrzeiten-Konfig-Pfad: Sperrzeit aus einst.festeSperrzeiten blockiert korrekt", () => {
    // Testet den vollständigen Pfad: einst.festeSperrzeiten → festeSperrzeitenTermine() → berechneVerfuegbarkeit()
    const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
      ...NEUTRALE_EINSTELLUNGEN,
      pufferOrte: [],
      pufferStandardMin: 0,
      festeSperrzeiten: [
        { wochentag: 5, von: "12:00", bis: "14:00", bezeichnung: "Freitagsblock" },
      ],
    }
    const termine = festeSperrzeitenTermine(arb.festeSperrzeiten, [TAG_FR])
    expect(termine).toHaveLength(1)
    expect(termine[0].titel).toBe("Freitagsblock")

    const bloecke = berechneVerfuegbarkeit(termine, [TAG_FR], einstellungenVonArbeitgeber(arb))
    expect(bloecke).toHaveLength(2)
    expect(bloecke[0]).toMatchObject({ start: "06:00", ende: "12:00" })
    expect(bloecke[1]).toMatchObject({ start: "14:00", ende: "20:30" })
  })

  it("festeSperrzeiten-Konfig-Pfad: anderen Wochentag ignorieren", () => {
    const arb: VerfuegbarkeitsEinstellungenArbeitgeber = {
      ...NEUTRALE_EINSTELLUNGEN,
      pufferOrte: [],
      pufferStandardMin: 0,
      festeSperrzeiten: [
        { wochentag: 1, von: "12:00", bis: "14:00", bezeichnung: "Montagsblock" },
      ],
    }
    // TAG_FR ist Freitag (5), Sperrzeit ist nur für Montag (1) → keine Sperrtermine
    const termine = festeSperrzeitenTermine(arb.festeSperrzeiten, [TAG_FR])
    expect(termine).toHaveLength(0)

    const bloecke = berechneVerfuegbarkeit(termine, [TAG_FR], einstellungenVonArbeitgeber(arb))
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0]).toMatchObject({ start: "06:00", ende: "20:30" })
  })
})

// ─── kwSystem iso ─────────────────────────────────────────────────────────────

describe("kwSystem iso", () => {
  it("NEUTRALE_EINSTELLUNGEN hat kwSystem='keine'", () => {
    expect(NEUTRALE_EINSTELLUNGEN.kwSystem).toBe("keine")
  })
})
