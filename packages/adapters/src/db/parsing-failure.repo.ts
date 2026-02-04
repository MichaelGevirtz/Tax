import { Prisma, ParsingFailure } from "@prisma/client";
import { prisma } from "./prisma";

export async function createParsingFailure(
  data: Prisma.ParsingFailureCreateInput
): Promise<ParsingFailure> {
  return prisma.parsingFailure.create({ data });
}

export async function listFailuresByDocument(
  documentId: string
): Promise<ParsingFailure[]> {
  return prisma.parsingFailure.findMany({ where: { documentId } });
}
