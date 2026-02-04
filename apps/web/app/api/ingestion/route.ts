import { NextRequest, NextResponse } from "next/server";
import { ingest106AndPersist } from "@/server/ingestion/ingest106-and-persist";

interface IngestionRequestBody {
  documentId: string;
  parserVersion?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IngestionRequestBody;

    if (!body.documentId || typeof body.documentId !== "string") {
      return NextResponse.json(
        { ok: false, error: { stage: "request", message: "documentId is required" } },
        { status: 400 }
      );
    }

    const result = await ingest106AndPersist({
      documentId: body.documentId,
      parserVersion: body.parserVersion,
    });

    if (result.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 422 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          stage: "server",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
