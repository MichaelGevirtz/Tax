import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Document, Extraction, ParsingFailure } from "@prisma/client";
import { ingest106AndPersist } from "./ingest106-and-persist";

// ── Mocks ──

const mockCreateDocument = vi.fn();
const mockCreateExtraction = vi.fn();
const mockCreateParsingFailure = vi.fn();
const mockUpdateDocumentStatus = vi.fn();
const mockSetDocumentTaxYear = vi.fn();

vi.mock("@tax/adapters", () => ({
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  createExtraction: (...args: unknown[]) => mockCreateExtraction(...args),
  createParsingFailure: (...args: unknown[]) => mockCreateParsingFailure(...args),
  updateDocumentStatus: (...args: unknown[]) => mockUpdateDocumentStatus(...args),
  setDocumentTaxYear: (...args: unknown[]) => mockSetDocumentTaxYear(...args),
}));

const mockIngest106FromPdf = vi.fn();

vi.mock("@tax/ingestion", () => ({
  ingest106FromPdf: (...args: unknown[]) => mockIngest106FromPdf(...args),
  PARSER_VERSION: "1.0.0",
}));

const mockEstimateRefund = vi.fn();

vi.mock("@tax/core", () => ({
  estimateRefund: (...args: unknown[]) => mockEstimateRefund(...args),
}));

// ── Fixtures ──

const SAMPLE_EXTRACTED = {
  employeeId: "031394828",
  employerId: "921513545",
  taxYear: 2024,
  grossIncome: 622809,
  taxDeducted: 167596,
  socialSecurityDeducted: 25220,
  healthInsuranceDeducted: 27708,
};

const FAKE_DOC: Document = {
  id: "doc-abc-123",
  userId: null,
  type: "FORM_106",
  status: "UPLOADED",
  taxYear: null,
  originalFileName: "test.pdf",
  storageKey: "temp://test.pdf",
  uploadedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ──

describe("ingest106AndPersist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateDocument.mockResolvedValue(FAKE_DOC);
    mockUpdateDocumentStatus.mockResolvedValue(FAKE_DOC);
    mockSetDocumentTaxYear.mockResolvedValue(FAKE_DOC);
    mockCreateExtraction.mockResolvedValue({} as Extraction);
    mockCreateParsingFailure.mockResolvedValue({} as ParsingFailure);
  });

  describe("success path", () => {
    it("should return extracted data and create Document + Extraction", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: true,
        data: SAMPLE_EXTRACTED,
        parserVersion: "1.0.0",
        extractionMethod: "ocr_tesseract",
      });
      mockEstimateRefund.mockReturnValue({
        confidenceTier: "HIGH",
        estimateVersion: "estimator_v1_2024",
        estimatedRefund: 50000,
      });

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test-106.pdf",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Response shape
      expect(result.data).toEqual(SAMPLE_EXTRACTED);
      expect(result.extractionMethod).toBe("ocr_tesseract");
      expect(result.parserVersion).toBe("1.0.0");
      expect(result.documentId).toBe("doc-abc-123");

      // Estimate included
      expect(result.estimate).toEqual({
        confidenceTier: "HIGH",
        estimateVersion: "estimator_v1_2024",
      });

      // DB calls
      expect(mockCreateDocument).toHaveBeenCalledOnce();
      expect(mockCreateExtraction).toHaveBeenCalledOnce();
      expect(mockUpdateDocumentStatus).toHaveBeenCalledWith("doc-abc-123", "PROCESSED");
      expect(mockSetDocumentTaxYear).toHaveBeenCalledWith("doc-abc-123", 2024);
    });

    it("should pass wizardState to estimator", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: true,
        data: SAMPLE_EXTRACTED,
        parserVersion: "1.0.0",
        extractionMethod: "pdftotext",
      });
      mockEstimateRefund.mockReturnValue(null);

      const wizardState = { personalCredits: ["סיום תואר / לימודים אקדמיים"] };

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test-106.pdf",
        wizardState: wizardState as Parameters<typeof ingest106AndPersist>[0]["wizardState"],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.estimate).toBeNull();
      expect(mockEstimateRefund).toHaveBeenCalledWith({
        extracted106: SAMPLE_EXTRACTED,
        wizardState,
      });
    });
  });

  describe("pipeline failure path", () => {
    it("should return error and create Document + ParsingFailure", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: false,
        error: {
          stage: "extract",
          parserVersion: "1.0.0",
          message: "PDF appears to be image-only",
          code: "PDF_IMAGE_ONLY",
        },
      });

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test.pdf",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("PARSE_FAILED");
      expect(result.error.message).toContain("לא הצלחנו לקרוא");
      expect(result.error.stage).toBe("extract");

      // DB calls
      expect(mockCreateDocument).toHaveBeenCalledOnce();
      expect(mockCreateParsingFailure).toHaveBeenCalledOnce();
      expect(mockUpdateDocumentStatus).toHaveBeenCalledWith("doc-abc-123", "FAILED");
      expect(mockEstimateRefund).not.toHaveBeenCalled();
    });

    it("should map MANDATORY_FIELD_MISSING to NOT_FORM_106", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: false,
        error: {
          stage: "normalize",
          parserVersion: "1.0.0",
          message: "Required field missing: employeeId",
          code: "MANDATORY_FIELD_MISSING",
        },
      });

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test.pdf",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FORM_106");
      expect(result.error.message).toContain("לא נראה כטופס 106");
    });

    it("should map OCR_QUALITY_CRITICAL to OCR_QUALITY_LOW", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: false,
        error: {
          stage: "extract",
          parserVersion: "1.0.0",
          message: "OCR confidence below threshold",
          code: "OCR_QUALITY_CRITICAL",
        },
      });

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test.pdf",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("OCR_QUALITY_LOW");
    });
  });

  describe("unexpected error path", () => {
    it("should return INTERNAL_ERROR and update document status to FAILED", async () => {
      mockIngest106FromPdf.mockRejectedValue(new Error("Unexpected crash"));

      const result = await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "test.pdf",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("INTERNAL_ERROR");
      expect(result.error.message).toContain("שגיאה פנימית");

      expect(mockUpdateDocumentStatus).toHaveBeenCalledWith("doc-abc-123", "FAILED");
    });
  });

  describe("document creation", () => {
    it("should create document with no userId (anonymous upload)", async () => {
      mockIngest106FromPdf.mockResolvedValue({
        success: true,
        data: SAMPLE_EXTRACTED,
        parserVersion: "1.0.0",
        extractionMethod: "pdftotext",
      });
      mockEstimateRefund.mockReturnValue(null);

      await ingest106AndPersist({
        file: Buffer.from("fake-pdf"),
        fileName: "my-form-106.pdf",
      });

      expect(mockCreateDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "FORM_106",
          status: "UPLOADED",
          originalFileName: "my-form-106.pdf",
        })
      );

      // Verify no userId in the create call
      const createCall = mockCreateDocument.mock.calls[0][0];
      expect(createCall.user).toBeUndefined();
      expect(createCall.userId).toBeUndefined();
    });
  });
});
