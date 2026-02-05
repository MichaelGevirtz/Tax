export type IngestionStage = "extract" | "normalize" | "validate";

export type ExtractionErrorCode =
  | "PDF_TOOL_MISSING"
  | "PDF_PASSWORD_REQUIRED"
  | "PDF_PASSWORD_INVALID"
  | "PDF_EXTRACTION_FAILED"
  | "PDF_EXTRACTION_TIMEOUT";

export type NormalizationErrorCode =
  | "NORMALIZATION_FAILED"
  | "FIELD_NOT_FOUND"
  | "FIELD_INVALID"
  | "TEXT_GARBLED";

export type IngestionErrorCode = ExtractionErrorCode | NormalizationErrorCode;

export interface IngestionError {
  stage: IngestionStage;
  parserVersion: string;
  message: string;
  code?: IngestionErrorCode;
  cause?: unknown;
}

export class IngestionFailure extends Error {
  public readonly stage: IngestionStage;
  public readonly parserVersion: string;
  public readonly code?: IngestionErrorCode;
  public readonly cause?: unknown;

  constructor(error: IngestionError) {
    super(error.message);
    this.name = "IngestionFailure";
    this.stage = error.stage;
    this.parserVersion = error.parserVersion;
    this.code = error.code;
    this.cause = error.cause;
  }

  toJSON(): IngestionError {
    return {
      stage: this.stage,
      parserVersion: this.parserVersion,
      message: this.message,
      code: this.code,
      cause: this.cause,
    };
  }
}

export const PARSER_VERSION = "1.0.0";
