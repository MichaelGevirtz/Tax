import { z } from "zod";
import { isValidMoney } from "../validators/money.validator";

const MoneySchema = z.number().refine(isValidMoney, {
  message: "Must be a non-negative finite number",
});

const ConfidenceTierSchema = z.enum(["HIGH", "MODERATE", "LOW", "NONE"]);

/**
 * Zod schema for the tax refund estimate output.
 * Produced by the estimator in packages/core/src/calc/refund-estimator.ts.
 */
export const RefundEstimateSchema = z.object({
  taxYear: z.number().int(),
  grossIncome: MoneySchema,
  taxDeducted: MoneySchema,
  calculatedTax: MoneySchema,
  estimatedRefund: MoneySchema,
  creditPointsUsed: z.number().min(0),
  confidenceTier: ConfidenceTierSchema,
  estimateVersion: z.string().min(1),
  limitations: z.array(z.string()).min(1),
});

export type RefundEstimate = z.infer<typeof RefundEstimateSchema>;
