import { Normalized106Schema, type Normalized106 } from "@tax/domain";
import type { ExtractedText, ExtractPdfOptions } from "../extractors/pdf-text";
import { extractPdfText, extractPdfTextStub } from "../extractors/pdf-text";
import { normalize106 } from "../normalizers/normalize-106";
import { IngestionFailure, PARSER_VERSION } from "../errors/ingestion-errors";

export interface IngestionResult {
  success: true;
  data: Normalized106;
  parserVersion: string;
}

export interface IngestionErrorResult {
  success: false;
  error: IngestionFailure;
}

export type Ingest106Result = IngestionResult | IngestionErrorResult;

export interface Ingest106Options {
  password?: string;
  timeoutMs?: number;
}

/**
 * Ingest a Form 106 PDF from file path.
 * Stages: extract → normalize → validate
 *
 * @param filePath - Absolute path to the PDF file
 * @param options - Optional extraction options (password, timeout)
 */
export async function ingest106FromPdf(
  filePath: string,
  options?: Ingest106Options
): Promise<Ingest106Result> {
  try {
    // Stage 1: Extract
    const extractOptions: ExtractPdfOptions = {};
    if (options?.password) extractOptions.password = options.password;
    if (options?.timeoutMs) extractOptions.timeoutMs = options.timeoutMs;

    const extracted = await extractPdfText(filePath, extractOptions);

    // Stage 2: Normalize
    const normalized = normalize106(extracted);

    // Stage 3: Validate
    const validated = Normalized106Schema.parse(normalized);

    return {
      success: true,
      data: validated,
      parserVersion: PARSER_VERSION,
    };
  } catch (error) {
    if (error instanceof IngestionFailure) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new IngestionFailure({
        stage: "validate",
        parserVersion: PARSER_VERSION,
        message: error instanceof Error ? error.message : "Unknown validation error",
        cause: error,
      }),
    };
  }
}

/**
 * Ingest from pre-extracted text (for testing).
 * Stages: normalize → validate
 */
export function ingest106FromExtracted(extracted: ExtractedText): Ingest106Result {
  try {
    // Stage 2: Normalize
    const normalized = normalize106(extracted);

    // Stage 3: Validate
    const validated = Normalized106Schema.parse(normalized);

    return {
      success: true,
      data: validated,
      parserVersion: PARSER_VERSION,
    };
  } catch (error) {
    if (error instanceof IngestionFailure) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new IngestionFailure({
        stage: "validate",
        parserVersion: PARSER_VERSION,
        message: error instanceof Error ? error.message : "Unknown validation error",
        cause: error,
      }),
    };
  }
}

/**
 * Ingest using stub extractor (for testing).
 * Uses deterministic stub data.
 */
export function ingest106Stub(): Ingest106Result {
  const extracted = extractPdfTextStub();
  return ingest106FromExtracted(extracted);
}
