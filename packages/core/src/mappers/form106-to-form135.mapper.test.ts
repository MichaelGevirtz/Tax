import { describe, it, expect } from "vitest";
import { mapExtracted106ToForm135, MAPPER_VERSION } from "./form106-to-form135.mapper";
import type { Extracted106 } from "@tax/domain";

const SAMPLE_106: Extracted106 = {
  employeeId: "031394828",
  employerId: "921513545",
  taxYear: 2024,
  grossIncome: 622809,
  taxDeducted: 167596,
  socialSecurityDeducted: 25220,
  healthInsuranceDeducted: 27708,
};

describe("mapExtracted106ToForm135", () => {
  it("should map all Form 106 fields to correct Form 135 boxes", () => {
    const result = mapExtracted106ToForm135(SAMPLE_106);

    expect(result.employeeId).toBe("031394828");
    expect(result.employerId).toBe("921513545");
    expect(result.taxYear).toBe(2024);
    expect(result.box158_grossIncome).toBe(622809);
    expect(result.box042_taxDeducted).toBe(167596);
  });

  it("should be deterministic (same input produces same output)", () => {
    const result1 = mapExtracted106ToForm135(SAMPLE_106);
    const result2 = mapExtracted106ToForm135(SAMPLE_106);
    expect(result1).toEqual(result2);
  });

  it("should not include socialSecurityDeducted or healthInsuranceDeducted", () => {
    const result = mapExtracted106ToForm135(SAMPLE_106);
    const keys = Object.keys(result);
    expect(keys).not.toContain("socialSecurityDeducted");
    expect(keys).not.toContain("healthInsuranceDeducted");
    expect(keys).toHaveLength(5);
  });

  it("should handle zero values correctly", () => {
    const zeroInput: Extracted106 = {
      ...SAMPLE_106,
      grossIncome: 0,
      taxDeducted: 0,
    };
    const result = mapExtracted106ToForm135(zeroInput);
    expect(result.box158_grossIncome).toBe(0);
    expect(result.box042_taxDeducted).toBe(0);
  });

  it("should export a semver version string", () => {
    expect(MAPPER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
