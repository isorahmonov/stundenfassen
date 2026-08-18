import { describe, expect, it } from "vitest";
import { berechneSchicht, centsFuerMinuten } from "@/lib/calc/lohn";
import type { Employer, Shift } from "@/lib/types";

const employer: Employer = {
  id: "e1",
  name: "Biergarten",
  farbe: "#2563eb",
  stundenlohnCent: 1300,
  art: "minijob",
  zuschlagSonntagProzent: 50,
  zuschlagFeiertagProzent: 125,
  zuschlagNachtProzent: 25,
};

describe("centsFuerMinuten", () => {
  it("rechnet mit ganzen Cent-Beträgen, integer gerundet", () => {
    expect(centsFuerMinuten(1300, 60)).toBe(1300);
    expect(centsFuerMinuten(1300, 30)).toBe(650);
    expect(centsFuerMinuten(1233, 10, 100)).toBe(206); // 1233 * 10 / 60 = 205,5 -> 206
  });

  it("wendet einen Zuschlagsprozentsatz zusätzlich zum Basissatz an", () => {
    expect(centsFuerMinuten(1000, 60, 50)).toBe(500);
  });
});

describe("berechneSchicht", () => {
  it("berechnet Brutto für eine normale Werktagsschicht ohne Zuschläge", () => {
    const shift: Shift = { id: "s1", employerId: "e1", datum: "2026-08-18", start: "09:00", ende: "17:00" };
    const ergebnis = berechneSchicht(shift, employer);
    expect(ergebnis.nettoMinuten).toBe(8 * 60);
    expect(ergebnis.bruttoCent).toBe(centsFuerMinuten(1300, 8 * 60));
  });

  it("addiert Sonntags- und Feiertagszuschlag additiv auf den Grundlohn", () => {
    // 2023-01-01: Sonntag + Neujahr (Feiertag), 10-14 Uhr, kein Nachtanteil.
    const shift: Shift = { id: "s2", employerId: "e1", datum: "2023-01-01", start: "10:00", ende: "14:00" };
    const ergebnis = berechneSchicht(shift, employer);
    const minuten = 4 * 60;
    const erwartet =
      centsFuerMinuten(1300, minuten) +
      centsFuerMinuten(1300, minuten, 50) +
      centsFuerMinuten(1300, minuten, 125);
    expect(ergebnis.bruttoCent).toBe(erwartet);
  });
});
