import { describe, it, expect } from "vitest";
import { calculateCreditPoints, getCreditValue } from "./credit-calculator";

describe("calculateCreditPoints", () => {
  it("returns 2.25 base points with no wizard state", () => {
    expect(calculateCreditPoints(2024)).toBe(2.25);
  });

  it("returns 2.25 base points with undefined wizard state", () => {
    expect(calculateCreditPoints(2024, undefined)).toBe(2.25);
  });

  it("returns 2.25 base points with empty personalCredits", () => {
    expect(calculateCreditPoints(2024, { personalCredits: [] })).toBe(2.25);
  });

  it("returns 2.25 base points when 'לא רלוונטי' is selected", () => {
    expect(
      calculateCreditPoints(2024, { personalCredits: ["לא רלוונטי"] }),
    ).toBe(2.25);
  });

  it("adds 1 point for children selection", () => {
    expect(
      calculateCreditPoints(2024, { personalCredits: ["ילדים מתחת לגיל 18"] }),
    ).toBe(3.25);
  });

  it("adds 1 point for academic degree selection", () => {
    expect(
      calculateCreditPoints(2024, {
        personalCredits: ["סיום תואר / לימודים אקדמיים"],
      }),
    ).toBe(3.25);
  });

  it("adds cumulative points for multiple selections", () => {
    expect(
      calculateCreditPoints(2024, {
        personalCredits: [
          "ילדים מתחת לגיל 18",
          "סיום תואר / לימודים אקדמיים",
        ],
      }),
    ).toBe(4.25);
  });

  it("does not add points for unmapped selections (immigrant, disability)", () => {
    expect(
      calculateCreditPoints(2024, {
        personalCredits: ["עולה חדש / תושב חוזר"],
      }),
    ).toBe(2.25);

    expect(
      calculateCreditPoints(2024, {
        personalCredits: ["מגבלה רפואית"],
      }),
    ).toBe(2.25);
  });

  it("uses base points from the correct year", () => {
    // All years have basePoints = 2.25
    for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
      expect(calculateCreditPoints(year)).toBe(2.25);
    }
  });
});

describe("getCreditValue", () => {
  it("returns correct annual value for 2024 with base points", () => {
    // 2.25 × 2,904 = 6,534
    expect(getCreditValue(2024, 2.25)).toBe(6_534);
  });

  it("returns correct annual value for 2020 with base points", () => {
    // 2.25 × 2,628 = 5,913
    expect(getCreditValue(2020, 2.25)).toBe(5_913);
  });

  it("returns null for unsupported year", () => {
    expect(getCreditValue(2019, 2.25)).toBeNull();
  });

  it("returns 0 for 0 points", () => {
    expect(getCreditValue(2024, 0)).toBe(0);
  });
});
