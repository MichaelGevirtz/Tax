import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { isTesseractAvailable } from "../../src/extractors/ocr-text";
import { generate135FromForm106, PIPELINE_VERSION } from "../../src/pipelines/generate-135";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const FIXTURES_DIR = path.resolve(__dirname, "../../../../fixtures/106");
const RAW_DIR = path.join(FIXTURES_DIR, "raw");
const SAMPLE_PDF = path.join(RAW_DIR, "031394828_T106-sample.pdf");
const FONT_PATH = path.join(PROJECT_ROOT, "assets/fonts/NotoSansHebrew-Regular.ttf");
const TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  "docs/product/135/Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
);

/** Fixed timestamp for deterministic output */
const FIXED_GENERATED_AT = "2025-01-15T12:00:00.000Z";

function canRun(): { ok: boolean; reason?: string } {
  if (!fs.existsSync(SAMPLE_PDF)) {
    return { ok: false, reason: `Sample PDF not found: ${SAMPLE_PDF}` };
  }
  if (!fs.existsSync(FONT_PATH)) {
    return { ok: false, reason: `Font not found: ${FONT_PATH}` };
  }
  if (!fs.existsSync(TEMPLATE_PATH)) {
    return { ok: false, reason: `Form 135 template not found: ${TEMPLATE_PATH}` };
  }
  return { ok: true };
}

describe("generate-135 golden tests (full pipeline: Form 106 → Form 135)", () => {
  let tesseractAvailable = false;
  let prereqsMet = false;
  let prereqReason = "";

  beforeAll(async () => {
    tesseractAvailable = await isTesseractAvailable();
    const check = canRun();
    prereqsMet = check.ok;
    prereqReason = check.reason ?? "";
  });

  function skipIfNotReady(): boolean {
    if (!tesseractAvailable) {
      console.log("Skipping: Tesseract not available");
      return true;
    }
    if (!prereqsMet) {
      console.log(`Skipping: ${prereqReason}`);
      return true;
    }
    return false;
  }

  it("should produce a valid Form 135 PDF from the sample Form 106", async () => {
    if (skipIfNotReady()) return;

    const result = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Valid PDF: starts with %PDF header
    expect(result.pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    // Buffer is non-trivial size (template + overlay data)
    expect(result.pdfBuffer.length).toBeGreaterThan(10_000);

    // Pipeline version is present
    expect(result.pipelineVersion).toBe(PIPELINE_VERSION);
  }, 120_000);

  it("should map the correct Form 106 values into Form 135 data", async () => {
    if (skipIfNotReady()) return;

    const result = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Known values from sample PDF 031394828_T106-sample.pdf
    expect(result.form135Data.employeeId).toBe("031394828");
    expect(result.form135Data.employerId).toBe("921513545");
    expect(result.form135Data.taxYear).toBe(2024);
    expect(result.form135Data.box158_grossIncome).toBe(622809);
    expect(result.form135Data.box042_taxDeducted).toBe(167596);
  }, 120_000);

  it("should include correct generation metadata", async () => {
    if (skipIfNotReady()) return;

    const result = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.meta.generatedAt).toBe(FIXED_GENERATED_AT);
    expect(result.meta.templateYear).toBe(2024);
    expect(result.meta.generatorVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.meta.sourceForm106ParserVersion).toMatch(/^\d+\.\d+\.\d+$/);
  }, 120_000);

  it("should produce deterministic (byte-identical) output across two runs", async () => {
    if (skipIfNotReady()) return;

    const result1 = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
    });

    const result2 = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (!result1.success || !result2.success) return;

    // Byte-identical output (determinism)
    expect(Buffer.compare(result1.pdfBuffer, result2.pdfBuffer)).toBe(0);
    expect(result1.meta).toEqual(result2.meta);
    expect(result1.pipelineVersion).toBe(result2.pipelineVersion);
  }, 240_000);

  it("should write output file when outputPath is specified", async () => {
    if (skipIfNotReady()) return;

    const outputPath = path.join(
      PROJECT_ROOT,
      "fixtures/135/generated/031394828_T135-golden.pdf",
    );

    // Clean up any previous run
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const result = await generate135FromForm106(SAMPLE_PDF, {
      projectRoot: PROJECT_ROOT,
      generatedAt: FIXED_GENERATED_AT,
      outputPath,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // File was written
    expect(fs.existsSync(outputPath)).toBe(true);

    // File content matches buffer
    const fileBytes = fs.readFileSync(outputPath);
    expect(Buffer.compare(fileBytes, result.pdfBuffer)).toBe(0);

    // Clean up
    fs.unlinkSync(outputPath);
    // Remove generated dir if empty
    const dir = path.dirname(outputPath);
    try {
      fs.rmdirSync(dir);
    } catch {
      // Not empty, that's fine
    }
  }, 120_000);
});
