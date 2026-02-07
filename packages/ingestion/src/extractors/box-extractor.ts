import type { Extracted106 } from "@tax/domain";
import { isValidIsraeliId } from "@tax/domain";
import {
  IngestionFailure,
  PARSER_VERSION,
  NormalizationErrorCode,
} from "../errors/ingestion-errors";

/**
 * Box anchor patterns for Form 106 fields.
 * Numbers-first approach: find numeric patterns, then anchor to box numbers.
 * Supports both Hebrew labels and box numbers (e.g., "משבצת 42").
 */
export const FIELD_ANCHORS = {
  employeeId: /מספר\s*זהות\s*עובד|ת\.ז\.\s*עובד|Employee ID/i,
  employerId: /מספר\s*מזהה\s*מעסיק|ח\.פ\.|Employer ID/i,
  taxYear: /שנת\s*מס|Tax Year/i,
  grossIncome: /סה"כ\s*הכנסה\s*ממשכורת|משבצת\s*42|Gross Income/i,
  taxDeducted: /מס\s*שנוכה|משבצת\s*36|Tax Deducted/i,
  socialSecurityDeducted: /ביטוח\s*לאומי|משבצת\s*38|Social Security/i,
  healthInsuranceDeducted: /ביטוח\s*בריאות|משבצת\s*39|Health Insurance/i,
} as const;

export type FieldName = keyof typeof FIELD_ANCHORS;

/** Mandatory fields that must be present for valid extraction */
export const MANDATORY_FIELDS: FieldName[] = [
  "employeeId",
  "employerId",
  "taxYear",
  "grossIncome",
  "taxDeducted",
  "socialSecurityDeducted",
  "healthInsuranceDeducted",
];

/** Result of extracting a single field */
export interface FieldExtractionResult {
  value: number | string;
  confidence: number;
  position: number;
}

/**
 * Create an extraction error.
 */
function createExtractionError(
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
 * Parse number from text, handling thousands separators.
 * Supports: 1,234.56 or 1234.56 or 1234 or 1,234
 */
export function parseNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Parse Israeli ID, padding to 9 digits if needed.
 */
export function parseIsraeliId(text: string): string | null {
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
export function parseYear(text: string): number | null {
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
 * Find all numeric patterns in text with their positions.
 * Returns numbers with comma/decimal handling.
 */
export function findNumericPatterns(text: string): Array<{ value: string; position: number }> {
  const results: Array<{ value: string; position: number }> = [];
  // Match numbers with optional thousands separators and decimals
  // Order matters: try comma-separated numbers first, then plain numbers
  // \b\d{1,3}(?:,\d{3})+ - numbers with at least one comma separator (e.g., 1,234 or 1,234,567)
  // \b\d+(?:\.\d+)? - plain numbers with optional decimal
  const numericRegex = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?|\b\d+(?:\.\d+)?\b/g;

  let match;
  while ((match = numericRegex.exec(text)) !== null) {
    results.push({
      value: match[0],
      position: match.index,
    });
  }

  return results;
}

/**
 * Find 9-digit ID patterns in text with their positions.
 */
export function findIdPatterns(text: string): Array<{ value: string; position: number }> {
  const results: Array<{ value: string; position: number }> = [];
  // Match 9-digit numbers or numbers that could be IDs (1-9 digits)
  const idRegex = /\b\d{1,9}\b/g;

  let match;
  while ((match = idRegex.exec(text)) !== null) {
    // Only include if it could be a valid Israeli ID (1-9 digits)
    const padded = match[0].padStart(9, "0");
    if (isValidIsraeliId(padded)) {
      results.push({
        value: match[0],
        position: match.index,
      });
    }
  }

  return results;
}

/**
 * Calculate proximity score between an anchor position and a value position.
 * Higher score = closer proximity.
 * Prefers values that come AFTER the anchor (typical "Label: value" pattern).
 * Also handles RTL by considering values before anchor with lower weight.
 */
function calculateProximityScore(
  anchorPos: number,
  anchorLength: number,
  valuePos: number,
  maxDistance: number = 200
): number {
  const anchorEnd = anchorPos + anchorLength;

  // Value comes after anchor (typical case)
  if (valuePos >= anchorEnd) {
    const distance = valuePos - anchorEnd;
    if (distance > maxDistance) {
      return 0;
    }
    // Values immediately after anchor get highest score
    return 1 - (distance / maxDistance);
  }

  // Value comes before anchor (RTL or unusual layout)
  const distance = anchorPos - valuePos;
  if (distance > maxDistance) {
    return 0;
  }
  // Reduce score for values before anchor (0.5x weight)
  return (1 - (distance / maxDistance)) * 0.5;
}

/**
 * Extract a field value using box anchors.
 * Returns the closest numeric value to the anchor pattern.
 */
export function extractFieldByAnchor(
  text: string,
  fieldName: FieldName
): FieldExtractionResult | null {
  const anchor = FIELD_ANCHORS[fieldName];
  const anchorMatch = anchor.exec(text);

  if (!anchorMatch) {
    return null;
  }

  const anchorPos = anchorMatch.index;
  const anchorLen = anchorMatch[0].length;

  // For ID fields, use ID patterns
  if (fieldName === "employeeId" || fieldName === "employerId") {
    const idPatterns = findIdPatterns(text);
    if (idPatterns.length === 0) {
      return null;
    }

    // Find the closest valid ID to the anchor
    let bestMatch: { value: string; position: number; score: number } | null = null;
    for (const pattern of idPatterns) {
      const score = calculateProximityScore(anchorPos, anchorLen, pattern.position);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { ...pattern, score };
      }
    }

    if (!bestMatch) {
      return null;
    }

    const parsedId = parseIsraeliId(bestMatch.value);
    if (!parsedId) {
      return null;
    }

    return {
      value: parsedId,
      confidence: bestMatch.score,
      position: bestMatch.position,
    };
  }

  // For year field
  if (fieldName === "taxYear") {
    const yearMatch = text.match(/\b(20\d{2})\b/g);
    if (!yearMatch) {
      return null;
    }

    // Find all year occurrences with positions
    const yearPatterns: Array<{ value: string; position: number }> = [];
    const yearRegex = /\b(20\d{2})\b/g;
    let match;
    while ((match = yearRegex.exec(text)) !== null) {
      yearPatterns.push({ value: match[1], position: match.index });
    }

    // Find closest year to anchor
    let bestMatch: { value: string; position: number; score: number } | null = null;
    for (const pattern of yearPatterns) {
      const score = calculateProximityScore(anchorPos, anchorLen, pattern.position, 100);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { ...pattern, score };
      }
    }

    if (!bestMatch) {
      // Fall back to first year found
      const year = parseYear(text);
      if (year !== null) {
        return { value: year, confidence: 0.5, position: 0 };
      }
      return null;
    }

    const year = parseInt(bestMatch.value, 10);
    return {
      value: year,
      confidence: bestMatch.score,
      position: bestMatch.position,
    };
  }

  // For numeric money fields
  const numericPatterns = findNumericPatterns(text);
  if (numericPatterns.length === 0) {
    return null;
  }

  // Find the closest number to the anchor
  let bestMatch: { value: string; position: number; score: number } | null = null;
  for (const pattern of numericPatterns) {
    const score = calculateProximityScore(anchorPos, anchorLen, pattern.position);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { ...pattern, score };
    }
  }

  if (!bestMatch) {
    return null;
  }

  const parsed = parseNumber(bestMatch.value);
  if (parsed === null) {
    return null;
  }

  return {
    value: parsed,
    confidence: bestMatch.score,
    position: bestMatch.position,
  };
}

/**
 * Check for ambiguous field extraction (multiple candidates with similar confidence).
 */
export function checkAmbiguity(
  text: string,
  fieldName: FieldName,
  primaryResult: FieldExtractionResult
): boolean {
  const anchor = FIELD_ANCHORS[fieldName];
  const anchorMatch = anchor.exec(text);

  if (!anchorMatch) {
    return false;
  }

  const anchorPos = anchorMatch.index;
  const anchorLen = anchorMatch[0].length;

  // Get all candidates
  const patterns = fieldName === "employeeId" || fieldName === "employerId"
    ? findIdPatterns(text)
    : findNumericPatterns(text);

  // Count candidates with confidence close to primary (within 20%)
  const threshold = primaryResult.confidence * 0.8;
  let closeMatches = 0;

  for (const pattern of patterns) {
    const score = calculateProximityScore(anchorPos, anchorLen, pattern.position);
    if (score >= threshold && pattern.position !== primaryResult.position) {
      closeMatches++;
    }
  }

  // Ambiguous if more than one candidate has similar confidence
  return closeMatches > 0;
}

/**
 * Extract all mandatory fields from Form 106 text.
 * Throws MANDATORY_FIELD_MISSING if required fields cannot be found.
 * Throws FIELD_AMBIGUOUS if multiple candidates with similar confidence.
 */
export function extractMandatoryFields(text: string): Extracted106 {
  const result: Record<string, number | string> = {};
  const errors: Array<{ field: string; error: string }> = [];

  for (const fieldName of MANDATORY_FIELDS) {
    const extraction = extractFieldByAnchor(text, fieldName);

    if (!extraction) {
      errors.push({ field: fieldName, error: "not found" });
      continue;
    }

    // Check for ambiguity only if confidence is below threshold
    if (extraction.confidence < 0.7 && checkAmbiguity(text, fieldName, extraction)) {
      throw createExtractionError(
        "FIELD_AMBIGUOUS",
        `Multiple candidates found for field '${fieldName}' with similar confidence`,
        fieldName
      );
    }

    result[fieldName] = extraction.value;
  }

  // Check if any mandatory fields are missing
  if (errors.length > 0) {
    const missingFields = errors.map((e) => e.field).join(", ");
    throw createExtractionError(
      "MANDATORY_FIELD_MISSING",
      `Required fields not found: ${missingFields}`,
      errors[0].field
    );
  }

  return result as unknown as Extracted106;
}

/**
 * Try to parse using stub format (English labels) as a fallback.
 * This supports backward compatibility with existing test fixtures.
 */
export function tryParseStubFormat(text: string): Extracted106 | null {
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
