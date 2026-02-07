import { describe, it, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as crypto from "crypto";
import {
  validatePdfSecurity,
  validateMagicBytes,
  scanForDangerousObjects,
  MAX_PDF_SIZE_BYTES,
} from "./pdf-validator";
import { IngestionFailure } from "../errors/ingestion-errors";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../fixtures/106");
const RAW_DIR = path.join(FIXTURES_DIR, "raw");
const SAMPLE_PDF = path.join(RAW_DIR, "031394828_T106-sample.pdf");

/** Create a temp file with given content, return path. Caller must clean up. */
function createTempFile(content: Buffer, extension: string = ".pdf"): string {
  const name = `test-${crypto.randomBytes(8).toString("hex")}${extension}`;
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/** Build a minimal valid PDF with optional injected content. */
function buildPdf(extraContent: string = ""): Buffer {
  const body = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
${extraContent}
xref
0 4
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF`;
  return Buffer.from(body, "utf-8");
}

describe("pdf-validator", () => {
  describe("validateMagicBytes", () => {
    it("should accept valid PDF header", () => {
      const header = Buffer.from("%PDF-1.4\n", "ascii");
      expect(validateMagicBytes(header)).toBe(true);
    });

    it("should accept PDF header with leading whitespace/BOM", () => {
      const header = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]), // UTF-8 BOM
        Buffer.from("%PDF-1.7", "ascii"),
      ]);
      expect(validateMagicBytes(header)).toBe(true);
    });

    it("should reject JPEG file", () => {
      const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateMagicBytes(header)).toBe(false);
    });

    it("should reject PNG file", () => {
      const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(validateMagicBytes(header)).toBe(false);
    });

    it("should reject EXE file (MZ header)", () => {
      const header = Buffer.from("MZ\x90\x00\x03\x00", "ascii");
      expect(validateMagicBytes(header)).toBe(false);
    });

    it("should reject empty buffer", () => {
      expect(validateMagicBytes(Buffer.alloc(0))).toBe(false);
    });

    it("should reject plain text", () => {
      const header = Buffer.from("Hello World, this is not a PDF", "ascii");
      expect(validateMagicBytes(header)).toBe(false);
    });
  });

  describe("scanForDangerousObjects", () => {
    it("should detect /JS object", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /Type /Action /S /JavaScript /JS (alert(1)) >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/JS")).toBe(true);
      expect(threats.some(t => t.pattern === "/JavaScript")).toBe(true);
    });

    it("should detect /Launch action", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /Type /Action /S /Launch /F (cmd.exe) >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/Launch")).toBe(true);
    });

    it("should detect /OpenAction", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /Type /Catalog /OpenAction 5 0 R >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/OpenAction")).toBe(true);
    });

    it("should detect /AA (Additional Actions)", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /AA << /O 5 0 R >> >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/AA")).toBe(true);
    });

    it("should detect /EmbeddedFile", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /Type /EmbeddedFile /Subtype /application#2Fpdf >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/EmbeddedFile")).toBe(true);
    });

    it("should detect /RichMedia", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /Type /RichMedia >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/RichMedia")).toBe(true);
    });

    it("should detect /XFA", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /XFA 5 0 R >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.some(t => t.pattern === "/XFA")).toBe(true);
    });

    it("should detect multiple threats", () => {
      const content = Buffer.from(buildPdf(
        "4 0 obj\n<< /S /JavaScript /JS (x) /OpenAction 5 0 R /EmbeddedFile >>\nendobj"
      ));
      const threats = scanForDangerousObjects(content);
      expect(threats.length).toBeGreaterThanOrEqual(3);
    });

    it("should return empty array for clean PDF", () => {
      const content = buildPdf();
      const threats = scanForDangerousObjects(content);
      expect(threats).toEqual([]);
    });
  });

  describe("validatePdfSecurity", () => {
    it("should pass for real Form 106 sample PDF", async () => {
      if (!fs.existsSync(SAMPLE_PDF)) {
        console.log(`Skipping: Sample PDF not found at ${SAMPLE_PDF}`);
        return;
      }

      // Should not throw
      await validatePdfSecurity(SAMPLE_PDF);
    });

    it("should reject non-existent file", async () => {
      const fakePath = path.join(os.tmpdir(), "non-existent-file.pdf");

      try {
        await validatePdfSecurity(fakePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_INVALID_FORMAT");
      }
    });

    it("should reject empty file", async () => {
      const filePath = createTempFile(Buffer.alloc(0));
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_INVALID_FORMAT");
        expect(failure.message).toContain("empty");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject non-PDF file (JPEG)", async () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const filePath = createTempFile(jpegHeader, ".pdf");
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_INVALID_FORMAT");
        expect(failure.message).toContain("%PDF-");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject file exceeding size limit", async () => {
      const filePath = createTempFile(buildPdf());
      try {
        // Use a tiny size limit to trigger the check
        await validatePdfSecurity(filePath, 10);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_TOO_LARGE");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject PDF with embedded JavaScript", async () => {
      const maliciousPdf = buildPdf(
        "4 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert('pwned')) >>\nendobj"
      );
      const filePath = createTempFile(maliciousPdf);
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_SECURITY_RISK");
        expect(failure.message).toContain("JavaScript");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject PDF with /Launch action", async () => {
      const maliciousPdf = buildPdf(
        "4 0 obj\n<< /Type /Action /S /Launch /F (cmd.exe) /P (/c calc) >>\nendobj"
      );
      const filePath = createTempFile(maliciousPdf);
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_SECURITY_RISK");
        expect(failure.message).toContain("Launch");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject PDF with /OpenAction", async () => {
      const maliciousPdf = buildPdf(
        "4 0 obj\n<< /Type /Catalog /OpenAction << /S /URI /URI (http://evil.com) >> >>\nendobj"
      );
      const filePath = createTempFile(maliciousPdf);
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_SECURITY_RISK");
        expect(failure.message).toContain("Auto-open");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should reject PDF with embedded files", async () => {
      const maliciousPdf = buildPdf(
        "4 0 obj\n<< /Type /EmbeddedFile /Subtype /application#2Foctet-stream >>\nendobj"
      );
      const filePath = createTempFile(maliciousPdf);
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        expect(failure.code).toBe("PDF_SECURITY_RISK");
        expect(failure.message).toContain("Embedded");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should accept clean minimal PDF", async () => {
      const cleanPdf = buildPdf();
      const filePath = createTempFile(cleanPdf);
      try {
        // Should not throw
        await validatePdfSecurity(filePath);
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should not leak sensitive file paths in error messages", async () => {
      const jpegData = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const filePath = createTempFile(jpegData);
      try {
        await validatePdfSecurity(filePath);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IngestionFailure);
        const failure = err as IngestionFailure;
        // Error should not contain the full temp file path
        expect(failure.message).not.toContain(os.tmpdir());
      } finally {
        fs.unlinkSync(filePath);
      }
    });
  });
});
