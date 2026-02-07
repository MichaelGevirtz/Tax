import { execFile } from "child_process";
import { promisify } from "util";
import { access, stat, readdir, readFile, unlink, mkdir, rm } from "fs/promises";
import { constants } from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import {
  IngestionFailure,
  PARSER_VERSION,
  OcrErrorCode,
} from "../errors/ingestion-errors";

const execFileAsync = promisify(execFile);

export interface OcrOptions {
  languages?: string[];  // Default: ['heb', 'eng']
  dpi?: number;          // Default: 300
  timeout?: number;      // Default: 60000ms
  qualityGate?: OcrQualityGateOptions;  // Quality gate configuration
}

/** Quality gate configuration for OCR extraction */
export interface OcrQualityGateOptions {
  /** Fail if mean confidence below this (default: 40) */
  criticalThreshold?: number;
  /** Warn if mean confidence below this (default: 60) */
  warningThreshold?: number;
  /** Disable quality gates entirely */
  disabled?: boolean;
}

/** OCR confidence metrics extracted from Tesseract */
export interface OcrConfidence {
  mean: number;              // 0-100, average word confidence
  min: number;               // 0-100, lowest word confidence
  lowConfidenceRatio: number; // 0-1, ratio of words below threshold
  wordCount: number;         // Total words analyzed
}

export interface OcrResult {
  text: string;
  confidence?: OcrConfidence;
  warnings?: string[];       // Quality warnings if applicable
}

/** Quality threshold constants */
export const OCR_QUALITY_THRESHOLDS = {
  /** Below this mean confidence, extraction fails */
  CRITICAL_MEAN: 40,
  /** Below this mean confidence, warning is added */
  WARNING_MEAN: 60,
  /** Per-word threshold for "low confidence" classification */
  LOW_CONFIDENCE_WORD_THRESHOLD: 50,
  /** If more than this ratio of words are low-confidence, warn */
  LOW_CONFIDENCE_RATIO_WARNING: 0.3,
  /** Minimum words required for confidence to be meaningful */
  MIN_WORDS_FOR_CONFIDENCE: 10,
} as const;

/** User-friendly quality messages */
const QUALITY_MESSAGES = {
  OCR_QUALITY_CRITICAL:
    "OCR quality too low to extract reliably. " +
    "Please provide a higher resolution scan (300+ DPI) " +
    "with good lighting and no shadows.",
  OCR_QUALITY_WARNING:
    "OCR quality is marginal. Results may contain errors. " +
    "Consider re-scanning at higher resolution if issues occur.",
};

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_DPI = 600;
const DEFAULT_LANGUAGES = ["heb", "eng"];

// Common Tesseract installation paths on Windows
const TESSERACT_PATHS_WINDOWS = [
  "tesseract",
  "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
  "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
];

// Common Tesseract installation paths on Unix-like systems
const TESSERACT_PATHS_UNIX = [
  "tesseract",
  "/usr/bin/tesseract",
  "/usr/local/bin/tesseract",
  "/opt/homebrew/bin/tesseract",
];

// Common pdftoppm installation paths
const PDFTOPPM_PATHS_WINDOWS = [
  "pdftoppm",
  // Winget installation path
  path.join(
    os.homedir(),
    "AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftoppm.exe"
  ),
  "C:\\Program Files\\poppler\\bin\\pdftoppm.exe",
  "C:\\Program Files (x86)\\poppler\\bin\\pdftoppm.exe",
];

const PDFTOPPM_PATHS_UNIX = [
  "pdftoppm",
  "/usr/bin/pdftoppm",
  "/usr/local/bin/pdftoppm",
  "/opt/homebrew/bin/pdftoppm",
];

let cachedTesseractPath: string | null = null;
let cachedPdftoppmPath: string | null = null;
let cachedTessdataPrefix: string | null = null;

// Common tessdata locations (checked in order)
const TESSDATA_PATHS_WINDOWS = [
  process.env.TESSDATA_PREFIX,
  path.join(os.homedir(), "tessdata"),
  "C:\\Program Files\\Tesseract-OCR\\tessdata",
  "C:\\Program Files (x86)\\Tesseract-OCR\\tessdata",
];

const TESSDATA_PATHS_UNIX = [
  process.env.TESSDATA_PREFIX,
  path.join(os.homedir(), "tessdata"),
  "/usr/share/tesseract-ocr/4.00/tessdata",
  "/usr/share/tesseract-ocr/5/tessdata",
  "/usr/local/share/tessdata",
  "/opt/homebrew/share/tessdata",
];

/**
 * Create an OCR error without including raw text.
 */
function createOcrError(
  code: OcrErrorCode,
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
 * Find the Tesseract binary path.
 */
async function findTesseractPath(): Promise<string | null> {
  if (cachedTesseractPath) {
    return cachedTesseractPath;
  }

  const paths = process.platform === "win32"
    ? TESSERACT_PATHS_WINDOWS
    : TESSERACT_PATHS_UNIX;

  for (const tesseractPath of paths) {
    try {
      await execFileAsync(tesseractPath, ["--version"], { timeout: 5000 });
      cachedTesseractPath = tesseractPath;
      return tesseractPath;
    } catch {
      // Try next path
    }
  }

  return null;
}

/**
 * Find the pdftoppm binary path.
 */
async function findPdftoppmPath(): Promise<string | null> {
  if (cachedPdftoppmPath) {
    return cachedPdftoppmPath;
  }

  const paths = process.platform === "win32"
    ? PDFTOPPM_PATHS_WINDOWS
    : PDFTOPPM_PATHS_UNIX;

  for (const pdftoppmPath of paths) {
    try {
      await execFileAsync(pdftoppmPath, ["-v"], { timeout: 5000 });
      cachedPdftoppmPath = pdftoppmPath;
      return pdftoppmPath;
    } catch {
      // Try next path
    }
  }

  return null;
}

/**
 * Find tessdata directory with language files.
 */
async function findTessdataPrefix(): Promise<string | null> {
  if (cachedTessdataPrefix) {
    return cachedTessdataPrefix;
  }

  const paths = process.platform === "win32"
    ? TESSDATA_PATHS_WINDOWS
    : TESSDATA_PATHS_UNIX;

  for (const tessdataPath of paths) {
    if (!tessdataPath) continue;
    try {
      await access(tessdataPath, constants.R_OK);
      cachedTessdataPrefix = tessdataPath;
      return tessdataPath;
    } catch {
      // Try next path
    }
  }

  return null;
}

/**
 * Get environment variables for Tesseract execution.
 *
 * Only overrides TESSDATA_PREFIX if the user has explicitly set it in their
 * environment. Otherwise, Tesseract uses its compiled-in default which
 * includes the configs/ directory needed for output format support (tsv, txt).
 * A bare tessdata directory with only .traineddata files is insufficient.
 */
async function getTesseractEnv(): Promise<NodeJS.ProcessEnv> {
  if (process.env.TESSDATA_PREFIX) {
    return process.env;
  }
  return process.env;
}

/**
 * Check if Tesseract is available on the system.
 */
export async function isTesseractAvailable(): Promise<boolean> {
  const tesseractPath = await findTesseractPath();
  return tesseractPath !== null;
}

/**
 * Check if a specific language is available in Tesseract.
 */
async function isLanguageAvailable(tesseractPath: string, lang: string): Promise<boolean> {
  try {
    const env = await getTesseractEnv();
    const { stdout } = await execFileAsync(tesseractPath, ["--list-langs"], {
      timeout: 5000,
      env,
    });
    const langs = stdout.toLowerCase().split(/\s+/);
    return langs.includes(lang.toLowerCase());
  } catch {
    return false;
  }
}

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
 * Parse Tesseract TSV output to extract confidence metrics.
 *
 * TSV format (tab-separated):
 * level  page_num  block_num  par_num  line_num  word_num  left  top  width  height  conf  text
 *
 * We filter for level=5 (word level) and extract the conf column.
 */
export function parseTsvConfidence(tsvContent: string): OcrConfidence {
  const lines = tsvContent.split("\n").slice(1); // Skip header row
  const confidences: number[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const columns = line.split("\t");
    // level is column 0, conf is column 10, text is column 11
    const level = parseInt(columns[0], 10);
    const conf = parseInt(columns[10], 10);
    const text = columns[11]?.trim();

    // Only consider word-level entries (level 5) with actual text
    if (level === 5 && text && text.length > 0 && !isNaN(conf)) {
      // Tesseract uses -1 for words it couldn't process
      if (conf >= 0) {
        confidences.push(conf);
      }
    }
  }

  if (confidences.length === 0) {
    return {
      mean: 0,
      min: 0,
      lowConfidenceRatio: 1,
      wordCount: 0,
    };
  }

  const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const min = Math.min(...confidences);
  const lowConfCount = confidences.filter(
    (c) => c < OCR_QUALITY_THRESHOLDS.LOW_CONFIDENCE_WORD_THRESHOLD
  ).length;
  const lowConfidenceRatio = lowConfCount / confidences.length;

  return {
    mean: Math.round(mean * 100) / 100, // Round to 2 decimal places
    min,
    lowConfidenceRatio: Math.round(lowConfidenceRatio * 1000) / 1000, // Round to 3 decimal places
    wordCount: confidences.length,
  };
}

/**
 * Aggregate confidence metrics across multiple pages.
 * Uses weighted average based on word count per page.
 */
function aggregateConfidence(pageConfidences: OcrConfidence[]): OcrConfidence {
  if (pageConfidences.length === 0) {
    return {
      mean: 0,
      min: 0,
      lowConfidenceRatio: 1,
      wordCount: 0,
    };
  }

  let totalWords = 0;
  let weightedMeanSum = 0;
  let globalMin = 100;
  let totalLowConfWords = 0;

  for (const conf of pageConfidences) {
    totalWords += conf.wordCount;
    weightedMeanSum += conf.mean * conf.wordCount;
    if (conf.wordCount > 0 && conf.min < globalMin) {
      globalMin = conf.min;
    }
    totalLowConfWords += Math.round(conf.lowConfidenceRatio * conf.wordCount);
  }

  if (totalWords === 0) {
    return {
      mean: 0,
      min: 0,
      lowConfidenceRatio: 1,
      wordCount: 0,
    };
  }

  return {
    mean: Math.round((weightedMeanSum / totalWords) * 100) / 100,
    min: globalMin,
    lowConfidenceRatio: Math.round((totalLowConfWords / totalWords) * 1000) / 1000,
    wordCount: totalWords,
  };
}

/**
 * Apply quality gates to OCR confidence metrics.
 * Returns warnings array and throws error for critical failures.
 */
function applyQualityGates(
  confidence: OcrConfidence,
  options?: OcrQualityGateOptions
): string[] {
  const warnings: string[] = [];

  // If quality gates disabled, return no warnings
  if (options?.disabled) {
    return warnings;
  }

  const criticalThreshold = options?.criticalThreshold ?? OCR_QUALITY_THRESHOLDS.CRITICAL_MEAN;
  const warningThreshold = options?.warningThreshold ?? OCR_QUALITY_THRESHOLDS.WARNING_MEAN;

  // Skip quality gate if too few words (unreliable metric)
  if (confidence.wordCount < OCR_QUALITY_THRESHOLDS.MIN_WORDS_FOR_CONFIDENCE) {
    return warnings;
  }

  // Critical failure - throw error
  if (confidence.mean < criticalThreshold) {
    throw createOcrError(
      "OCR_QUALITY_CRITICAL",
      QUALITY_MESSAGES.OCR_QUALITY_CRITICAL +
        ` (mean confidence: ${confidence.mean.toFixed(1)}%, threshold: ${criticalThreshold}%)`
    );
  }

  // Warning level - add warning but continue
  if (confidence.mean < warningThreshold) {
    warnings.push(
      QUALITY_MESSAGES.OCR_QUALITY_WARNING +
        ` (mean confidence: ${confidence.mean.toFixed(1)}%)`
    );
  }

  // High ratio of low-confidence words
  if (confidence.lowConfidenceRatio > OCR_QUALITY_THRESHOLDS.LOW_CONFIDENCE_RATIO_WARNING) {
    warnings.push(
      `${Math.round(confidence.lowConfidenceRatio * 100)}% of words have low confidence. ` +
        "Some text may be incorrectly recognized."
    );
  }

  return warnings;
}

/**
 * Generate a unique temporary directory name.
 */
function generateTempDirName(): string {
  const randomBytes = crypto.randomBytes(8).toString("hex");
  return path.join(os.tmpdir(), `ocr-${randomBytes}`);
}

/**
 * Convert PDF to images using pdftoppm (from Poppler).
 * Returns paths to the generated image files.
 */
async function convertPdfToImages(
  pdfPath: string,
  outputDir: string,
  dpi: number,
  timeout: number
): Promise<string[]> {
  const pdftoppmPath = await findPdftoppmPath();
  if (!pdftoppmPath) {
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      "pdftoppm not found - required for PDF to image conversion. Install Poppler."
    );
  }

  const outputPrefix = path.join(outputDir, "page");

  const args = [
    "-png",
    "-r", String(dpi),
    "-gray",        // Grayscale improves OCR
    pdfPath,
    outputPrefix,
  ];

  try {
    await execFileAsync(pdftoppmPath, args, {
      timeout,
      encoding: "utf8",
    });
  } catch (err: unknown) {
    const execError = err as { killed?: boolean; signal?: string; message?: string };
    if (execError.killed && execError.signal === "SIGTERM") {
      throw createOcrError(
        "OCR_EXTRACTION_TIMEOUT",
        `PDF to image conversion timed out after ${timeout}ms`
      );
    }
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      "Failed to convert PDF to images for OCR"
    );
  }

  // Find generated image files
  const files = await readdir(outputDir);
  const imageFiles = files
    .filter((f) => f.startsWith("page") && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outputDir, f));

  if (imageFiles.length === 0) {
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      "PDF to image conversion produced no images"
    );
  }

  return imageFiles;
}

/** Result from running Tesseract on a single image */
interface TesseractImageResult {
  text: string;
  confidence: OcrConfidence;
}

/**
 * Run Tesseract OCR on an image file.
 * Outputs both text and TSV to extract confidence metrics.
 */
async function runTesseractOnImage(
  tesseractPath: string,
  imagePath: string,
  languages: string[],
  timeout: number,
  env: NodeJS.ProcessEnv
): Promise<TesseractImageResult> {
  const outputBase = imagePath.replace(/\.[^.]+$/, "");
  const textOutputFile = outputBase + ".txt";
  const tsvOutputFile = outputBase + ".tsv";

  // Run Tesseract with both txt and tsv output formats.
  // Using trailing format args ("txt" "tsv") instead of "-c tessedit_create_tsv=1"
  // because the -c flag only produces TSV without .txt on some Tesseract versions.
  const args = [
    imagePath,
    outputBase,          // Tesseract adds extensions (.txt, .tsv)
    "-l", languages.join("+"),
    "--psm", "6",        // Page segmentation mode 6: uniform block of text
    "txt",               // Produce .txt output
    "tsv",               // Produce .tsv output for confidence metrics
  ];

  // Run Tesseract — separate try-catch from file reads to avoid
  // misattributing readFile ENOENT as binary-not-found
  try {
    await execFileAsync(tesseractPath, args, {
      timeout,
      encoding: "utf8",
      env,
    });
  } catch (err: unknown) {
    const execError = err as { killed?: boolean; signal?: string; code?: string };
    if (execError.killed && execError.signal === "SIGTERM") {
      throw createOcrError(
        "OCR_EXTRACTION_TIMEOUT",
        `Tesseract OCR timed out after ${timeout}ms`
      );
    }
    if (execError.code === "ENOENT") {
      throw createOcrError(
        "OCR_TOOL_MISSING",
        "Tesseract binary not found"
      );
    }
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      "Tesseract OCR failed"
    );
  }

  // Read the text output file
  const text = await readFile(textOutputFile, "utf8");

  // Read and parse TSV for confidence metrics
  let confidence: OcrConfidence;
  try {
    const tsvContent = await readFile(tsvOutputFile, "utf8");
    confidence = parseTsvConfidence(tsvContent);
  } catch {
    // If TSV parsing fails, provide default confidence (unknown)
    confidence = {
      mean: 0,
      min: 0,
      lowConfidenceRatio: 1,
      wordCount: 0,
    };
  }

  return { text, confidence };
}

/**
 * Extract text from a PDF file using Tesseract OCR.
 *
 * Pipeline:
 * 1. Convert PDF pages to images using pdftoppm
 * 2. Run Tesseract on each image
 * 3. Combine results
 *
 * Security notes:
 * - Uses execFile (not exec) to prevent command injection
 * - Temp files are always cleaned up in finally block
 *
 * @param filePath - Absolute path to the PDF file
 * @param options - Optional OCR options
 * @returns Extracted text with deterministic formatting
 */
export async function extractPdfViaOcr(
  filePath: string,
  options?: OcrOptions
): Promise<OcrResult> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const dpi = options?.dpi ?? DEFAULT_DPI;
  const languages = options?.languages ?? DEFAULT_LANGUAGES;

  // Find Tesseract
  const tesseractPath = await findTesseractPath();
  if (!tesseractPath) {
    throw createOcrError(
      "OCR_TOOL_MISSING",
      "Tesseract OCR not found. Install Tesseract: https://github.com/tesseract-ocr/tesseract"
    );
  }

  // Check Hebrew language support
  if (languages.includes("heb")) {
    const hasHebrew = await isLanguageAvailable(tesseractPath, "heb");
    if (!hasHebrew) {
      throw createOcrError(
        "OCR_LANGUAGE_MISSING",
        "Hebrew language data not found. Install tessdata: heb.traineddata"
      );
    }
  }

  // Validate file exists and is accessible
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      `Cannot access file: ${filePath}`
    );
  }

  // Validate it's a file (not directory)
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw createOcrError(
        "OCR_EXTRACTION_FAILED",
        `Path is not a file: ${filePath}`
      );
    }
  } catch (err) {
    if (err instanceof IngestionFailure) throw err;
    throw createOcrError(
      "OCR_EXTRACTION_FAILED",
      `Cannot stat file: ${filePath}`,
      err
    );
  }

  // Create temp directory for images
  const tempDir = generateTempDirName();
  await mkdir(tempDir, { recursive: true });

  // Get Tesseract environment (with TESSDATA_PREFIX)
  const tesseractEnv = await getTesseractEnv();

  try {
    // Allocate time: 40% for PDF conversion, 60% for OCR
    const conversionTimeout = Math.floor(timeout * 0.4);
    const ocrTimeout = Math.floor(timeout * 0.6);

    // Convert PDF to images
    const imageFiles = await convertPdfToImages(filePath, tempDir, dpi, conversionTimeout);

    // Run OCR on each page
    const pageTexts: string[] = [];
    const pageConfidences: OcrConfidence[] = [];
    const timePerPage = Math.floor(ocrTimeout / imageFiles.length);

    for (const imagePath of imageFiles) {
      const result = await runTesseractOnImage(
        tesseractPath,
        imagePath,
        languages,
        timePerPage,
        tesseractEnv
      );
      pageTexts.push(result.text);
      pageConfidences.push(result.confidence);
    }

    // Combine page texts
    const combinedText = pageTexts.join("\n\n--- PAGE BREAK ---\n\n");
    const normalizedText = normalizeText(combinedText);

    if (!normalizedText) {
      throw createOcrError(
        "OCR_EXTRACTION_FAILED",
        "OCR extraction produced empty output"
      );
    }

    // Aggregate confidence across all pages
    const aggregatedConfidence = aggregateConfidence(pageConfidences);

    // Apply quality gates (may throw for critical failures)
    const warnings = applyQualityGates(aggregatedConfidence, options?.qualityGate);

    return {
      text: normalizedText,
      confidence: aggregatedConfidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } finally {
    // Always clean up temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Clear cached tool paths (useful for testing).
 */
export function clearToolPathCache(): void {
  cachedTesseractPath = null;
  cachedPdftoppmPath = null;
  cachedTessdataPrefix = null;
}
