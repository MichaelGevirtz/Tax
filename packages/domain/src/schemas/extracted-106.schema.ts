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

/**
 * Mandatory fields extracted from Form 106 for Form 135 population.
 * All fields required for tax return filing.
 */
export const Extracted106Schema = z.object({
  // Identification
  employeeId: IsraeliIdSchema,         // Box 1: מספר זהות עובד
  employerId: IsraeliIdSchema,         // Box 2: מספר מזהה מעסיק
  taxYear: TaxYearSchema,              // שנת מס

  // Income
  grossIncome: MoneySchema,            // סה"כ תשלומים

  // Deductions
  taxDeducted: MoneySchema,            // מס הכנסה [042]
  socialSecurityDeducted: MoneySchema, // ביטוח לאומי
  healthInsuranceDeducted: MoneySchema,// דמי בריאות
});

export type Extracted106 = z.infer<typeof Extracted106Schema>;
