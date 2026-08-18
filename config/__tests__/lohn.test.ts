import { describe, expect, it } from "vitest";
import { schaetzeNetto } from "@/config/lohn";

const settings = { steuerklasse: 1 as const, kirchensteuer: false, kurzfristigPauschal: false };

describe("schaetzeNetto", () => {
  it("zieht bei Minijob keine Abzüge ab", () => {
    const ergebnis = schaetzeNetto(50000, "minijob", settings);
    expect(ergebnis.nettoCent).toBe(50000);
  });

  it("zieht bei Werkstudent nur den RV-Beitrag ab (Steuerklasse 1 = 0% Pauschale)", () => {
    const ergebnis = schaetzeNetto(100000, "werkstudent", settings);
    expect(ergebnis.rentenversicherungCent).toBe(9300);
    expect(ergebnis.lohnsteuerCent).toBe(0);
    expect(ergebnis.nettoCent).toBe(100000 - 9300);
  });

  it("wendet bei kurzfristig die 25%-Pauschalsteuer an, wenn aktiviert", () => {
    const ergebnis = schaetzeNetto(20000, "kurzfristig", { ...settings, kurzfristigPauschal: true });
    expect(ergebnis.rentenversicherungCent).toBe(0);
    expect(ergebnis.lohnsteuerCent).toBe(5000);
    expect(ergebnis.nettoCent).toBe(15000);
  });

  it("addiert Kirchensteuer auf die Lohnsteuer, wenn aktiviert", () => {
    const ergebnis = schaetzeNetto(20000, "kurzfristig", {
      ...settings,
      kurzfristigPauschal: true,
      kirchensteuer: true,
    });
    expect(ergebnis.kirchensteuerCent).toBe(Math.round(5000 * 0.09));
  });
});
