import { IngestionFailure, PARSER_VERSION } from "../errors/ingestion-errors";

export interface ExtractedText {
  raw: string;
}

/**
 * Stub PDF text extractor.
 * Returns deterministic placeholder text for testing.
 * Replace with real PDF extraction when ready.
 */
export function extractPdfText(_pdfBuffer: Buffer): ExtractedText {
  // Stub implementation - returns fixed text for deterministic testing
  // In production, this would use a PDF parsing library
  throw new IngestionFailure({
    stage: "extract",
    parserVersion: PARSER_VERSION,
    message: "PDF extraction not implemented - use extractPdfTextStub for tests",
  });
}

/**
 * Deterministic stub for testing.
 * Returns fixed extracted text that can be normalized.
 */
export function extractPdfTextStub(): ExtractedText {
  return {
    raw: `
      Form 106 - Annual Tax Statement
      Employee ID: 123456782
      Employer ID: 987654324
      Tax Year: 2024
      Gross Income: 150000
      Tax Deducted: 25000
      Social Security: 7500
      Health Insurance: 4500
    `,
  };
}
