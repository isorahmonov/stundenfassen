import { describe, expect, it } from "vitest"
import {
  berechneVerfuegbarkeit,
  rundeAuf,
  rundeAb,
  type TerminMitStatus,
  type VerfuegbarkeitsEinstellungen,
} from "@/lib/verfuegbarkeit/verfuegbarkeit"

// ─── Testdaten: Montag 2026-09-21 in CEST (UTC+2) ───────────────────────────
// Berlin 08:00 = UTC 06:00, Berlin 20:30 = UTC 18:30 usw.

const TAG = "2026-09-21"

function berlinZu(uhrzeit: string): Date {
  // Erzeugt ein UTC-Date, das der angegebenen Berliner Uhrzeit (CEST = UTC+2) entspricht
  const [h, m] = uhrzeit.split(":").map(Number)
  return new Date(Date.UTC(2026, 8, 21, h - 2, m)) // CEST = UTC+2
}

function termin(
  von: string,
  bis: string,
  status: TerminMitStatus["status"] = "LOCKED",
  ort?: string,
): TerminMitStatus {
  return {
    uid: `${von}-${bis}`,
    titel: "Test",
    beginn: berlinZu(von),
    ende: berlinZu(bis),
    ganztaegig: false,
    status,
    ort,
  }
}

const BASIS: VerfuegbarkeitsEinstellungen = {
  fensterStartMin: 360,    // 06:00
  fensterEndeMin: 1230,    // 20:30
  mindestdauerMin: 180,    // 3 Stunden
  puffer: [
    { suchtext: "Berliner Tor", pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Stiftstraße",  pufferVorMin: 30, pufferNachMin: 30 },
    { suchtext: "Steindamm",    pufferVorMin: 30, pufferNachMin: 30 },
  ],
  pufferFallbackMin: 30,
}

const KEIN_PUFFER: VerfuegbarkeitsEinstellungen = {
  ...BASIS,
  puffer: [],
  pufferFallbackMin: 0,
}

// ─── Runden ──────────────────────────────────────────────────────────────────

describe("rundeAuf — Start auf nächste halbe Stunde", () => {
  it("lässt :00 und :30 unverändert", () => {
    expect(rundeAuf(360)).toBe(360)   // 06:00
    expect(rundeAuf(390)).toBe(390)   // 06:30
  })
  it("rundet 06:01 → 06:30", () => expect(rundeAuf(361)).toBe(390))
  it("rundet 06:29 → 06:30", () => expect(rundeAuf(389)).toBe(390))
  it("rundet 06:31 → 07:00", () => expect(rundeAuf(391)).toBe(420))
})

describe("rundeAb — Ende auf vorherige halbe Stunde", () => {
  it("lässt :00 und :30 unverändert", () => {
    expect(rundeAb(1230)).toBe(1230)  // 20:30
    expect(rundeAb(1200)).toBe(1200)  // 20:00
  })
  it("rundet 14:52 → 14:30", () => expect(rundeAb(892)).toBe(870))
  it("rundet 14:29 → 14:00", () => expect(rundeAb(869)).toBe(840))
})

// ─── Abnahmekriterium 2 ──────────────────────────────────────────────────────

describe("Puffer + Runden (Abnahmekriterium 2)", () => {
  it("eine Vorlesung die 11:45 endet erzeugt bei 30 Min Puffer einen Block ab 12:30", () => {
    // Vorlesung 10:00–11:45. Puffer vor=30 → blockiert ab 09:30. Puffer nach=30 → bis 12:15.
    // Vor der Vorlesung: 06:00–09:30 (210 min) → 1. Block.
    // Nach der Vorlesung: rundeAuf(12:15) = 12:30 → 12:30–20:30 → 2. Block.
    const bloecke = berechneVerfuegbarkeit(
      [termin("10:00", "11:45")],
      [TAG],
      BASIS,
    )
    expect(bloecke).toHaveLength(2)
    const nachmittag = bloecke[1]
    expect(nachmittag.start).toBe("12:30")
    expect(nachmittag.ende).toBe("20:30")
  })

  it("dasselbe ohne Puffer: Nachmittags-Block startet um 12:00 (11:45 → rundeAuf → 12:00)", () => {
    // Ohne Puffer: Morgen-Block 06:00–10:00, Nachmittag-Block ab 12:00.
    const bloecke = berechneVerfuegbarkeit(
      [termin("10:00", "11:45")],
      [TAG],
      KEIN_PUFFER,
    )
    expect(bloecke).toHaveLength(2)
    expect(bloecke[1].start).toBe("12:00")
  })
})

// ─── Abnahmekriterium 8 ──────────────────────────────────────────────────────

describe("Mindestdauer (Abnahmekriterium 8)", () => {
  it("eine Lücke von 2,5 Stunden taucht bei Mindestdauer 3 Stunden nicht auf", () => {
    // Fenster 06:00–20:30. Morgens 06:00–09:00, abends 14:30–20:30 blockiert.
    // Lücke: 09:00–14:30 = 330 min → ≥ 180, erscheint.
    // Nun eine Lücke von exakt 150 min erzwingen: 09:00–11:30 frei, dann 11:30–20:30 blockiert.
    // Lücke 09:00–11:30 = 150 min < 180 min → wird verworfen.
    const bloecke = berechneVerfuegbarkeit(
      [termin("06:00", "09:00"), termin("11:30", "20:30")],
      [TAG],
      KEIN_PUFFER,
    )
    expect(bloecke).toHaveLength(0)
  })

  it("eine Lücke von exakt 3 Stunden erscheint (Grenzfall)", () => {
    // Lücke 09:00–12:00 = 180 min, gerundet bleibt 09:00–12:00 = 180 min.
    const bloecke = berechneVerfuegbarkeit(
      [termin("06:00", "09:00"), termin("12:00", "20:30")],
      [TAG],
      KEIN_PUFFER,
    )
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0].start).toBe("09:00")
    expect(bloecke[0].ende).toBe("12:00")
    expect(bloecke[0].dauerMin).toBe(180)
  })
})

// ─── Standorterkennung ───────────────────────────────────────────────────────

describe("Standorterkennung im LOCATION-Feld", () => {
  it("erkennt 'Berliner Tor' als Substring in echtem Ortstext", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin("10:00", "11:45", "LOCKED", "4.05 Berliner Tor 7 (Gebäude BT7)")],
      [TAG],
      BASIS,
    )
    // Puffer 30 min → blockiert bis 12:15, rundeAuf → 12:30; bloecke[1] ist der Nachmittag
    expect(bloecke).toHaveLength(2)
    expect(bloecke[1].start).toBe("12:30")
  })

  it("erkennt 'Stiftstraße' als Substring", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin("10:00", "11:45", "LOCKED", "304a Stiftstraße 69")],
      [TAG],
      BASIS,
    )
    expect(bloecke).toHaveLength(2)
    expect(bloecke[1].start).toBe("12:30")
  })

  it("wendet Fallback-Puffer an wenn Ort unbekannt ist", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin("10:00", "11:45", "LOCKED", "Irgendwo 12")],
      [TAG],
      BASIS,
    )
    // Fallback = 30 min → identisches Ergebnis wie Berliner Tor
    expect(bloecke).toHaveLength(2)
    expect(bloecke[1].start).toBe("12:30")
  })
})

// ─── Status-Filterung ────────────────────────────────────────────────────────

describe("Status-Filterung", () => {
  it("RELEASED-Termine blockieren keine Zeit", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin("09:00", "12:00", "RELEASED")],
      [TAG],
      KEIN_PUFFER,
    )
    // Gesamtes Fenster 06:00–20:30 ist frei
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0].start).toBe("06:00")
    expect(bloecke[0].ende).toBe("20:30")
  })

  it("LOCKED und FLEXIBLE blockieren gleichermaßen", () => {
    const mitLocked = berechneVerfuegbarkeit([termin("09:00", "14:00", "LOCKED")], [TAG], KEIN_PUFFER)
    const mitFlexible = berechneVerfuegbarkeit([termin("09:00", "14:00", "FLEXIBLE")], [TAG], KEIN_PUFFER)
    expect(mitLocked).toEqual(mitFlexible)
  })
})

// ─── Überlappende Termine ────────────────────────────────────────────────────

describe("Überlappende Termine werden zusammengeführt", () => {
  it("zwei überlappende Termine ergeben eine einzige blockierte Zone", () => {
    const bloecke = berechneVerfuegbarkeit(
      [termin("09:00", "12:00"), termin("11:00", "14:00")],
      [TAG],
      KEIN_PUFFER,
    )
    // Blockiert: 09:00–14:00. Frei: 06:00–09:00 (180 min) und 14:00–20:30 (390 min).
    expect(bloecke).toHaveLength(2)
    expect(bloecke[0]).toMatchObject({ start: "06:00", ende: "09:00" })
    expect(bloecke[1]).toMatchObject({ start: "14:00", ende: "20:30" })
  })
})

// ─── Ganztägige Termine ──────────────────────────────────────────────────────

describe("Ganztägige Termine", () => {
  it("blockieren das gesamte Tagesfenster → keine freien Blöcke", () => {
    const ganztaegig: TerminMitStatus = {
      uid: "allday",
      titel: "Feiertag",
      beginn: new Date("2026-09-21T00:00:00Z"),
      ende: new Date("2026-09-22T00:00:00Z"),
      ganztaegig: true,
      status: "LOCKED",
    }
    const bloecke = berechneVerfuegbarkeit([ganztaegig], [TAG], BASIS)
    expect(bloecke).toHaveLength(0)
  })
})

// ─── Kein Termin an dem Tag ──────────────────────────────────────────────────

describe("Freier Tag", () => {
  it("ohne Termine ist das gesamte Fenster 06:00–20:30 verfügbar", () => {
    const bloecke = berechneVerfuegbarkeit([], [TAG], KEIN_PUFFER)
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0]).toMatchObject({ start: "06:00", ende: "20:30", dauerMin: 870 })
  })
})

// ─── Runden nach Mindestdauer ────────────────────────────────────────────────

describe("Runden kann Lücke unter Mindestdauer drücken", () => {
  it("eine Lücke, die nur gerundet ausreicht, wird verworfen", () => {
    // Lücke 09:07–12:05 = 178 min (vor Runden), gerundet 09:30–12:00 = 150 min < 180 → verworfen
    const bloecke = berechneVerfuegbarkeit(
      [termin("06:00", "09:07"), termin("12:05", "20:30")],
      [TAG],
      KEIN_PUFFER,
    )
    expect(bloecke).toHaveLength(0)
  })

  it("eine Lücke, die nach dem Runden noch ausreicht, bleibt erhalten", () => {
    // Lücke 09:07–14:52 = 345 min, gerundet 09:30–14:30 = 300 min ≥ 180 → bleibt
    const bloecke = berechneVerfuegbarkeit(
      [termin("06:00", "09:07"), termin("14:52", "20:30")],
      [TAG],
      KEIN_PUFFER,
    )
    expect(bloecke).toHaveLength(1)
    expect(bloecke[0]).toMatchObject({ start: "09:30", ende: "14:30", dauerMin: 300 })
  })
})
