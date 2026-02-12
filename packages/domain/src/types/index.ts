import { z } from "zod";
import { Normalized106Schema } from "../schemas/normalized-106.schema";
import { Extracted106Schema } from "../schemas/extracted-106.schema";
import { TaxInputSchema } from "../schemas/tax-input.schema";
import { TaxResultSchema } from "../schemas/tax-result.schema";
import {
  CalculationRequestSchema,
  CalculationResponseSchema,
  IngestionRequestSchema,
  IngestionResponseSchema,
} from "../schemas/api-contracts.schema";
import { Form135Schema, Form135GenerationMetaSchema } from "../schemas/form-135.schema";
import { RefundEstimateSchema } from "../schemas/refund-estimate.schema";

export type Normalized106 = z.infer<typeof Normalized106Schema>;
export type Extracted106 = z.infer<typeof Extracted106Schema>;
export type TaxInput = z.infer<typeof TaxInputSchema>;
export type TaxResult = z.infer<typeof TaxResultSchema>;
export type CalculationRequest = z.infer<typeof CalculationRequestSchema>;
export type CalculationResponse = z.infer<typeof CalculationResponseSchema>;
export type IngestionRequest = z.infer<typeof IngestionRequestSchema>;
export type IngestionResponse = z.infer<typeof IngestionResponseSchema>;
export type Form135Data = z.infer<typeof Form135Schema>;
export type Form135GenerationMeta = z.infer<typeof Form135GenerationMetaSchema>;
export type RefundEstimate = z.infer<typeof RefundEstimateSchema>;
