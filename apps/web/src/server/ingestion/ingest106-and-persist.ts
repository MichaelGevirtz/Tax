import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as crypto from "node:crypto";

import {
  createDocument,
  createExtraction,
  createParsingFailure,
  updateDocumentStatus,
  setDocumentTaxYear,
} from "@tax/adapters";
import {
  ingest106FromPdf,
  PARSER_VERSION,
  type IngestionResult,
} from "@tax/ingestion";
import { estimateRefund, type ConfidenceTier, type WizardCreditsInput } from "@tax/core";
import { redact } from "../../../../../packages/utils/src/redaction";

// ── Types ──

type Extracted106 = IngestionResult["data"];
type ExtractionMethod = IngestionResult["extractionMethod"];

type FailureStage = "EXTRACTION" | "NORMALIZATION" | "VALIDATION";

export type ApiErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "PARSE_FAILED"
  | "NOT_FORM_106"
  | "OCR_QUALITY_LOW"
  | "INTERNAL_ERROR";

export interface Ingest106Input {
  file: Buffer;
  fileName: string;
  wizardState?: WizardCreditsInput;
}

export interface Ingest106Success {
  success: true;
  data: Extracted106;
  extractionMethod: ExtractionMethod;
  parserVersion: string;
  estimate: { confidenceTier: ConfidenceTier; estimateVersion: string } | null;
  documentId: string;
}

export interface Ingest106Error {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    stage?: string;
  };
}

export type Ingest106Result = Ingest106Success | Ingest106Error;

// ── Hebrew error messages ──

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_FILE_TYPE: "יש להעלות קובץ PDF בלבד",
  FILE_TOO_LARGE: "הקובץ גדול מדי. הגודל המרבי הוא 10MB",
  PARSE_FAILED: "לא הצלחנו לקרוא את הקובץ. נסו לסרוק מחדש באיכות גבוהה יותר",
  NOT_FORM_106: "הקובץ לא נראה כטופס 106. ודאו שהעלתם את הטופס הנכון",
  OCR_QUALITY_LOW: "איכות הסריקה נמוכה מדי. נסו לסרוק מחדש באיכות גבוהה יותר",
  INTERNAL_ERROR: "שגיאה פנימית. נסו שנית מאוחר יותר",
};

// ── Pipeline error → API error mapping ──

function mapPipelineErrorCode(code: string | undefined): ApiErrorCode {
  switch (code) {
    case "PDF_INVALID_FORMAT":
      return "INVALID_FILE_TYPE";
    case "PDF_TOO_LARGE":
      return "FILE_TOO_LARGE";
    case "PDF_SECURITY_RISK":
    case "PDF_PASSWORD_REQUIRED":
    case "PDF_EXTRACTION_FAILED":
    case "PDF_EXTRACTION_TIMEOUT":
    case "TEXT_GARBLED":
    case "PDF_IMAGE_ONLY":
      return "PARSE_FAILED";
    case "MANDATORY_FIELD_MISSING":
    case "FIELD_NOT_FOUND":
      return "NOT_FORM_106";
    case "OCR_QUALITY_CRITICAL":
      return "OCR_QUALITY_LOW";
    default:
      return "INTERNAL_ERROR";
  }
}

function mapIngestionStageToFailureStage(stage: string): FailureStage {
  switch (stage) {
    case "extract":
      return "EXTRACTION";
    case "normalize":
      return "NORMALIZATION";
    case "validate":
      return "VALIDATION";
    default:
      return "EXTRACTION";
  }
}

// ── Main function ──

export async function ingest106AndPersist(
  input: Ingest106Input
): Promise<Ingest106Result> {
  // Write buffer to temp file
  const tempFileName = `ingest-${crypto.randomUUID()}.pdf`;
  const tempPath = path.join(os.tmpdir(), tempFileName);

  let documentId: string | undefined;

  try {
    await fs.promises.writeFile(tempPath, input.file);

    // Create Document record (anonymous — no userId)
    const doc = await createDocument({
      type: "FORM_106",
      status: "UPLOADED",
      storageKey: `temp://${tempFileName}`,
      originalFileName: input.fileName,
    });
    documentId = doc.id;

    // Run the real ingestion pipeline
    const result = await ingest106FromPdf(tempPath, {
      enableOcrFallback: true,
    });

    if (result.success) {
      // Persist extraction
      await createExtraction({
        document: { connect: { id: documentId } },
        parserVersion: result.parserVersion,
        stage: "NORMALIZED_106",
        payload: JSON.parse(JSON.stringify(result.data)),
      });

      // Update document status + tax year
      await updateDocumentStatus(documentId, "PROCESSED");
      await setDocumentTaxYear(documentId, result.data.taxYear);

      // Run refund estimator
      let estimate: Ingest106Success["estimate"] = null;
      const refundResult = estimateRefund({
        extracted106: result.data,
        wizardState: input.wizardState,
      });
      if (refundResult) {
        estimate = {
          confidenceTier: refundResult.confidenceTier,
          estimateVersion: refundResult.estimateVersion,
        };
      }

      console.log(
        `[ingestion] Document ${documentId} processed successfully via ${result.extractionMethod}`
      );

      return {
        success: true,
        data: result.data,
        extractionMethod: result.extractionMethod,
        parserVersion: result.parserVersion,
        estimate,
        documentId,
      };
    } else {
      // Pipeline failure
      const failureStage = mapIngestionStageToFailureStage(result.error.stage);

      await createParsingFailure({
        document: { connect: { id: documentId } },
        parserVersion: result.error.parserVersion,
        stage: failureStage,
        error: {
          stage: result.error.stage,
          message: result.error.message,
          code: result.error.code,
        },
      });

      await updateDocumentStatus(documentId, "FAILED");

      const apiCode = mapPipelineErrorCode(result.error.code);

      console.warn(
        `[ingestion] Document ${documentId} failed: ${redact(result.error.message)}`
      );

      return {
        success: false,
        error: {
          code: apiCode,
          message: ERROR_MESSAGES[apiCode],
          stage: result.error.stage,
        },
      };
    }
  } catch (error) {
    // Unexpected error
    if (documentId) {
      try {
        await updateDocumentStatus(documentId, "FAILED");
      } catch {
        // Best-effort status update
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `[ingestion] Unexpected error for document ${documentId ?? "unknown"}: ${redact(errorMessage)}`
    );

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      },
    };
  } finally {
    // Always clean up temp file
    try {
      await fs.promises.unlink(tempPath);
    } catch {
      // File may not exist if write failed
    }
  }
}
