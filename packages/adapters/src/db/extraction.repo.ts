import { Prisma, Extraction, ExtractionStage } from "@prisma/client";
import { prisma } from "./prisma";

export async function createExtraction(
  data: Prisma.ExtractionCreateInput
): Promise<Extraction> {
  return prisma.extraction.create({ data });
}

export async function listExtractionsByDocument(
  documentId: string
): Promise<Extraction[]> {
  return prisma.extraction.findMany({ where: { documentId } });
}

export async function getExtractionByUnique(
  documentId: string,
  parserVersion: string,
  stage: ExtractionStage
): Promise<Extraction | null> {
  return prisma.extraction.findUnique({
    where: {
      documentId_parserVersion_stage: {
        documentId,
        parserVersion,
        stage,
      },
    },
  });
}

export async function getLatestExtraction(
  documentId: string,
  stage: ExtractionStage
): Promise<Extraction | null> {
  return prisma.extraction.findFirst({
    where: { documentId, stage },
    orderBy: { createdAt: "desc" },
  });
}
