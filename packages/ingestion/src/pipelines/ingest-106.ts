import { Extracted106Schema, type Extracted106 } from "@tax/domain";
import type { ExtractedText, ExtractPdfOptions } from "../extractors/pdf-text";
import { extractPdfText, extractPdfTextStub, isImageOnlyPdf } from "../extractors/pdf-text";
import { extractPdfViaOcr, isTesseractAvailable, type OcrOptions, type OcrQualityGateOptions } from "../extractors/ocr-text";
import { normalize106 } from "../normalizers/normalize-106";
import { validatePdfSecurity } from "../validators/pdf-validator";
import { IngestionFailure, PARSER_VERSION } from "../errors/ingestion-errors";

export type ExtractionMethod = "pdftotext" | "ocr_tesseract";

export interface IngestionResult {
  success: true;
  data: Extracted106;
  parserVersion: string;
  extractionMethod: ExtractionMethod;
}

export interface IngestionErrorResult {
  success: false;
  error: IngestionFailure;
}

export type Ingest106Result = IngestionResult | IngestionErrorResult;

export interface Ingest106Options {
  password?: string;
  timeoutMs?: number;
  /** Enable OCR fallback when text extraction yields garbled text */
  enableOcrFallback?: boolean;
  /** OCR-specific options */
  ocrOptions?: OcrOptions;
  /** OCR quality gate settings */
  ocrQualityGate?: OcrQualityGateOptions;
}

/**
 * Ingest a Form 106 PDF from file path.
 * Stages: extract → normalize → validate
 *
 * If pdftotext extraction yields garbled text and enableOcrFallback is true,
 * falls back to Tesseract OCR extraction.
 *
 * @param filePath - Absolute path to the PDF file
 * @param options - Optional extraction options (password, timeout, OCR fallback)
 */
export async function ingest106FromPdf(
  filePath: string,
  options?: Ingest106Options
): Promise<Ingest106Result> {
  const enableOcrFallback = options?.enableOcrFallback ?? false;

  try {
    // Stage 0: Security validation (before any tool touches the file)
    await validatePdfSecurity(filePath);

    // Stage 1: Extract via pdftotext
    const extractOptions: ExtractPdfOptions = {};
    if (options?.password) extractOptions.password = options.password;
    if (options?.timeoutMs) extractOptions.timeoutMs = options.timeoutMs;

    const extracted = await extractPdfText(filePath, extractOptions);

    // Check if PDF appears to be image-only (scanned)
    if (isImageOnlyPdf(extracted)) {
      if (enableOcrFallback) {
        // Route to OCR extraction
        return ingest106ViaOcr(filePath, options);
      }
      // No OCR fallback enabled - return error
      return {
        success: false,
        error: new IngestionFailure({
          stage: "extract",
          parserVersion: PARSER_VERSION,
          code: "PDF_IMAGE_ONLY",
          message: "PDF appears to be image-only (scanned). Enable OCR fallback to process.",
        }),
      };
    }

    // Stage 2: Normalize
    const normalized = normalize106(extracted);

    // Stage 3: Validate
    const validated = Extracted106Schema.parse(normalized);

    return {
      success: true,
      data: validated,
      parserVersion: PARSER_VERSION,
      extractionMethod: "pdftotext",
    };
  } catch (error) {
    // Check if we should try OCR fallback for garbled text
    if (
      error instanceof IngestionFailure &&
      error.code === "TEXT_GARBLED" &&
      enableOcrFallback
    ) {
      return ingest106ViaOcr(filePath, options);
    }

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
 * Ingest a Form 106 PDF using Tesseract OCR.
 * Called as fallback when pdftotext yields garbled text.
 */
async function ingest106ViaOcr(
  filePath: string,
  options?: Ingest106Options
): Promise<Ingest106Result> {
  try {
    // Check if Tesseract is available
    const tesseractAvailable = await isTesseractAvailable();
    if (!tesseractAvailable) {
      return {
        success: false,
        error: new IngestionFailure({
          stage: "extract",
          parserVersion: PARSER_VERSION,
          code: "OCR_TOOL_MISSING",
          message: "OCR fallback failed: Tesseract not installed",
        }),
      };
    }

    // Stage 1: Extract via OCR
    const ocrOptions: OcrOptions = {
      ...options?.ocrOptions,
      timeout: options?.ocrOptions?.timeout ?? options?.timeoutMs ?? 60000,
      qualityGate: options?.ocrQualityGate,
    };

    const ocrResult = await extractPdfViaOcr(filePath, ocrOptions);

    // Convert to ExtractedText format for normalization
    const extracted: ExtractedText = { raw: ocrResult.text };

    // Stage 2: Normalize
    const normalized = normalize106(extracted);

    // Stage 3: Validate
    const validated = Extracted106Schema.parse(normalized);

    return {
      success: true,
      data: validated,
      parserVersion: PARSER_VERSION,
      extractionMethod: "ocr_tesseract",
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
 *
 * @param extracted - Pre-extracted text
 * @param extractionMethod - The method used to extract the text (default: pdftotext)
 */
export function ingest106FromExtracted(
  extracted: ExtractedText,
  extractionMethod: ExtractionMethod = "pdftotext"
): Ingest106Result {
  try {
    // Stage 2: Normalize
    const normalized = normalize106(extracted);

    // Stage 3: Validate
    const validated = Extracted106Schema.parse(normalized);

    return {
      success: true,
      data: validated,
      parserVersion: PARSER_VERSION,
      extractionMethod,
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
