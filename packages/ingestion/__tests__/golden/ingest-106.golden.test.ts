import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ingest106FromPdf } from "../../src/pipelines/ingest-106";
import { isTesseractAvailable } from "../../src/extractors/ocr-text";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../fixtures/106");
const RAW_DIR = path.join(FIXTURES_DIR, "raw");
const NORMALIZED_DIR = path.join(FIXTURES_DIR, "normalized");

const SAMPLE_PDF = path.join(RAW_DIR, "031394828_T106-sample.pdf");
const EXPECTED_JSON = path.join(NORMALIZED_DIR, "031394828_T106-sample.expected.json");

describe("ingest-106 golden tests (full pipeline)", () => {
  let tesseractAvailable = false;

  beforeAll(async () => {
    tesseractAvailable = await isTesseractAvailable();
  });

  it("should extract all 7 fields matching expected JSON", async () => {
    if (!tesseractAvailable) {
      console.log("Skipping: Tesseract not available");
      return;
    }

    if (!fs.existsSync(SAMPLE_PDF)) {
      console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
      return;
    }

    if (!fs.existsSync(EXPECTED_JSON)) {
      console.log(`Skipping: Expected JSON not found at ${EXPECTED_JSON}`);
      return;
    }

    const expected = JSON.parse(fs.readFileSync(EXPECTED_JSON, "utf-8"));
    // Strip comment fields
    const { _comment, _source, _verify, ...expectedData } = expected;

    const result = await ingest106FromPdf(SAMPLE_PDF, {
      enableOcrFallback: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.extractionMethod).toBe("ocr_tesseract");
    expect(result.data).toEqual(expectedData);
  }, 60000);

  it("should produce deterministic output across two runs", async () => {
    if (!tesseractAvailable) {
      console.log("Skipping: Tesseract not available");
      return;
    }

    if (!fs.existsSync(SAMPLE_PDF)) {
      console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
      return;
    }

    const result1 = await ingest106FromPdf(SAMPLE_PDF, {
      enableOcrFallback: true,
    });
    const result2 = await ingest106FromPdf(SAMPLE_PDF, {
      enableOcrFallback: true,
    });

    expect(result1.success).toBe(result2.success);

    if (result1.success && result2.success) {
      expect(result1.data).toEqual(result2.data);
      expect(result1.parserVersion).toBe(result2.parserVersion);
      expect(result1.extractionMethod).toBe(result2.extractionMethod);
    }
  }, 120000);

  it("should fail gracefully without OCR fallback (garbled PDF)", async () => {
    if (!fs.existsSync(SAMPLE_PDF)) {
      console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
      return;
    }

    // Without OCR fallback, garbled PDF should fail with TEXT_GARBLED
    const result = await ingest106FromPdf(SAMPLE_PDF, {
      enableOcrFallback: false,
    });

    if (result.success) {
      // If pdftotext happens to work, that's OK too
      expect(result.extractionMethod).toBe("pdftotext");
    } else {
      expect(result.error.code).toBe("TEXT_GARBLED");
    }
  });
});
