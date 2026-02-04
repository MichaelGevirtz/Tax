import type { Normalized106 } from "@tax/domain";
import type { ExtractedText } from "../extractors/pdf-text";
import { IngestionFailure, PARSER_VERSION } from "../errors/ingestion-errors";

export interface RawForm106Data {
  employeeId: string;
  employerId: string;
  taxYear: number;
  grossIncome: number;
  taxDeducted: number;
  socialSecurityDeducted: number;
  healthInsuranceDeducted: number;
}

/**
 * Parse extracted text into raw form data.
 * Stub implementation - uses regex to extract fields from text.
 */
function parseExtractedText(extracted: ExtractedText): RawForm106Data {
  const text = extracted.raw;

  const employeeIdMatch = text.match(/Employee ID:\s*(\d+)/);
  const employerIdMatch = text.match(/Employer ID:\s*(\d+)/);
  const taxYearMatch = text.match(/Tax Year:\s*(\d+)/);
  const grossIncomeMatch = text.match(/Gross Income:\s*(\d+)/);
  const taxDeductedMatch = text.match(/Tax Deducted:\s*(\d+)/);
  const socialSecurityMatch = text.match(/Social Security:\s*(\d+)/);
  const healthInsuranceMatch = text.match(/Health Insurance:\s*(\d+)/);

  if (
    !employeeIdMatch ||
    !employerIdMatch ||
    !taxYearMatch ||
    !grossIncomeMatch ||
    !taxDeductedMatch ||
    !socialSecurityMatch ||
    !healthInsuranceMatch
  ) {
    throw new IngestionFailure({
      stage: "normalize",
      parserVersion: PARSER_VERSION,
      message: "Failed to extract required fields from Form 106 text",
    });
  }

  return {
    employeeId: employeeIdMatch[1],
    employerId: employerIdMatch[1],
    taxYear: parseInt(taxYearMatch[1], 10),
    grossIncome: parseFloat(grossIncomeMatch[1]),
    taxDeducted: parseFloat(taxDeductedMatch[1]),
    socialSecurityDeducted: parseFloat(socialSecurityMatch[1]),
    healthInsuranceDeducted: parseFloat(healthInsuranceMatch[1]),
  };
}

/**
 * Normalize extracted text into a Normalized106 object.
 * This is deterministic: same input always produces same output.
 */
export function normalize106(extracted: ExtractedText): Normalized106 {
  const raw = parseExtractedText(extracted);

  return {
    employeeId: raw.employeeId,
    employerId: raw.employerId,
    taxYear: raw.taxYear,
    grossIncome: raw.grossIncome,
    taxDeducted: raw.taxDeducted,
    socialSecurityDeducted: raw.socialSecurityDeducted,
    healthInsuranceDeducted: raw.healthInsuranceDeducted,
  };
}
