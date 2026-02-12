import { NextRequest } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type UploadErrorCode = "MISSING_FILE" | "INVALID_FILE_TYPE" | "FILE_TOO_LARGE";

export class UploadValidationError extends Error {
  public readonly code: UploadErrorCode;
  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.name = "UploadValidationError";
    this.code = code;
  }
}

export interface ParsedUpload {
  file: Buffer;
  fileName: string;
  wizardState?: Record<string, unknown>;
}

/**
 * Parse a multipart/form-data upload from a Next.js request.
 * Validates: file present, MIME type is PDF, size ≤ 10MB.
 * Throws UploadValidationError on validation failure.
 */
export async function parseUpload(request: NextRequest): Promise<ParsedUpload> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new UploadValidationError("MISSING_FILE", "No file provided");
  }

  // Validate MIME type
  if (file.type !== "application/pdf") {
    throw new UploadValidationError("INVALID_FILE_TYPE", "File must be a PDF");
  }

  // Validate file name extension
  const fileName = file.name || "upload.pdf";
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    throw new UploadValidationError("INVALID_FILE_TYPE", "File must have .pdf extension");
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadValidationError("FILE_TOO_LARGE", `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse optional wizardState JSON
  const wizardStateRaw = formData.get("wizardState");
  let wizardState: Record<string, unknown> | undefined;
  if (wizardStateRaw && typeof wizardStateRaw === "string") {
    try {
      wizardState = JSON.parse(wizardStateRaw);
    } catch {
      // Ignore malformed wizardState — it's optional enrichment
    }
  }

  return { file: buffer, fileName, wizardState };
}
