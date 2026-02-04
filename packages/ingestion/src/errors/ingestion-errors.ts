export type IngestionStage = "extract" | "normalize" | "validate";

export interface IngestionError {
  stage: IngestionStage;
  parserVersion: string;
  message: string;
  cause?: unknown;
}

export class IngestionFailure extends Error {
  public readonly stage: IngestionStage;
  public readonly parserVersion: string;
  public readonly cause?: unknown;

  constructor(error: IngestionError) {
    super(error.message);
    this.name = "IngestionFailure";
    this.stage = error.stage;
    this.parserVersion = error.parserVersion;
    this.cause = error.cause;
  }

  toJSON(): IngestionError {
    return {
      stage: this.stage,
      parserVersion: this.parserVersion,
      message: this.message,
      cause: this.cause,
    };
  }
}

export const PARSER_VERSION = "1.0.0";
