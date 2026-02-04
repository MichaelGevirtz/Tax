import { Prisma, TaxCalculation } from "@prisma/client";
import { prisma } from "./prisma";

export async function createCalculation(
  data: Prisma.TaxCalculationCreateInput
): Promise<TaxCalculation> {
  return prisma.taxCalculation.create({ data });
}

export async function listCalculationsByUser(
  userId: string
): Promise<TaxCalculation[]> {
  return prisma.taxCalculation.findMany({ where: { userId } });
}

export async function getCalculationById(
  id: string
): Promise<TaxCalculation | null> {
  return prisma.taxCalculation.findUnique({ where: { id } });
}

export async function listCalculationsByUserAndYear(
  userId: string,
  taxYear: number
): Promise<TaxCalculation[]> {
  return prisma.taxCalculation.findMany({ where: { userId, taxYear } });
}
