import { z } from "zod";
import { isValidMoney } from "../validators/money.validator";

const MoneySchema = z.number().refine(isValidMoney, {
  message: "Must be a non-negative finite number",
});

export const TaxResultSchema = z.object({
  calculatedTax: MoneySchema,
  taxPaid: MoneySchema,
  refundAmount: MoneySchema,
  rulesetVersion: z.string(),
});
