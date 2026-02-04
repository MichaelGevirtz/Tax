import { Prisma, Document, DocumentStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function createDocument(
  data: Prisma.DocumentCreateInput
): Promise<Document> {
  return prisma.document.create({ data });
}

export async function getDocumentById(id: string): Promise<Document | null> {
  return prisma.document.findUnique({ where: { id } });
}

export async function listDocumentsByUser(userId: string): Promise<Document[]> {
  return prisma.document.findMany({ where: { userId } });
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus
): Promise<Document> {
  return prisma.document.update({ where: { id }, data: { status } });
}

export async function setDocumentTaxYear(
  id: string,
  taxYear: number
): Promise<Document> {
  return prisma.document.update({ where: { id }, data: { taxYear } });
}
