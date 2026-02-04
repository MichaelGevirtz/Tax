import { z } from "zod";
import { TaxInputSchema } from "./tax-input.schema";
import { TaxResultSchema } from "./tax-result.schema";

export const CalculationRequestSchema = z.object({
  input: TaxInputSchema,
});

export const CalculationResponseSchema = z.object({
  success: z.boolean(),
  result: TaxResultSchema.optional(),
  error: z.string().optional(),
});

export const IngestionRequestSchema = z.object({
  documentId: z.string().uuid(),
});

export const IngestionResponseSchema = z.object({
  success: z.boolean(),
  documentId: z.string().uuid().optional(),
  error: z.string().optional(),
});
