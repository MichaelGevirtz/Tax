import { describe, it, expect } from "vitest";
import { normalize106 } from "./normalize-106";
import { extractPdfTextStub } from "../extractors/pdf-text";
import { IngestionFailure } from "../errors/ingestion-errors";

describe("normalize106", () => {
  it("should normalize extracted text to Normalized106 format", () => {
    const extracted = extractPdfTextStub();
    const result = normalize106(extracted);

    expect(result.employeeId).toBe("123456782");
    expect(result.employerId).toBe("987654324");
    expect(result.taxYear).toBe(2024);
    expect(result.grossIncome).toBe(150000);
    expect(result.taxDeducted).toBe(25000);
    expect(result.socialSecurityDeducted).toBe(7500);
    expect(result.healthInsuranceDeducted).toBe(4500);
  });

  it("should throw IngestionFailure for missing fields", () => {
    const badExtracted = { raw: "Invalid content without proper fields" };

    expect(() => normalize106(badExtracted)).toThrow(IngestionFailure);
  });

  it("should throw IngestionFailure with normalize stage", () => {
    const badExtracted = { raw: "Invalid content" };

    try {
      normalize106(badExtracted);
    } catch (error) {
      expect(error).toBeInstanceOf(IngestionFailure);
      if (error instanceof IngestionFailure) {
        expect(error.stage).toBe("normalize");
      }
    }
  });
});
