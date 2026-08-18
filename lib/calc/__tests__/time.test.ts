import { describe, expect, it } from "vitest";
import { bruttoMinuten, nettoMinuten, pauseMinuten, schichtIntervall } from "@/lib/calc/time";
import { filterShiftsFuerMonat } from "@/lib/calc/aggregate";
import type { Shift } from "@/lib/types";

describe("schichtIntervall / Mitternachtsübergang", () => {
  it("löst eine normale Schicht ohne Mitternachtsübergang auf", () => {
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "09:00", ende: "17:00" });
    expect(bruttoMinuten(intervall)).toBe(8 * 60);
    expect(intervall.ende.getDate()).toBe(intervall.start.getDate());
  });

  it("erkennt einen Mitternachtsübergang, wenn Ende vor Start liegt", () => {
    const intervall = schichtIntervall({ datum: "2026-08-18", start: "22:00", ende: "06:00" });
    expect(bruttoMinuten(intervall)).toBe(8 * 60);
    expect(intervall.ende.getDate()).toBe(19);
    expect(intervall.ende.getMonth()).toBe(intervall.start.getMonth());
  });

  it("löst eine Pause nach Mitternacht korrekt relativ zum Schichtstart auf", () => {
    const intervall = schichtIntervall({
      datum: "2026-08-18",
      start: "22:00",
      pauseVon: "01:00",
      pauseBis: "01:30",
      ende: "06:00",
    });
    expect(pauseMinuten(intervall)).toBe(30);
    expect(nettoMinuten(intervall)).toBe(8 * 60 - 30);
    expect(intervall.pauseVon!.getDate()).toBe(19);
    expect(intervall.pauseBis!.getDate()).toBe(19);
  });

  it("unterstützt einen Mitternachtsübergang über eine Monatsgrenze hinweg", () => {
    const intervall = schichtIntervall({ datum: "2026-01-31", start: "22:00", ende: "06:00" });
    expect(bruttoMinuten(intervall)).toBe(8 * 60);
    expect(intervall.start.getMonth()).toBe(0); // Januar
    expect(intervall.ende.getMonth()).toBe(1); // Februar
    expect(intervall.ende.getDate()).toBe(1);
  });
});

describe("filterShiftsFuerMonat / Monatsgrenze", () => {
  it("ordnet eine Schicht, die über Mitternacht in den nächsten Monat reicht, dem Monat des Schichtbeginns zu", () => {
    const shifts: Shift[] = [
      { id: "1", employerId: "e1", datum: "2026-01-31", start: "22:00", ende: "06:00" },
      { id: "2", employerId: "e1", datum: "2026-02-01", start: "09:00", ende: "17:00" },
    ];

    const januar = filterShiftsFuerMonat(shifts, "e1", 2026, 1);
    const februar = filterShiftsFuerMonat(shifts, "e1", 2026, 2);

    expect(januar.map((s) => s.id)).toEqual(["1"]);
    expect(februar.map((s) => s.id)).toEqual(["2"]);
  });
});
