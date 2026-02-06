import type { Extracted106 } from "@tax/domain";
import type { ExtractedText } from "../extractors/pdf-text";
import {
  IngestionFailure,
  PARSER_VERSION,
  NormalizationErrorCode,
} from "../errors/ingestion-errors";
import {
  extractMandatoryFields,
  tryParseStubFormat,
} from "../extractors/box-extractor";

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
 * Parse extracted text into Extracted106 data.
 * Tries multiple parsing strategies in order:
 * 1. Stub format (English labels) - for backward compatibility
 * 2. Box-anchored extraction (Hebrew/English with positional anchors)
 *
 * Throws if text is garbled or fields cannot be extracted.
 */
function parseExtractedText(extracted: ExtractedText): Extracted106 {
  const text = extracted.raw;

  // Check for garbled text first
  if (isTextGarbled(text)) {
    throw createNormalizationError(
      "TEXT_GARBLED",
      "Extracted text appears to be CID-garbled. OCR may be required."
    );
  }

  // Try stub format first (for backward compatibility with tests)
  const stubResult = tryParseStubFormat(text);
  if (stubResult) {
    return stubResult;
  }

  // Use box-anchored extraction for Hebrew/English forms
  // This will throw MANDATORY_FIELD_MISSING or FIELD_AMBIGUOUS if needed
  return extractMandatoryFields(text);
}

/**
 * Normalize extracted text into an Extracted106 object.
 * This is deterministic: same input always produces same output.
 *
 * @throws {IngestionFailure} If normalization fails
 */
export function normalize106(extracted: ExtractedText): Extracted106 {
  return parseExtractedText(extracted);
}
