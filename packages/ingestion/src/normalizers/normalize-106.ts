import type { Normalized106 } from "@tax/domain";
import { isValidIsraeliId } from "@tax/domain";
import type { ExtractedText } from "../extractors/pdf-text";
import {
  IngestionFailure,
  PARSER_VERSION,
  NormalizationErrorCode,
} from "../errors/ingestion-errors";

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
 * Create a normalization error without including raw text.
 */
function createNormalizationError(
  code: NormalizationErrorCode,
  message: string,
  fieldName?: string
): IngestionFailure {
  return new IngestionFailure({
    stage: "normalize",
    parserVersion: PARSER_VERSION,
    code,
    message,
    cause: fieldName ? { field: fieldName } : undefined,
  });
}

/**
 * Detect if text appears to be CID-garbled (common with Hebrew PDFs).
 * Garbled text often has:
 * - High ratio of symbols/punctuation to alphanumeric
 * - Patterns like "Z061+ 047\" or "477+///"
 */
function isTextGarbled(text: string): boolean {
  // Check for common garbling patterns
  const garbledPatterns = [
    /Z\d+\+\s*\d+\\/,      // Pattern like "Z061+ 047\"
    /\d+\+\/+/,            // Pattern like "477+///"
    /\/\d+\s+\/\d+/,       // Pattern like "/9  /9"
  ];

  for (const pattern of garbledPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check if text has very few readable Hebrew or English words
  // If mostly symbols and numbers with weird patterns, likely garbled
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 3) {
    return false; // Too short to determine
  }

  // Count lines with garbled-looking content
  let garbledLines = 0;
  for (const line of lines) {
    // Lines with high ratio of special chars to letters
    const letters = (line.match(/[a-zA-Z\u0590-\u05FF]/g) || []).length;
    const specials = (line.match(/[+\\\/\[\]{}|]/g) || []).length;
    if (specials > letters && specials > 3) {
      garbledLines++;
    }
  }

  return garbledLines > lines.length * 0.3;
}

/**
 * Parse number from text, handling thousands separators.
 * Supports: 1,234.56 or 1234.56 or 1234
 */
function parseNumber(text: string): number | null {
  // Remove thousands separators (comma)
  const cleaned = text.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Parse Israeli ID, padding to 9 digits if needed.
 */
function parseIsraeliId(text: string): string | null {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length === 0 || cleaned.length > 9) {
    return null;
  }
  const padded = cleaned.padStart(9, "0");
  return isValidIsraeliId(padded) ? padded : null;
}

/**
 * Parse year from text.
 */
function parseYear(text: string): number | null {
  const match = text.match(/\b(20\d{2})\b/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year >= 2010 && year <= new Date().getFullYear() + 1) {
      return year;
    }
  }
  return null;
}

/**
 * Try to parse using stub format (English labels).
 * Format: "Field Name: value"
 */
function tryParseStubFormat(text: string): RawForm106Data | null {
  const employeeIdMatch = text.match(/Employee ID:\s*(\d+)/i);
  const employerIdMatch = text.match(/Employer ID:\s*(\d+)/i);
  const taxYearMatch = text.match(/Tax Year:\s*(\d+)/i);
  const grossIncomeMatch = text.match(/Gross Income:\s*([\d,]+(?:\.\d+)?)/i);
  const taxDeductedMatch = text.match(/Tax Deducted:\s*([\d,]+(?:\.\d+)?)/i);
  const socialSecurityMatch = text.match(/Social Security:\s*([\d,]+(?:\.\d+)?)/i);
  const healthInsuranceMatch = text.match(/Health Insurance:\s*([\d,]+(?:\.\d+)?)/i);

  if (
    !employeeIdMatch ||
    !employerIdMatch ||
    !taxYearMatch ||
    !grossIncomeMatch ||
    !taxDeductedMatch ||
    !socialSecurityMatch ||
    !healthInsuranceMatch
  ) {
    return null;
  }

  const employeeId = parseIsraeliId(employeeIdMatch[1]);
  const employerId = parseIsraeliId(employerIdMatch[1]);
  const taxYear = parseInt(taxYearMatch[1], 10);
  const grossIncome = parseNumber(grossIncomeMatch[1]);
  const taxDeducted = parseNumber(taxDeductedMatch[1]);
  const socialSecurityDeducted = parseNumber(socialSecurityMatch[1]);
  const healthInsuranceDeducted = parseNumber(healthInsuranceMatch[1]);

  if (
    employeeId === null ||
    employerId === null ||
    grossIncome === null ||
    taxDeducted === null ||
    socialSecurityDeducted === null ||
    healthInsuranceDeducted === null
  ) {
    return null;
  }

  return {
    employeeId,
    employerId,
    taxYear,
    grossIncome,
    taxDeducted,
    socialSecurityDeducted,
    healthInsuranceDeducted,
  };
}

/**
 * Parse extracted text into raw form data.
 * Tries multiple parsing strategies in order:
 * 1. Stub format (English labels)
 * 2. (Future) Real Form 106 Hebrew format
 *
 * Throws if text is garbled or fields cannot be extracted.
 */
function parseExtractedText(extracted: ExtractedText): RawForm106Data {
  const text = extracted.raw;

  // Check for garbled text first
  if (isTextGarbled(text)) {
    throw createNormalizationError(
      "TEXT_GARBLED",
      "Extracted text appears to be CID-garbled. OCR may be required."
    );
  }

  // Try stub format (for tests and English-labeled forms)
  const stubResult = tryParseStubFormat(text);
  if (stubResult) {
    return stubResult;
  }

  // If we get here, we couldn't parse the text
  // Determine which field is missing for better error reporting
  const fields = [
    { name: "employeeId", pattern: /Employee ID:/i },
    { name: "employerId", pattern: /Employer ID:/i },
    { name: "taxYear", pattern: /Tax Year:/i },
    { name: "grossIncome", pattern: /Gross Income:/i },
    { name: "taxDeducted", pattern: /Tax Deducted:/i },
    { name: "socialSecurityDeducted", pattern: /Social Security:/i },
    { name: "healthInsuranceDeducted", pattern: /Health Insurance:/i },
  ];

  for (const field of fields) {
    if (!field.pattern.test(text)) {
      throw createNormalizationError(
        "FIELD_NOT_FOUND",
        `Required field '${field.name}' not found in extracted text`,
        field.name
      );
    }
  }

  // Fields were found but values are invalid
  throw createNormalizationError(
    "FIELD_INVALID",
    "One or more fields have invalid values"
  );
}

/**
 * Normalize extracted text into a Normalized106 object.
 * This is deterministic: same input always produces same output.
 *
 * @throws {IngestionFailure} If normalization fails
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
