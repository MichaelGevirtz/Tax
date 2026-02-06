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

  // Income (boxes 42-49 area)
  grossIncome: MoneySchema,            // Box 42: סה"כ הכנסה ממשכורת
  taxableIncome: MoneySchema,          // Box 45: הכנסה חייבת במס

  // Deductions (boxes 36-41 area)
  taxDeducted: MoneySchema,            // Box 36: מס שנוכה
  socialSecurityDeducted: MoneySchema, // Box 38: ביטוח לאומי
  healthInsuranceDeducted: MoneySchema,// Box 39: ביטוח בריאות

  // Additional mandatory fields for Form 135
  pensionContribEmployee: MoneySchema, // Box 37: הפרשות עובד לפנסיה
  educationFundEmployee: MoneySchema,  // Box 40: קרן השתלמות עובד
});

export type Extracted106 = z.infer<typeof Extracted106Schema>;
