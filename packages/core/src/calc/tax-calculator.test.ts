import { describe, it, expect } from "vitest";
import { calculateTaxForYear } from "./tax-calculator";

describe("calculateTaxForYear", () => {
  describe("2024 brackets", () => {
    it("returns 0 for zero income", () => {
      expect(calculateTaxForYear(0, 2024)).toBe(0);
    });

    it("returns 0 for negative income", () => {
      expect(calculateTaxForYear(-100, 2024)).toBe(0);
    });

    it("calculates correctly within first bracket only (50,000)", () => {
      // 50,000 × 10% = 5,000
      expect(calculateTaxForYear(50_000, 2024)).toBe(5_000);
    });

    it("calculates correctly at first bracket boundary (84,120)", () => {
      // 84,120 × 10% = 8,412
      expect(calculateTaxForYear(84_120, 2024)).toBe(8_412);
    });

    it("calculates correctly spanning two brackets (100,000)", () => {
      // Bracket 1: 84,120 × 10% = 8,412
      // Bracket 2: (100,000 - 84,120) × 14% = 15,880 × 14% = 2,223.2
      // Total: 10,635.2
      expect(calculateTaxForYear(100_000, 2024)).toBe(10_635.2);
    });

    it("calculates correctly for income spanning multiple brackets (200,000)", () => {
      // Bracket 1: 84,120 × 10% = 8,412
      // Bracket 2: (120,720 - 84,120) × 14% = 36,600 × 14% = 5,124
      // Bracket 3: (193,800 - 120,720) × 20% = 73,080 × 20% = 14,616
      // Bracket 4: (200,000 - 193,800) × 31% = 6,200 × 31% = 1,922
      // Total: 30,074
      expect(calculateTaxForYear(200_000, 2024)).toBe(30_074);
    });

    it("calculates correctly for high income in top bracket (1,000,000)", () => {
      // Bracket 1: 84,120 × 10% = 8,412
      // Bracket 2: 36,600 × 14% = 5,124
      // Bracket 3: 73,080 × 20% = 14,616
      // Bracket 4: 75,480 × 31% = 23,398.8
      // Bracket 5: 291,000 × 35% = 101,850
      // Bracket 6: 161,280 × 47% = 75,801.6
      // Bracket 7: (1,000,000 - 721,560) × 50% = 278,440 × 50% = 139,220
      // Total: 368,422.4
      expect(calculateTaxForYear(1_000_000, 2024)).toBe(368_422.4);
    });

    it("calculates correctly for sample PDF gross income (622,809)", () => {
      // Bracket 1: 84,120 × 10% = 8,412
      // Bracket 2: 36,600 × 14% = 5,124
      // Bracket 3: 73,080 × 20% = 14,616
      // Bracket 4: 75,480 × 31% = 23,398.8
      // Bracket 5: 291,000 × 35% = 101,850
      // Bracket 6: (622,809 - 560,280) × 47% = 62,529 × 47% = 29,388.63
      // Total: 182,789.43
      expect(calculateTaxForYear(622_809, 2024)).toBe(182_789.43);
    });
  });

  it("returns a value for each supported year (2020-2025)", () => {
    for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
      const result = calculateTaxForYear(100_000, year);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    }
  });

  it("returns null for unsupported year", () => {
    expect(calculateTaxForYear(100_000, 2019)).toBeNull();
    expect(calculateTaxForYear(100_000, 2026)).toBeNull();
  });

  it("is deterministic (same input produces same output)", () => {
    const results = Array.from({ length: 100 }, () =>
      calculateTaxForYear(622_809, 2024),
    );
    const first = results[0];
    expect(results.every((r) => r === first)).toBe(true);
  });
});
