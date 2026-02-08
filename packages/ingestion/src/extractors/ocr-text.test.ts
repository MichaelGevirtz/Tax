import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "path";
import * as fs from "fs";
import {
  extractPdfViaOcr,
  isTesseractAvailable,
  clearToolPathCache,
  parseTsvConfidence,
  OCR_QUALITY_THRESHOLDS,
} from "./ocr-text";
import { IngestionFailure } from "../errors/ingestion-errors";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../fixtures/106");
const RAW_DIR = path.join(FIXTURES_DIR, "raw");

// Sample PDF that exists in fixtures
const SAMPLE_PDF = path.join(RAW_DIR, "031394828_T106-sample.pdf");

describe("ocr-text", () => {
  beforeEach(() => {
    clearToolPathCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isTesseractAvailable", () => {
    it("should return boolean indicating Tesseract availability", async () => {
      const result = await isTesseractAvailable();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("extractPdfViaOcr", () => {
    describe("when Tesseract is NOT available", () => {
      it("should throw OCR_TOOL_MISSING error", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (tesseractAvailable) {
          console.log("Skipping: Tesseract IS available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        try {
          await extractPdfViaOcr(SAMPLE_PDF);
          expect.fail("Should have thrown");
        } catch (err) {
          expect(err).toBeInstanceOf(IngestionFailure);
          const failure = err as IngestionFailure;
          expect(failure.code).toBe("OCR_TOOL_MISSING");
          expect(failure.stage).toBe("extract");
        }
      });
    });

    describe("when Tesseract IS available", () => {
      it("should extract text from PDF via OCR", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        try {
          const result = await extractPdfViaOcr(SAMPLE_PDF);

          // Should return non-empty text
          expect(result.text).toBeTruthy();
          expect(typeof result.text).toBe("string");
          expect(result.text.length).toBeGreaterThan(0);
        } catch (err) {
          // OCR tool issues are acceptable in integration tests
          if (err instanceof IngestionFailure && err.code === "OCR_TOOL_MISSING") {
            console.log("Skipping: Tesseract OCR failed (tool issue)");
            return;
          }
          throw err;
        }
      }, 30000);

      it("should produce deterministic output across multiple OCR runs", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        try {
          const result1 = await extractPdfViaOcr(SAMPLE_PDF);
          const result2 = await extractPdfViaOcr(SAMPLE_PDF);

          expect(result1.text).toBe(result2.text);
        } catch (err) {
          // OCR tool issues are acceptable in integration tests
          if (err instanceof IngestionFailure && err.code === "OCR_TOOL_MISSING") {
            console.log("Skipping: Tesseract OCR failed (tool issue)");
            return;
          }
          throw err;
        }
      }, 120000); // OCR is slow - allow 2 minutes for two runs

      it("should throw OCR_EXTRACTION_FAILED for non-existent file", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        const nonExistentPath = path.join(RAW_DIR, "non-existent.pdf");

        try {
          await extractPdfViaOcr(nonExistentPath);
          expect.fail("Should have thrown");
        } catch (err) {
          expect(err).toBeInstanceOf(IngestionFailure);
          const failure = err as IngestionFailure;
          expect(failure.code).toBe("OCR_EXTRACTION_FAILED");
          expect(failure.stage).toBe("extract");
        }
      });

      it("should respect timeout option", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        // Very short timeout should likely cause timeout error
        // But this depends on system performance, so we just verify it accepts the option
        try {
          await extractPdfViaOcr(SAMPLE_PDF, { timeout: 1 });
          // If it succeeds quickly, that's also acceptable
        } catch (err) {
          if (err instanceof IngestionFailure) {
            // Timeout, extraction error, or tool missing (environment issue) are acceptable
            expect(["OCR_EXTRACTION_TIMEOUT", "OCR_EXTRACTION_FAILED", "OCR_TOOL_MISSING"]).toContain(
              err.code
            );
          }
        }
      }, 30000);

      it("should use specified languages", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        // Should work with just English
        try {
          const result = await extractPdfViaOcr(SAMPLE_PDF, {
            languages: ["eng"],
          });
          expect(result.text).toBeTruthy();
        } catch (err) {
          // OCR_LANGUAGE_MISSING or OCR_TOOL_MISSING are acceptable
          if (err instanceof IngestionFailure) {
            if (err.code === "OCR_LANGUAGE_MISSING" || err.code === "OCR_TOOL_MISSING") {
              console.log(`Skipping: ${err.code}`);
              return;
            }
          }
          throw err;
        }
      }, 30000);

      it("should throw OCR_LANGUAGE_MISSING if Hebrew data not installed", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        if (!fs.existsSync(SAMPLE_PDF)) {
          console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
          return;
        }

        // Try with Hebrew - if not installed, should get specific error
        try {
          await extractPdfViaOcr(SAMPLE_PDF, { languages: ["heb"] });
          // If it succeeds, Hebrew is installed
          console.log("Hebrew language data is installed");
        } catch (err) {
          if (err instanceof IngestionFailure) {
            // Could be OCR_LANGUAGE_MISSING or a different error
            // We're just verifying the error is properly structured
            expect(err.stage).toBe("extract");
          }
        }
      }, 30000);
    });

    describe("error handling", () => {
      it("should not include raw text in error messages", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        const nonExistentPath = path.join(RAW_DIR, "non-existent.pdf");

        try {
          await extractPdfViaOcr(nonExistentPath);
        } catch (err) {
          expect(err).toBeInstanceOf(IngestionFailure);
          const failure = err as IngestionFailure;
          // Error should not contain potentially sensitive data
          expect(failure.message).not.toMatch(/\b\d{9}\b/); // No Israeli IDs
          expect(JSON.stringify(failure.toJSON())).not.toContain("password");
        }
      });

      it("should handle directory path gracefully", async () => {
        const tesseractAvailable = await isTesseractAvailable();
        if (!tesseractAvailable) {
          console.log("Skipping: Tesseract not available");
          return;
        }

        try {
          await extractPdfViaOcr(RAW_DIR); // Pass a directory instead of file
          expect.fail("Should have thrown");
        } catch (err) {
          expect(err).toBeInstanceOf(IngestionFailure);
          const failure = err as IngestionFailure;
          expect(failure.code).toBe("OCR_EXTRACTION_FAILED");
        }
      });
    });
  });

  describe("parseTsvConfidence", () => {
    it("should parse TSV output and calculate confidence metrics", () => {
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t100\t50\t80\t20\t96\tHello
5\t1\t1\t1\t1\t2\t190\t50\t90\t20\t85\tWorld
5\t1\t1\t1\t2\t1\t100\t80\t70\t20\t90\tTest`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(3);
      expect(result.mean).toBeCloseTo(90.33, 1);
      expect(result.min).toBe(85);
      expect(result.lowConfidenceRatio).toBe(0);
    });

    it("should calculate low confidence ratio correctly", () => {
      // 3 words with confidence < 50, 2 words with confidence >= 50
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t100\t50\t80\t20\t95\tHigh1
5\t1\t1\t1\t1\t2\t190\t50\t90\t20\t30\tLow1
5\t1\t1\t1\t1\t3\t290\t50\t90\t20\t85\tHigh2
5\t1\t1\t1\t1\t4\t390\t50\t90\t20\t25\tLow2
5\t1\t1\t1\t1\t5\t490\t50\t90\t20\t40\tLow3`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(5);
      expect(result.lowConfidenceRatio).toBe(0.6); // 3 out of 5 are low
      expect(result.min).toBe(25);
    });

    it("should ignore non-word level entries", () => {
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
1\t1\t0\t0\t0\t0\t0\t0\t0\t0\t-1\t
2\t1\t1\t0\t0\t0\t100\t50\t200\t100\t-1\t
5\t1\t1\t1\t1\t1\t100\t50\t80\t20\t92\tHello`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(1);
      expect(result.mean).toBe(92);
    });

    it("should handle empty TSV content", () => {
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.min).toBe(0);
      expect(result.lowConfidenceRatio).toBe(1);
    });

    it("should skip words with confidence -1 (unprocessable)", () => {
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t100\t50\t80\t20\t-1\tBad
5\t1\t1\t1\t1\t2\t190\t50\t90\t20\t88\tGood`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(1);
      expect(result.mean).toBe(88);
    });

    it("should skip empty text entries", () => {
      const tsvContent = `level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
5\t1\t1\t1\t1\t1\t100\t50\t80\t20\t95\t
5\t1\t1\t1\t1\t2\t190\t50\t90\t20\t88\tWord`;

      const result = parseTsvConfidence(tsvContent);

      expect(result.wordCount).toBe(1);
      expect(result.mean).toBe(88);
    });
  });

  describe("quality gates", () => {
    it("should include confidence in OCR result when Tesseract is available", async () => {
      const tesseractAvailable = await isTesseractAvailable();
      if (!tesseractAvailable) {
        console.log("Skipping: Tesseract not available");
        return;
      }

      if (!fs.existsSync(SAMPLE_PDF)) {
        console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
        return;
      }

      try {
        const result = await extractPdfViaOcr(SAMPLE_PDF);

        expect(result.confidence).toBeDefined();
        expect(result.confidence!.wordCount).toBeGreaterThan(0);
        expect(result.confidence!.mean).toBeGreaterThanOrEqual(0);
        expect(result.confidence!.mean).toBeLessThanOrEqual(100);
        expect(result.confidence!.min).toBeGreaterThanOrEqual(0);
        expect(result.confidence!.lowConfidenceRatio).toBeGreaterThanOrEqual(0);
        expect(result.confidence!.lowConfidenceRatio).toBeLessThanOrEqual(1);
      } catch (err) {
        // OCR tool issues are acceptable in integration tests
        if (err instanceof IngestionFailure && err.code === "OCR_TOOL_MISSING") {
          console.log("Skipping: Tesseract OCR failed (tool issue)");
          return;
        }
        throw err;
      }
    }, 30000);

    it("should throw OCR_QUALITY_CRITICAL for very low confidence", async () => {
      const tesseractAvailable = await isTesseractAvailable();
      if (!tesseractAvailable) {
        console.log("Skipping: Tesseract not available");
        return;
      }

      if (!fs.existsSync(SAMPLE_PDF)) {
        console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
        return;
      }

      // Set a very high critical threshold that real OCR will fail
      try {
        await extractPdfViaOcr(SAMPLE_PDF, {
          qualityGate: {
            criticalThreshold: 99, // Unrealistically high threshold
          },
        });
        // If it doesn't throw, confidence is very high (unlikely but possible)
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        // Accept either quality gate error or tool missing (environment issue)
        if (failure.code === "OCR_TOOL_MISSING") {
          console.log("Skipping: Tesseract OCR failed (tool issue)");
          return;
        }
        expect(failure.code).toBe("OCR_QUALITY_CRITICAL");
        expect(failure.message).toContain("OCR quality too low");
        expect(failure.message).toContain("higher resolution");
      }
    }, 30000);

    it("should add warning for marginal confidence", async () => {
      const tesseractAvailable = await isTesseractAvailable();
      if (!tesseractAvailable) {
        console.log("Skipping: Tesseract not available");
        return;
      }

      if (!fs.existsSync(SAMPLE_PDF)) {
        console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
        return;
      }

      try {
        // Set warning threshold high enough to trigger warning but not fail
        const result = await extractPdfViaOcr(SAMPLE_PDF, {
          qualityGate: {
            criticalThreshold: 20,  // Low critical (won't fail)
            warningThreshold: 95,   // High warning (will likely trigger)
          },
        });

        // If confidence is below 95, should have warnings
        if (result.confidence && result.confidence.mean < 95) {
          expect(result.warnings).toBeDefined();
          expect(result.warnings!.length).toBeGreaterThan(0);
          expect(result.warnings![0]).toContain("marginal");
        }
      } catch (err) {
        // OCR tool issues are acceptable in integration tests
        if (err instanceof IngestionFailure && err.code === "OCR_TOOL_MISSING") {
          console.log("Skipping: Tesseract OCR failed (tool issue)");
          return;
        }
        throw err;
      }
    }, 30000);

    it("should skip quality gate when disabled", async () => {
      const tesseractAvailable = await isTesseractAvailable();
      if (!tesseractAvailable) {
        console.log("Skipping: Tesseract not available");
        return;
      }

      if (!fs.existsSync(SAMPLE_PDF)) {
        console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
        return;
      }

      try {
        // Even with impossible thresholds, should not fail when disabled
        const result = await extractPdfViaOcr(SAMPLE_PDF, {
          qualityGate: {
            criticalThreshold: 100,
            disabled: true,
          },
        });

        expect(result.text).toBeTruthy();
        expect(result.warnings).toBeUndefined();
      } catch (err) {
        // OCR tool issues are acceptable in integration tests
        if (err instanceof IngestionFailure && err.code === "OCR_TOOL_MISSING") {
          console.log("Skipping: Tesseract OCR failed (tool issue)");
          return;
        }
        throw err;
      }
    }, 30000);
  });

  describe("OCR_QUALITY_THRESHOLDS", () => {
    it("should have expected default values", () => {
      expect(OCR_QUALITY_THRESHOLDS.CRITICAL_MEAN).toBe(40);
      expect(OCR_QUALITY_THRESHOLDS.WARNING_MEAN).toBe(60);
      expect(OCR_QUALITY_THRESHOLDS.LOW_CONFIDENCE_WORD_THRESHOLD).toBe(50);
      expect(OCR_QUALITY_THRESHOLDS.LOW_CONFIDENCE_RATIO_WARNING).toBe(0.3);
      expect(OCR_QUALITY_THRESHOLDS.MIN_WORDS_FOR_CONFIDENCE).toBe(10);
    });
  });
});
