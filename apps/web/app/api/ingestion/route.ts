import { NextRequest, NextResponse } from "next/server";
import { parseUpload, UploadValidationError } from "@/server/ingestion/parse-upload";
import { ingest106AndPersist, type ApiErrorCode } from "@/server/ingestion/ingest106-and-persist";

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FILE: "יש להעלות קובץ",
  INVALID_FILE_TYPE: "יש להעלות קובץ PDF בלבד",
  FILE_TOO_LARGE: "הקובץ גדול מדי. הגודל המרבי הוא 10MB",
};

const HTTP_STATUS_BY_ERROR: Record<ApiErrorCode, number> = {
  INVALID_FILE_TYPE: 400,
  FILE_TOO_LARGE: 400,
  PARSE_FAILED: 422,
  NOT_FORM_106: 422,
  OCR_QUALITY_LOW: 422,
  INTERNAL_ERROR: 500,
};

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate multipart upload
    const parsed = await parseUpload(request);

    // 2. Run ingestion pipeline + persist
    const result = await ingest106AndPersist({
      file: parsed.file,
      fileName: parsed.fileName,
      wizardState: parsed.wizardState as Parameters<typeof ingest106AndPersist>[0]["wizardState"],
    });

    // 3. Return response
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const httpStatus = HTTP_STATUS_BY_ERROR[result.error.code as ApiErrorCode] ?? 500;
      return NextResponse.json(result, { status: httpStatus });
    }
  } catch (error) {
    if (error instanceof UploadValidationError) {
      const message = ERROR_MESSAGES[error.code] ?? error.message;
      const code = error.code === "MISSING_FILE" ? "INVALID_FILE_TYPE" : error.code;
      return NextResponse.json(
        {
          success: false,
          error: { code, message },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "שגיאה פנימית. נסו שנית מאוחר יותר",
        },
      },
      { status: 500 }
    );
  }
}
