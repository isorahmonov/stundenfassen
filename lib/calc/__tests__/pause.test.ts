import { describe, expect, it } from "vitest";
import { erforderlichePauseMinuten, pruefePause } from "@/lib/calc/pause";

describe("Pausenregel ArbZG §4", () => {
  it("verlangt keine Pause bis einschließlich 6 Stunden", () => {
    expect(erforderlichePauseMinuten(6 * 60)).toBe(0);
    expect(erforderlichePauseMinuten(5 * 60 + 59)).toBe(0);
  });

  it("verlangt mindestens 30 Minuten bei mehr als 6 bis 9 Stunden", () => {
    expect(erforderlichePauseMinuten(6 * 60 + 1)).toBe(30);
    expect(erforderlichePauseMinuten(9 * 60)).toBe(30);
  });

  it("verlangt mindestens 45 Minuten bei mehr als 9 Stunden", () => {
    expect(erforderlichePauseMinuten(9 * 60 + 1)).toBe(45);
    expect(erforderlichePauseMinuten(12 * 60)).toBe(45);
  });

  it("meldet eine fehlende Pause als nicht ausreichend", () => {
    const check = pruefePause(7 * 60, 0);
    expect(check.erforderlicheMinuten).toBe(30);
    expect(check.tatsaechlicheMinuten).toBe(0);
    expect(check.ausreichend).toBe(false);
  });

  it("meldet eine ausreichende Pause als ok", () => {
    const check = pruefePause(7 * 60, 30);
    expect(check.ausreichend).toBe(true);
  });

  it("meldet eine zu kurze Pause bei mehr als 9 Stunden als nicht ausreichend", () => {
    const check = pruefePause(10 * 60, 30);
    expect(check.erforderlicheMinuten).toBe(45);
    expect(check.ausreichend).toBe(false);
  });
});
