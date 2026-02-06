import { execFile } from "child_process";
import { promisify } from "util";
import { access, stat } from "fs/promises";
import { constants } from "fs";
import {
  IngestionFailure,
  PARSER_VERSION,
  ExtractionErrorCode,
} from "../errors/ingestion-errors";

const execFileAsync = promisify(execFile);

export interface ExtractPdfOptions {
  password?: string;
  timeoutMs?: number;
}

export interface ExtractedText {
  raw: string;
}

/** Default threshold in characters for image-only detection */
export const IMAGE_ONLY_THRESHOLD = 50;

/** Minimum meaningful characters (non-whitespace/control) for text detection */
const MEANINGFUL_CHARS_THRESHOLD = 20;

/**
 * Check if a PDF appears to be image-only (scanned) based on extraction output.
 * Uses heuristics based on extraction output length.
 *
 * @param extracted - The extracted text result
 * @param threshold - Character threshold (default: 50)
 * @returns true if PDF appears to be image-only (scanned)
 */
export function isImageOnlyPdf(extracted: ExtractedText, threshold: number = IMAGE_ONLY_THRESHOLD): boolean {
  const text = extracted.raw.trim();

  // If very short output, likely image-only
  if (text.length < threshold) {
    return true;
  }

  // If only whitespace/control characters, likely image-only
  const meaningfulChars = text.replace(/[\s\x00-\x1f]/g, "");
  if (meaningfulChars.length < MEANINGFUL_CHARS_THRESHOLD) {
    return true;
  }

  return false;
}

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Normalize extracted text for deterministic output:
 * - Normalize line endings to \n
 * - Trim trailing whitespace from each line
 * - Trim leading/trailing empty lines
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Create an IngestionFailure with the given code and message.
 * IMPORTANT: Never include password in error messages.
 */
function createExtractionError(
  code: ExtractionErrorCode,
  message: string,
  cause?: unknown
): IngestionFailure {
  return new IngestionFailure({
    stage: "extract",
    parserVersion: PARSER_VERSION,
    code,
    message,
    cause,
  });
}

/**
 * Detect error type from pdftotext stderr/exit code.
 * Known exit codes:
 * - 0: success
 * - 1: error opening PDF (could be password required or invalid)
 * - 2: error opening output file
 * - 3: PDF has permissions that disallow copying
 */
function detectPdftotextError(
  stderr: string,
  exitCode: number | null,
  hasPassword: boolean
): ExtractionErrorCode {
  const stderrLower = stderr.toLowerCase();

  // Check for password-related errors
  if (
    stderrLower.includes("incorrect password") ||
    stderrLower.includes("wrong password")
  ) {
    return "PDF_PASSWORD_INVALID";
  }

  if (
    stderrLower.includes("password") ||
    stderrLower.includes("encrypted") ||
    stderrLower.includes("command line error")
  ) {
    // If no password was provided and we get password-related error
    if (!hasPassword) {
      return "PDF_PASSWORD_REQUIRED";
    }
    // If password was provided but still failing, it's invalid
    return "PDF_PASSWORD_INVALID";
  }

  return "PDF_EXTRACTION_FAILED";
}

/**
 * Extract text from a PDF file using Poppler's pdftotext.
 *
 * Security notes:
 * - Uses execFile (not exec) to prevent command injection
 * - Password is passed as argument (visible in process list - known limitation)
 * - Password is never logged or included in error messages
 *
 * @param filePath - Absolute path to the PDF file
 * @param options - Optional extraction options
 * @returns Extracted text with deterministic formatting
 */
export async function extractPdfText(
  filePath: string,
  options?: ExtractPdfOptions
): Promise<ExtractedText> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const password = options?.password;

  // Validate file exists and is accessible
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw createExtractionError(
      "PDF_EXTRACTION_FAILED",
      `Cannot access file: ${filePath}`
    );
  }

  // Validate it's a file (not directory)
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw createExtractionError(
        "PDF_EXTRACTION_FAILED",
        `Path is not a file: ${filePath}`
      );
    }
  } catch (err) {
    if (err instanceof IngestionFailure) throw err;
    throw createExtractionError(
      "PDF_EXTRACTION_FAILED",
      `Cannot stat file: ${filePath}`,
      err
    );
  }

  // Build pdftotext arguments
  // -layout: maintain original layout
  // -: output to stdout
  const args: string[] = [];
  if (password) {
    args.push("-upw", password);
  }
  args.push("-layout", filePath, "-");

  try {
    const { stdout, stderr } = await execFileAsync("pdftotext", args, {
      timeout: timeoutMs,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024, // 50MB max output
    });

    // Even on success, check stderr for warnings
    if (stderr && stderr.trim()) {
      // Some warnings are acceptable, log them if needed
      // But don't include in production - no logging of potentially sensitive data
    }

    const normalizedText = normalizeText(stdout);

    // Return result even if empty - let caller check isImageOnlyPdf()
    // and route to OCR if needed
    return { raw: normalizedText };
  } catch (err: unknown) {
    // Handle already-wrapped errors
    if (err instanceof IngestionFailure) {
      throw err;
    }

    // Handle execFile errors
    const execError = err as {
      code?: string;
      killed?: boolean;
      signal?: string;
      stderr?: string;
      message?: string;
    };

    // Check if pdftotext binary is missing
    if (execError.code === "ENOENT") {
      throw createExtractionError(
        "PDF_TOOL_MISSING",
        "pdftotext binary not found. Install Poppler: https://poppler.freedesktop.org/"
      );
    }

    // Check for timeout
    if (execError.killed && execError.signal === "SIGTERM") {
      throw createExtractionError(
        "PDF_EXTRACTION_TIMEOUT",
        `PDF extraction timed out after ${timeoutMs}ms`
      );
    }

    // Parse stderr for specific error types
    const stderr = execError.stderr || execError.message || "";
    const errorCode = detectPdftotextError(stderr, null, !!password);

    // Build safe error message (never include password)
    let safeMessage: string;
    switch (errorCode) {
      case "PDF_PASSWORD_REQUIRED":
        safeMessage = "PDF is password-protected and no password was provided";
        break;
      case "PDF_PASSWORD_INVALID":
        safeMessage = "PDF password is incorrect";
        break;
      default:
        safeMessage = `PDF extraction failed for: ${filePath}`;
    }

    throw createExtractionError(errorCode, safeMessage);
  }
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
      Taxable Income: 140000
      Tax Deducted: 25000
      Social Security: 7500
      Health Insurance: 4500
      Pension Contribution: 6000
      Education Fund: 3000
    `,
  };
}
