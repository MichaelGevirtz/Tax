import { describe, it, expect } from "vitest";
import { getBracketTable, getCreditTable, getSupportedYears } from "./index";

describe("tax-tables registry", () => {
  const SUPPORTED = [2020, 2021, 2022, 2023, 2024, 2025];

  it("supports years 2020-2025", () => {
    expect(getSupportedYears()).toEqual(SUPPORTED);
  });

  for (const year of SUPPORTED) {
    it(`returns bracket table for ${year}`, () => {
      const table = getBracketTable(year);
      expect(table).toBeDefined();
      expect(table!.year).toBe(year);
      expect(table!.brackets.length).toBe(7);
    });

    it(`returns credit table for ${year}`, () => {
      const table = getCreditTable(year);
      expect(table).toBeDefined();
      expect(table!.year).toBe(year);
      expect(table!.pointValue).toBeGreaterThan(0);
      expect(table!.basePoints).toBe(2.25);
    });

    it(`brackets for ${year} are ordered and have increasing from values`, () => {
      const table = getBracketTable(year)!;
      for (let i = 1; i < table.brackets.length; i++) {
        expect(table.brackets[i].from).toBeGreaterThan(table.brackets[i - 1].from);
      }
    });

    it(`first bracket for ${year} starts at 0`, () => {
      const table = getBracketTable(year)!;
      expect(table.brackets[0].from).toBe(0);
    });

    it(`last bracket for ${year} has to=Infinity`, () => {
      const table = getBracketTable(year)!;
      expect(table.brackets[table.brackets.length - 1].to).toBe(Infinity);
    });

    it(`all rates for ${year} are between 0 and 1`, () => {
      const table = getBracketTable(year)!;
      for (const bracket of table.brackets) {
        expect(bracket.rate).toBeGreaterThan(0);
        expect(bracket.rate).toBeLessThanOrEqual(1);
      }
    });
  }

  it("returns undefined for unsupported year", () => {
    expect(getBracketTable(2019)).toBeUndefined();
    expect(getBracketTable(2026)).toBeUndefined();
    expect(getCreditTable(2019)).toBeUndefined();
  });
});
