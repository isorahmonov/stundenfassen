import { describe, expect, it } from "vitest";
import { formatDatum, formatEuroCent, formatStundenDezimal, formatStundenUhrzeit } from "@/lib/calc/format";

describe("deutsche Formate", () => {
  it("formatiert Datum als TT.MM.JJJJ", () => {
    expect(formatDatum("2026-08-05")).toBe("05.08.2026");
  });

  it("formatiert Cent als Euro mit Tausenderpunkt und Komma", () => {
    expect(formatEuroCent(123456)).toBe("1.234,56 EUR");
    expect(formatEuroCent(500)).toBe("5,00 EUR");
  });

  it("formatiert Minuten als Dezimalstunden mit Komma", () => {
    expect(formatStundenDezimal(7 * 60 + 45)).toBe("7,75 h");
  });

  it("formatiert Minuten als H:mm", () => {
    expect(formatStundenUhrzeit(7 * 60 + 45)).toBe("7:45");
    expect(formatStundenUhrzeit(5)).toBe("0:05");
  });
});
