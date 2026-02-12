import { describe, it, expect } from "vitest";
import { estimateRefund } from "./refund-estimator";
import type { EstimatorInput } from "./refund-estimator";

describe("estimateRefund", () => {
  it("returns null for unsupported tax year", () => {
    const input: EstimatorInput = {
      extracted106: { taxYear: 2019, grossIncome: 100_000, taxDeducted: 20_000 },
    };
    expect(estimateRefund(input)).toBeNull();
  });

  describe("sample PDF data (gross 622,809, tax 167,596, year 2024)", () => {
    const sampleInput: EstimatorInput = {
      extracted106: {
        taxYear: 2024,
        grossIncome: 622_809,
        taxDeducted: 167_596,
      },
    };

    it("produces a deterministic result", () => {
      const results = Array.from({ length: 100 }, () =>
        estimateRefund(sampleInput),
      );
      const first = JSON.stringify(results[0]);
      expect(results.every((r) => JSON.stringify(r) === first)).toBe(true);
    });

    it("returns a valid estimate", () => {
      const result = estimateRefund(sampleInput)!;
      expect(result).not.toBeNull();
      expect(result.taxYear).toBe(2024);
      expect(result.grossIncome).toBe(622_809);
      expect(result.taxDeducted).toBe(167_596);
      expect(result.calculatedTax).toBeGreaterThan(0);
      expect(result.creditPointsUsed).toBe(2.25);
      expect(result.estimateVersion).toBe("estimator_v1_2024");
      expect(result.limitations.length).toBeGreaterThan(0);
    });

    it("calculated tax is bracket tax minus credit value", () => {
      const result = estimateRefund(sampleInput)!;
      // Bracket tax: 182,789.43
      // Credit value: 2.25 × 2,904 = 6,534
      // Calculated tax: 176,255.43
      expect(result.calculatedTax).toBe(176_255.43);
    });

    it("estimates NONE tier when employer deducted correctly", () => {
      const result = estimateRefund(sampleInput)!;
      // taxDeducted (167,596) < calculatedTax (176,255.43) → refund = 0
      expect(result.estimatedRefund).toBe(0);
      expect(result.confidenceTier).toBe("NONE");
    });
  });

  describe("confidence tier mapping", () => {
    it("returns HIGH for estimated refund > 5,000", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 20_000 },
      })!;
      // Bracket tax for 100k: 10,635.2
      // Credit: 6,534
      // Calculated: 4,101.2
      // Refund: 20,000 - 4,101.2 = 15,898.8 → HIGH
      expect(result.confidenceTier).toBe("HIGH");
      expect(result.estimatedRefund).toBeGreaterThan(5_000);
    });

    it("returns MODERATE for estimated refund 1,000-5,000", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 6_000 },
      })!;
      // Calculated: 4,101.2
      // Refund: 6,000 - 4,101.2 = 1,898.8 → MODERATE
      expect(result.confidenceTier).toBe("MODERATE");
      expect(result.estimatedRefund).toBeGreaterThanOrEqual(1_000);
      expect(result.estimatedRefund).toBeLessThanOrEqual(5_000);
    });

    it("returns LOW for estimated refund 1-999", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 4_500 },
      })!;
      // Calculated: 4,101.2
      // Refund: 4,500 - 4,101.2 = 398.8 → LOW
      expect(result.confidenceTier).toBe("LOW");
      expect(result.estimatedRefund).toBeGreaterThanOrEqual(1);
      expect(result.estimatedRefund).toBeLessThan(1_000);
    });

    it("returns NONE for zero refund", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 4_000 },
      })!;
      // Calculated: 4,101.2
      // Refund: max(0, 4,000 - 4,101.2) = 0 → NONE
      expect(result.estimatedRefund).toBe(0);
      expect(result.confidenceTier).toBe("NONE");
    });
  });

  describe("edge cases", () => {
    it("handles zero income", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 0, taxDeducted: 0 },
      })!;
      expect(result.estimatedRefund).toBe(0);
      expect(result.confidenceTier).toBe("NONE");
    });

    it("handles zero tax deducted", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 0 },
      })!;
      expect(result.estimatedRefund).toBe(0);
      expect(result.confidenceTier).toBe("NONE");
    });

    it("refund is never negative", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 500_000, taxDeducted: 1_000 },
      })!;
      expect(result.estimatedRefund).toBe(0);
      expect(result.estimatedRefund).toBeGreaterThanOrEqual(0);
    });

    it("calculated tax is never negative", () => {
      // Very low income: tax < credit value
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 10_000, taxDeducted: 5_000 },
      })!;
      // Bracket tax: 10,000 × 10% = 1,000
      // Credit: 6,534
      // Calculated: max(0, 1,000 - 6,534) = 0
      expect(result.calculatedTax).toBe(0);
      expect(result.estimatedRefund).toBe(5_000);
      expect(result.confidenceTier).toBe("MODERATE");
    });
  });

  describe("wizard enrichment", () => {
    it("increases refund when wizard adds credit points", () => {
      const baseInput: EstimatorInput = {
        extracted106: { taxYear: 2024, grossIncome: 200_000, taxDeducted: 30_000 },
      };
      const enrichedInput: EstimatorInput = {
        ...baseInput,
        wizardState: {
          personalCredits: ["ילדים מתחת לגיל 18", "סיום תואר / לימודים אקדמיים"],
        },
      };

      const baseResult = estimateRefund(baseInput)!;
      const enrichedResult = estimateRefund(enrichedInput)!;

      expect(enrichedResult.creditPointsUsed).toBeGreaterThan(
        baseResult.creditPointsUsed,
      );
      expect(enrichedResult.calculatedTax).toBeLessThan(
        baseResult.calculatedTax,
      );
      expect(enrichedResult.estimatedRefund).toBeGreaterThanOrEqual(
        baseResult.estimatedRefund,
      );
    });
  });

  describe("output shape", () => {
    it("always includes estimateVersion", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 10_000 },
      })!;
      expect(result.estimateVersion).toMatch(/^estimator_v\d+_\d{4}$/);
    });

    it("always includes non-empty limitations array", () => {
      const result = estimateRefund({
        extracted106: { taxYear: 2024, grossIncome: 100_000, taxDeducted: 10_000 },
      })!;
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.every((l) => typeof l === "string")).toBe(true);
    });
  });
});
