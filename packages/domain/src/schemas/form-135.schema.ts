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
 * Form 135 field data for PDF generation.
 * Phase 1: Fields populated from a single Form 106.
 *
 * employeeId       -> Section א, מספר זהות
 * employerId       -> Section ג, employer area
 * taxYear          -> Header (verification; pre-printed on template)
 * box158_grossIncome -> Section ג row 3: משכורת/שכר עבודה
 * box042_taxDeducted -> Section מ: ניכוי מס במקור מ-106
 */
export const Form135Schema = z.object({
  // Section א: General Details
  employeeId: IsraeliIdSchema,           // @pii

  // Header
  taxYear: TaxYearSchema,

  // Section ג: Taxable Income from Personal Effort
  employerId: IsraeliIdSchema,           // @pii
  box158_grossIncome: MoneySchema,       // Box 158: salary income (employee share) // @pii

  // Section מ: Withholdings Summary
  box042_taxDeducted: MoneySchema,       // Box 042: tax withheld per Form 106 // @pii
});

/**
 * Generation metadata attached to every output.
 * Supports auditability requirement: we can trace how a PDF was produced.
 */
export const Form135GenerationMetaSchema = z.object({
  generatorVersion: z.string(),
  sourceForm106ParserVersion: z.string(),
  templateYear: z.number(),
  generatedAt: z.string().datetime(),
});
