import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { PDFDocument } from "pdf-lib";
import { generateForm135Pdf, GENERATOR_VERSION } from "./form135-pdf.generator";
import { formatMoney, formatIsraeliId } from "../templates/form135-coordinates";
import type { Form135Data } from "@tax/domain";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

const SAMPLE_DATA: Form135Data = {
  employeeId: "031394828",
  taxYear: 2024,
  employerId: "921513545",
  box158_grossIncome: 622809,
  box042_taxDeducted: 167596,
};

const META = {
  sourceParserVersion: "1.0.0",
  generatedAt: "2025-01-15T10:00:00.000Z",
};

const TEMPLATE_PATH = path.resolve(
  PROJECT_ROOT,
  "docs/product/135/Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
);
const FONT_PATH = path.resolve(
  PROJECT_ROOT,
  "assets/fonts/NotoSansHebrew-Regular.ttf",
);

function hasRequiredFiles(): boolean {
  return fs.existsSync(TEMPLATE_PATH) && fs.existsSync(FONT_PATH);
}

describe("generateForm135Pdf", () => {
  it("should generate a valid PDF buffer", async () => {
    if (!hasRequiredFiles()) return;

    const result = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.pdfBuffer.length).toBeGreaterThan(0);
    expect(result.pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");

    const pdfDoc = await PDFDocument.load(result.pdfBuffer);
    expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it("should include correct generation metadata", async () => {
    if (!hasRequiredFiles()) return;

    const result = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.meta.generatorVersion).toBe(GENERATOR_VERSION);
    expect(result.meta.sourceForm106ParserVersion).toBe("1.0.0");
    expect(result.meta.templateYear).toBe(2024);
    expect(result.meta.generatedAt).toBe("2025-01-15T10:00:00.000Z");
  });

  it("should produce deterministic output for same inputs", async () => {
    if (!hasRequiredFiles()) return;

    const result1 = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
    });
    const result2 = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (!result1.success || !result2.success) return;

    expect(result1.pdfBuffer.equals(result2.pdfBuffer)).toBe(true);
  });

  it("should fail with INVALID_DATA for bad employee ID", async () => {
    if (!hasRequiredFiles()) return;

    const badData = { ...SAMPLE_DATA, employeeId: "invalid" };
    const result = await generateForm135Pdf(badData as Form135Data, META, {
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INVALID_DATA");
  });

  it("should fail with UNSUPPORTED_YEAR for unknown tax year", async () => {
    if (!hasRequiredFiles()) return;

    const badData = { ...SAMPLE_DATA, taxYear: 2015 };
    const result = await generateForm135Pdf(badData as Form135Data, META, {
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("UNSUPPORTED_YEAR");
  });

  it("should fail with TEMPLATE_NOT_FOUND for missing template", async () => {
    const result = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
      templatePath: "/nonexistent/template.pdf",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("TEMPLATE_NOT_FOUND");
  });

  it("should fail with FONT_NOT_FOUND for missing font", async () => {
    const result = await generateForm135Pdf(SAMPLE_DATA, META, {
      projectRoot: PROJECT_ROOT,
      fontPath: "/nonexistent/font.ttf",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("FONT_NOT_FOUND");
  });
});

describe("formatMoney", () => {
  it("should format with thousands separators", () => {
    expect(formatMoney(622809)).toBe("622,809");
    expect(formatMoney(0)).toBe("0");
    expect(formatMoney(1000000)).toBe("1,000,000");
    expect(formatMoney(999)).toBe("999");
    expect(formatMoney(1000)).toBe("1,000");
  });

  it("should round fractional amounts", () => {
    expect(formatMoney(622809.7)).toBe("622,810");
    expect(formatMoney(100.4)).toBe("100");
  });
});

describe("formatIsraeliId", () => {
  it("should pad to 9 digits", () => {
    expect(formatIsraeliId("31394828")).toBe("031394828");
    expect(formatIsraeliId("031394828")).toBe("031394828");
    expect(formatIsraeliId("1234")).toBe("000001234");
  });
});
