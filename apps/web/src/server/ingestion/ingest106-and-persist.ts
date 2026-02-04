import {
  createExtraction,
  createParsingFailure,
  updateDocumentStatus,
} from "@tax/adapters";
import {
  ingest106Stub,
  type IngestionStage,
  PARSER_VERSION,
} from "@tax/ingestion";

type FailureStage = "EXTRACTION" | "NORMALIZATION" | "VALIDATION";

function mapIngestionStageToFailureStage(stage: IngestionStage): FailureStage {
  switch (stage) {
    case "extract":
      return "EXTRACTION";
    case "normalize":
      return "NORMALIZATION";
    case "validate":
      return "VALIDATION";
  }
}

export interface Ingest106AndPersistInput {
  documentId: string;
  parserVersion?: string;
}

export interface Ingest106AndPersistSuccess {
  ok: true;
}

export interface Ingest106AndPersistError {
  ok: false;
  error: {
    stage: string;
    message: string;
  };
}

export type Ingest106AndPersistResult =
  | Ingest106AndPersistSuccess
  | Ingest106AndPersistError;

export async function ingest106AndPersist(
  input: Ingest106AndPersistInput
): Promise<Ingest106AndPersistResult> {
  const { documentId, parserVersion = PARSER_VERSION } = input;

  // Run ingestion pipeline (stub for now)
  const result = ingest106Stub();

  if (result.success) {
    // Success path: create Extraction, then update Document status
    await createExtraction({
      document: { connect: { id: documentId } },
      parserVersion,
      stage: "NORMALIZED_106",
      payload: result.data,
    });

    await updateDocumentStatus(documentId, "PROCESSED");

    return { ok: true };
  } else {
    // Failure path: create ParsingFailure, then update Document status
    const failureStage = mapIngestionStageToFailureStage(result.error.stage);

    await createParsingFailure({
      document: { connect: { id: documentId } },
      parserVersion,
      stage: failureStage,
      error: {
        stage: result.error.stage,
        message: result.error.message,
      },
    });

    await updateDocumentStatus(documentId, "FAILED");

    return {
      ok: false,
      error: {
        stage: result.error.stage,
        message: result.error.message,
      },
    };
  }
}
