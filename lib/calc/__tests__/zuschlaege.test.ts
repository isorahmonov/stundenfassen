import { describe, expect, it } from "vitest";
import { schichtIntervall } from "@/lib/calc/time";
import { berechneZuschlagsminuten } from "@/lib/calc/zuschlaege";

describe("Sonntag + Feiertag gleichzeitig", () => {
  it("zählt Stunden an einem Sonntag, der zugleich Feiertag ist, in beiden Kategorien getrennt", () => {
    // 2026-08-18: keine Kollision. Neujahr 2023-01-01 fällt auf einen Sonntag.
    const intervall = schichtIntervall({ datum: "2023-01-01", start: "10:00", ende: "14:00" });
    const zuschlag = berechneZuschlagsminuten(intervall);

    expect(zuschlag.sonntagMinuten).toBe(4 * 60);
    expect(zuschlag.feiertagMinuten).toBe(4 * 60);
    // Beide Zuschläge gelten gleichzeitig für dieselbe Stunde (additiv, kein Exklusiv-Oder).
    expect(zuschlag.sonntagMinuten).toBe(zuschlag.feiertagMinuten);
  });

  it("zählt an einem normalen Werktag weder Sonntags- noch Feiertagsminuten", () => {
    // 2026-08-18 ist ein Dienstag und kein Feiertag in Bayern.
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "10:00", ende: "14:00" });
    const zuschlag = berechneZuschlagsminuten(intervall);

    expect(zuschlag.sonntagMinuten).toBe(0);
    expect(zuschlag.feiertagMinuten).toBe(0);
  });
});

describe("Nachtzuschlag-Splitting (20:00-06:00)", () => {
  it("teilt eine Teilschicht korrekt in Nacht- und Nicht-Nachtanteil auf", () => {
    // 18:00-22:00: 18-20 Uhr kein Nachtzuschlag, 20-22 Uhr Nachtzuschlag.
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "18:00", ende: "22:00" });
    const zuschlag = berechneZuschlagsminuten(intervall);
    expect(zuschlag.nachtMinuten).toBe(2 * 60);
  });

  it("berechnet den Nachtanteil korrekt über einen Mitternachtsübergang hinweg", () => {
    // 22:00-06:00 liegt komplett im Nachtfenster 20:00-06:00.
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "22:00", ende: "06:00" });
    const zuschlag = berechneZuschlagsminuten(intervall);
    expect(zuschlag.nachtMinuten).toBe(8 * 60);
  });

  it("zieht eine Pause innerhalb des Nachtfensters von den Nachtminuten ab", () => {
    const intervall = schichtIntervall({
      datum: "2026-08-18",
      start: "22:00",
      pauseVon: "01:00",
      pauseBis: "01:30",
      ende: "06:00",
    });
    const zuschlag = berechneZuschlagsminuten(intervall);
    // 8h Schicht - 30 min Pause = 450 min, alles innerhalb 20-06 Uhr.
    expect(zuschlag.nachtMinuten).toBe(450);
  });

  it("zählt keine Nachtminuten für eine reine Tagschicht", () => {
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "09:00", ende: "17:00" });
    const zuschlag = berechneZuschlagsminuten(intervall);
    expect(zuschlag.nachtMinuten).toBe(0);
  });
});
