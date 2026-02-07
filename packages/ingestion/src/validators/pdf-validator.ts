import { open, stat } from "fs/promises";
import {
  IngestionFailure,
  PARSER_VERSION,
  type SecurityErrorCode,
} from "../errors/ingestion-errors";

/**
 * Maximum allowed PDF file size in bytes (50 MB).
 * Form 106 PDFs are typically 100KB–2MB. 50MB is generous.
 */
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * PDF magic bytes: %PDF- (hex: 25 50 44 46 2D)
 * Must appear in the first 1024 bytes of a valid PDF.
 */
const PDF_MAGIC = Buffer.from("%PDF-");

/**
 * How many bytes to read for header validation.
 * PDF spec allows %PDF- to appear within the first 1024 bytes.
 */
const HEADER_SCAN_SIZE = 1024;

/**
 * How many bytes to read for object scanning.
 * We scan the entire file (up to MAX_PDF_SIZE_BYTES) for dangerous objects.
 * Reading raw bytes avoids loading the file into a PDF parser,
 * which itself could be exploited.
 */
const SCAN_CHUNK_SIZE = 64 * 1024; // 64KB chunks

/**
 * Dangerous PDF object patterns that indicate security risks.
 * These are scanned as byte sequences in the raw PDF content.
 *
 * Reference: https://www.opswat.com/blog/05-signs-of-malicious-behavior-and-embedded-threats-in-pdfs
 */
export const DANGEROUS_PATTERNS = [
  { pattern: "/JS",            label: "JavaScript reference" },
  { pattern: "/JavaScript",    label: "JavaScript action" },
  { pattern: "/Launch",        label: "Launch action (command execution)" },
  { pattern: "/EmbeddedFile",  label: "Embedded file" },
  { pattern: "/RichMedia",     label: "Rich media (Flash/video)" },
  { pattern: "/XFA",           label: "XFA form (dynamic scripting)" },
] as const;

/**
 * Action patterns that are dangerous only when they trigger automatically.
 * /OpenAction and /AA (Additional Actions) run code when the PDF is opened.
 */
export const AUTO_ACTION_PATTERNS = [
  { pattern: "/OpenAction",    label: "Auto-open action" },
  { pattern: "/AA",            label: "Additional auto-actions" },
] as const;

function createSecurityError(
  code: SecurityErrorCode,
  message: string,
): IngestionFailure {
  return new IngestionFailure({
    stage: "extract",
    parserVersion: PARSER_VERSION,
    code,
    message,
  });
}

/**
 * Validate that a buffer starts with valid PDF magic bytes.
 * The %PDF- signature must appear within the first 1024 bytes.
 */
export function validateMagicBytes(header: Buffer): boolean {
  if (header.length < PDF_MAGIC.length) {
    return false;
  }

  const scanEnd = Math.min(header.length, HEADER_SCAN_SIZE);
  for (let i = 0; i <= scanEnd - PDF_MAGIC.length; i++) {
    if (header.subarray(i, i + PDF_MAGIC.length).equals(PDF_MAGIC)) {
      return true;
    }
  }

  return false;
}

/**
 * Scan a buffer for dangerous PDF objects.
 * Returns array of detected threats.
 *
 * Searches for exact ASCII patterns in raw bytes.
 * This approach works because PDF object names are always ASCII
 * and cannot be split across different encodings.
 */
export function scanForDangerousObjects(
  content: Buffer
): Array<{ pattern: string; label: string }> {
  const found: Array<{ pattern: string; label: string }> = [];

  const allPatterns = [...DANGEROUS_PATTERNS, ...AUTO_ACTION_PATTERNS];

  for (const { pattern, label } of allPatterns) {
    const needle = Buffer.from(pattern, "ascii");
    if (content.includes(needle)) {
      found.push({ pattern, label });
    }
  }

  return found;
}

/**
 * Validate a PDF file for security threats before processing.
 *
 * Checks (in order):
 * 1. File exists and is readable
 * 2. File size is within limits
 * 3. Magic bytes confirm it's a PDF
 * 4. No dangerous objects (JS, Launch, EmbeddedFile, etc.)
 *
 * Throws IngestionFailure with appropriate SecurityErrorCode on failure.
 * Returns silently if the file passes all checks.
 */
export async function validatePdfSecurity(
  filePath: string,
  maxSizeBytes: number = MAX_PDF_SIZE_BYTES,
): Promise<void> {
  // Check 1: File size
  let fileSize: number;
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw createSecurityError(
        "PDF_INVALID_FORMAT",
        "Path is not a file",
      );
    }
    fileSize = stats.size;
  } catch (err) {
    if (err instanceof IngestionFailure) throw err;
    throw createSecurityError(
      "PDF_INVALID_FORMAT",
      "Cannot access file for security validation",
    );
  }

  if (fileSize > maxSizeBytes) {
    throw createSecurityError(
      "PDF_TOO_LARGE",
      `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`,
    );
  }

  if (fileSize === 0) {
    throw createSecurityError(
      "PDF_INVALID_FORMAT",
      "File is empty",
    );
  }

  // Check 2 & 3: Read file and validate
  let fd;
  try {
    fd = await open(filePath, "r");

    // Read header for magic bytes
    const headerBuffer = Buffer.alloc(Math.min(HEADER_SCAN_SIZE, fileSize));
    await fd.read(headerBuffer, 0, headerBuffer.length, 0);

    if (!validateMagicBytes(headerBuffer)) {
      throw createSecurityError(
        "PDF_INVALID_FORMAT",
        "File does not have valid PDF header (%PDF-). Not a PDF file.",
      );
    }

    // Scan entire file for dangerous objects
    const threats: Array<{ pattern: string; label: string }> = [];
    let offset = 0;

    while (offset < fileSize) {
      const chunkSize = Math.min(SCAN_CHUNK_SIZE, fileSize - offset);
      // Read slightly more to handle patterns that span chunk boundaries
      const overlapSize = 20; // longest pattern is "/EmbeddedFile" = 13 chars
      const readSize = Math.min(chunkSize + overlapSize, fileSize - offset);
      const chunk = Buffer.alloc(readSize);
      const { bytesRead } = await fd.read(chunk, 0, readSize, offset);

      if (bytesRead === 0) break;

      const chunkThreats = scanForDangerousObjects(chunk.subarray(0, bytesRead));
      for (const threat of chunkThreats) {
        // Deduplicate
        if (!threats.some(t => t.pattern === threat.pattern)) {
          threats.push(threat);
        }
      }

      offset += chunkSize;
    }

    if (threats.length > 0) {
      const threatList = threats.map(t => `${t.label} (${t.pattern})`).join(", ");
      throw createSecurityError(
        "PDF_SECURITY_RISK",
        `PDF contains potentially dangerous content: ${threatList}`,
      );
    }
  } finally {
    if (fd) {
      await fd.close();
    }
  }
}
