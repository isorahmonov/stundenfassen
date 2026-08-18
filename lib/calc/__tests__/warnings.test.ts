import { describe, expect, it } from "vitest";
import { werkstudentWochenstunden, zaehleKurzfristigTage } from "@/lib/calc/warnings";
import type { Employer, Shift } from "@/lib/types";

describe("zaehleKurzfristigTage", () => {
  const employers: Array<Pick<Employer, "id" | "art">> = [
    { id: "kf1", art: "kurzfristig" },
    { id: "kf2", art: "kurzfristig" },
    { id: "ws1", art: "werkstudent" },
  ];

  function tage(anzahl: number, employerId: string): Array<Pick<Shift, "datum" | "employerId">> {
    return Array.from({ length: anzahl }, (_, i) => ({
      datum: `2026-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      employerId,
    }));
  }

  it("zählt Tage über mehrere kurzfristige Arbeitgeber hinweg, ignoriert andere Arten", () => {
    const shifts = [...tage(3, "kf1"), ...tage(2, "kf2"), ...tage(5, "ws1")];
    const ergebnis = zaehleKurzfristigTage(shifts, employers, 2026);
    expect(ergebnis.tage).toBe(5);
    expect(ergebnis.ampel).toBe("gruen");
  });

  it("zeigt gelb ab 60 Tagen", () => {
    const shifts = tage(60, "kf1");
    expect(zaehleKurzfristigTage(shifts, employers, 2026).ampel).toBe("gelb");
  });

  it("zeigt rot ab 70 Tagen", () => {
    const shifts = tage(70, "kf1");
    expect(zaehleKurzfristigTage(shifts, employers, 2026).ampel).toBe("rot");
  });

  it("zählt Tage aus anderen Jahren nicht mit", () => {
    const shifts = [{ datum: "2025-12-31", employerId: "kf1" }];
    expect(zaehleKurzfristigTage(shifts, employers, 2026).tage).toBe(0);
  });
});

describe("werkstudentWochenstunden", () => {
  it("summiert Netto-Stunden pro Kalenderwoche und setzt die Ampel korrekt", () => {
    // Kalenderwoche 2026-W03: Mo 12.01. - So 18.01.2026
    const shifts: Shift[] = [
      { id: "1", employerId: "e1", datum: "2026-01-12", start: "09:00", ende: "17:00" }, // 8h
      { id: "2", employerId: "e1", datum: "2026-01-14", start: "09:00", ende: "17:00" }, // 8h
      { id: "3", employerId: "e1", datum: "2026-01-16", start: "09:00", ende: "13:00" }, // 4h -> 20h gesamt
    ];

    const ergebnis = werkstudentWochenstunden(shifts);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0].minuten).toBe(20 * 60);
    expect(ergebnis[0].ampel).toBe("rot");
  });

  it("zeigt gelb ab 18 Wochenstunden", () => {
    const shifts: Shift[] = [
      { id: "1", employerId: "e1", datum: "2026-01-12", start: "09:00", ende: "17:00" }, // 8h
      { id: "2", employerId: "e1", datum: "2026-01-14", start: "09:00", ende: "19:00" }, // 10h -> 18h gesamt
    ];
    const ergebnis = werkstudentWochenstunden(shifts);
    expect(ergebnis[0].ampel).toBe("gelb");
  });

  it("zeigt grün unterhalb von 18 Wochenstunden", () => {
    const shifts: Shift[] = [
      { id: "1", employerId: "e1", datum: "2026-01-12", start: "09:00", ende: "17:00" }, // 8h
    ];
    const ergebnis = werkstudentWochenstunden(shifts);
    expect(ergebnis[0].ampel).toBe("gruen");
  });
});
