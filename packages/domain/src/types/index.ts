import { z } from "zod";
import { Normalized106Schema } from "../schemas/normalized-106.schema";
import { TaxInputSchema } from "../schemas/tax-input.schema";
import { TaxResultSchema } from "../schemas/tax-result.schema";
import {
  CalculationRequestSchema,
  CalculationResponseSchema,
  IngestionRequestSchema,
  IngestionResponseSchema,
} from "../schemas/api-contracts.schema";

export type Normalized106 = z.infer<typeof Normalized106Schema>;
export type TaxInput = z.infer<typeof TaxInputSchema>;
export type TaxResult = z.infer<typeof TaxResultSchema>;
export type CalculationRequest = z.infer<typeof CalculationRequestSchema>;
export type CalculationResponse = z.infer<typeof CalculationResponseSchema>;
export type IngestionRequest = z.infer<typeof IngestionRequestSchema>;
export type IngestionResponse = z.infer<typeof IngestionResponseSchema>;
