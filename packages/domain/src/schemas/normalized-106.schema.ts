import { z } from "zod";
import { isValidIsraeliId } from "../validators/israeli-id.validator";
import { isValidTaxYear, MIN_TAX_YEAR, MAX_TAX_YEAR } from "../validators/tax-year.validator";
import { isValidMoney } from "../validators/money.validator";

const MoneySchema = z.number().refine(isValidMoney, {
  message: "Must be a non-negative finite number",
});

const TaxYearSchema = z.number().int().min(MIN_TAX_YEAR).max(MAX_TAX_YEAR).refine(isValidTaxYear, {
  message: `Tax year must be between ${MIN_TAX_YEAR} and ${MAX_TAX_YEAR}`,
});

const IsraeliIdSchema = z.string().refine(isValidIsraeliId, {
  message: "Invalid Israeli ID",
});

export const Normalized106Schema = z.object({
  employeeId: IsraeliIdSchema,
  employerId: IsraeliIdSchema,
  taxYear: TaxYearSchema,
  grossIncome: MoneySchema,
  taxDeducted: MoneySchema,
  socialSecurityDeducted: MoneySchema,
  healthInsuranceDeducted: MoneySchema,
});
