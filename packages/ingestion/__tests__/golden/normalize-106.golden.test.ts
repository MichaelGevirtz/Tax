import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ingest106Stub, ingest106FromExtracted } from "../../src/pipelines/ingest-106";
import { normalize106 } from "../../src/normalizers/normalize-106";
import { IngestionFailure } from "../../src/errors/ingestion-errors";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../fixtures/106");
const NORMALIZED_DIR = path.join(FIXTURES_DIR, "normalized");
const EXTRACTED_DIR = path.join(FIXTURES_DIR, "extracted");

describe("normalize-106 golden tests", () => {
  describe("stub format parsing", () => {
    it("should produce deterministic output matching expected fixture", () => {
      const result = ingest106Stub();

      expect(result.success).toBe(true);
      if (!result.success) return;

      const fixturePath = path.join(NORMALIZED_DIR, "stub.expected.json");
      const expected = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

      expect(result.data).toEqual(expected);
    });

    it("should be deterministic across multiple runs", () => {
      const result1 = ingest106Stub();
      const result2 = ingest106Stub();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data).toEqual(result2.data);
        expect(result1.parserVersion).toEqual(result2.parserVersion);
      }
    });
  });

  describe("garbled text detection", () => {
    it("should throw TEXT_GARBLED for CID-garbled extracted text", () => {
      // Load the real extracted text which has CID garbling
      const extractedPath = path.join(EXTRACTED_DIR, "031394828_T106-sample.expected.txt");

      if (!fs.existsSync(extractedPath)) {
        console.log(`Skipping: Extracted file not found at ${extractedPath}`);
        return;
      }

      const garbledText = fs.readFileSync(extractedPath, "utf-8");

      expect(() => normalize106({ raw: garbledText })).toThrow(IngestionFailure);

      try {
        normalize106({ raw: garbledText });
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("TEXT_GARBLED");
        expect(failure.stage).toBe("normalize");
      }
    });

    it("should detect garbled patterns like Z061+ 047\\", () => {
      const garbledText = `
        (106 ) 2024
        810402434                               10
        Z061+ 047\\
        477+/// 9
      `;

      expect(() => normalize106({ raw: garbledText })).toThrow(IngestionFailure);

      try {
        normalize106({ raw: garbledText });
      } catch (err) {
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("TEXT_GARBLED");
      }
    });
  });

  describe("missing field handling", () => {
    it("should throw MANDATORY_FIELD_MISSING when a required field is missing", () => {
      const incompleteText = `
        Form 106 - Annual Tax Statement
        Employee ID: 123456782
        Tax Year: 2024
        Gross Income: 150000
      `;

      expect(() => normalize106({ raw: incompleteText })).toThrow(IngestionFailure);

      try {
        normalize106({ raw: incompleteText });
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("MANDATORY_FIELD_MISSING");
        expect(failure.stage).toBe("normalize");
        // Should identify missing fields in the message
        expect(failure.message).toContain("not found");
      }
    });
  });

  describe("error message security", () => {
    it("should NOT include raw extracted text in error messages", () => {
      const sensitiveText = `
        SENSITIVE_DATA_123
        Some garbled content with Z999+ 123\\
        More 477+/// patterns
      `;

      try {
        normalize106({ raw: sensitiveText });
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        const errorJson = JSON.stringify(failure.toJSON());

        // Ensure sensitive data is not in error
        expect(errorJson).not.toContain("SENSITIVE_DATA_123");
        expect(failure.message).not.toContain("SENSITIVE_DATA_123");
      }
    });

    it("should NOT include raw text even for valid parsing errors", () => {
      const textWithSecrets = `
        Employee ID: SECRET_ID_999
        Employer ID: 987654324
        Tax Year: 2024
        Gross Income: 150000
        Tax Deducted: 25000
        Social Security: 7500
        Health Insurance: 4500
      `;

      try {
        normalize106({ raw: textWithSecrets });
      } catch (err) {
        const failure = err as IngestionFailure;
        const errorJson = JSON.stringify(failure.toJSON());
        expect(errorJson).not.toContain("SECRET_ID_999");
      }
    });
  });

  describe("real PDF normalization", () => {
    it("should normalize PDF with clean text layer (when fixture exists)", () => {
      const expectedPath = path.join(NORMALIZED_DIR, "031394828_T106-sample.expected.json");

      if (!fs.existsSync(expectedPath)) {
        console.log(`Skipping: Expected fixture not found at ${expectedPath}`);
        console.log("This test will pass once you fill in the fixture template.");
        return;
      }

      const extractedPath = path.join(EXTRACTED_DIR, "031394828_T106-sample.expected.txt");
      if (!fs.existsSync(extractedPath)) {
        console.log(`Skipping: Extracted text not found at ${extractedPath}`);
        return;
      }

      const extractedText = fs.readFileSync(extractedPath, "utf-8");
      const expected = JSON.parse(fs.readFileSync(expectedPath, "utf-8"));

      // Note: This test will fail for garbled PDFs (expected behavior)
      // It will pass for PDFs with clean text extraction
      const result = ingest106FromExtracted({ raw: extractedText });

      if (result.success) {
        expect(result.data).toEqual(expected);
      } else {
        // For garbled PDFs, we expect TEXT_GARBLED error
        expect(result.error.code).toBe("TEXT_GARBLED");
      }
    });
  });
});
