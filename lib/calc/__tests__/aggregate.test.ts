import { describe, expect, it } from "vitest";
import { berechneMonatsSumme, filterShiftsFuerMonat, vergleicheAbgleich } from "@/lib/calc/aggregate";
import type { Employer, Settings, Shift } from "@/lib/types";

const employer: Employer = {
  id: "e1",
  name: "Werkstudentenjob",
  farbe: "#16a34a",
  stundenlohnCent: 1500,
  art: "werkstudent",
  bundesland: "HH",
  zuschlagSonntagProzent: 0,
  zuschlagFeiertagProzent: 0,
  zuschlagNachtProzent: 0,
};

const settings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal"> = {
  steuerklasse: 1,
  kirchensteuer: false,
  kurzfristigPauschal: false,
};

describe("berechneMonatsSumme", () => {
  it("summiert nur Schichten, die zuvor per Monatsfilter ausgewählt wurden", () => {
    const shifts: Shift[] = [
      { id: "1", employerId: "e1", datum: "2026-01-31", start: "22:00", ende: "06:00" },
      { id: "2", employerId: "e1", datum: "2026-02-01", start: "09:00", ende: "17:00" },
      { id: "3", employerId: "e1", datum: "2026-02-15", start: "09:00", ende: "13:00" },
    ];

    const februar = filterShiftsFuerMonat(shifts, "e1", 2026, 2);
    const summe = berechneMonatsSumme(februar, employer, settings);

    expect(summe.anzahlSchichten).toBe(2);
    expect(summe.nettoMinuten).toBe(8 * 60 + 4 * 60);
  });
});

describe("vergleicheAbgleich (Soll-Ist)", () => {
  it("zeigt grün bei minimaler Abweichung", () => {
    const summe = { nettoMinuten: 10 * 60, nettoGeschaetztCent: 10000 };
    const ergebnis = vergleicheAbgleich(summe, {
      lautAbrechnungStunden: 10.05,
      tatsaechlichAusgezahltCent: 10050,
    });
    expect(ergebnis.ampelStunden).toBe("gruen");
    expect(ergebnis.ampelBetrag).toBe("gruen");
  });

  it("zeigt rot bei großer Abweichung der Stunden und des Betrags", () => {
    const summe = { nettoMinuten: 10 * 60, nettoGeschaetztCent: 10000 };
    const ergebnis = vergleicheAbgleich(summe, {
      lautAbrechnungStunden: 8,
      tatsaechlichAusgezahltCent: 7000,
    });
    expect(ergebnis.differenzStunden).toBe(-2);
    expect(ergebnis.ampelStunden).toBe("rot");
    expect(ergebnis.differenzCent).toBe(-3000);
    expect(ergebnis.ampelBetrag).toBe("rot");
  });

  it("liefert null und grün, solange kein Abgleichswert eingetragen wurde", () => {
    const summe = { nettoMinuten: 10 * 60, nettoGeschaetztCent: 10000 };
    const ergebnis = vergleicheAbgleich(summe, {});
    expect(ergebnis.differenzStunden).toBeNull();
    expect(ergebnis.differenzCent).toBeNull();
    expect(ergebnis.ampelStunden).toBe("gruen");
  });
});
