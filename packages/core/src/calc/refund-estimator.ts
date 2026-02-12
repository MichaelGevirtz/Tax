/**
 * Tax refund estimator — main entry point.
 * Combines tax bracket calculation with credit points to produce
 * a conservative refund estimate.
 *
 * Pure function, no IO, deterministic, versioned.
 */

import type { Extracted106 } from "@tax/domain";
import { calculateTaxForYear } from "./tax-calculator";
import { calculateCreditPoints, getCreditValue } from "./credit-calculator";
import type { WizardCreditsInput } from "./credit-calculator";
import { ESTIMATOR_VERSION } from "../versions/estimator-version";

export type ConfidenceTier = "HIGH" | "MODERATE" | "LOW" | "NONE";

export interface RefundEstimate {
  taxYear: number;
  grossIncome: number;
  taxDeducted: number;
  calculatedTax: number;
  estimatedRefund: number;
  creditPointsUsed: number;
  confidenceTier: ConfidenceTier;
  estimateVersion: string;
  limitations: string[];
}

export interface EstimatorInput {
  extracted106: Pick<Extracted106, "taxYear" | "grossIncome" | "taxDeducted">;
  wizardState?: WizardCreditsInput;
}

const STANDARD_LIMITATIONS: string[] = [
  "ההערכה מבוססת על מדרגות מס סטנדרטיות ונקודות זיכוי בסיסיות בלבד",
  "לא נכללים: ניכויים בגין פנסיה, משכנתא, תרומות, קרנות השתלמות",
  "ההחזר בפועל צפוי להיות גבוה יותר מההערכה",
  "אין לראות בהערכה זו ייעוץ מס או התחייבות לסכום כלשהו",
];

function mapToConfidenceTier(estimatedRefund: number): ConfidenceTier {
  if (estimatedRefund > 5_000) return "HIGH";
  if (estimatedRefund >= 1_000) return "MODERATE";
  if (estimatedRefund >= 1) return "LOW";
  return "NONE";
}

/**
 * Estimate the tax refund for a given Form 106 extraction + optional wizard data.
 *
 * Logic:
 * 1. Look up tax brackets for the given tax year
 * 2. Calculate expected tax using progressive brackets
 * 3. Calculate credit points (base + wizard enrichment)
 * 4. Subtract credit value from expected tax
 * 5. Estimated refund = taxDeducted - expectedTax (floor at 0)
 * 6. Map to confidence tier
 *
 * @returns RefundEstimate, or null if the tax year is not supported.
 */
export function estimateRefund(input: EstimatorInput): RefundEstimate | null {
  const { taxYear, grossIncome, taxDeducted } = input.extracted106;

  // Step 1-2: Calculate expected tax from brackets
  const rawTax = calculateTaxForYear(grossIncome, taxYear);
  if (rawTax === null) return null;

  // Step 3: Calculate credit points
  const creditPoints = calculateCreditPoints(taxYear, input.wizardState);

  // Step 4: Subtract credit value
  const creditValue = getCreditValue(taxYear, creditPoints);
  if (creditValue === null) return null;

  const calculatedTax = Math.max(0, Math.round((rawTax - creditValue) * 100) / 100);

  // Step 5: Estimated refund (floor at 0 — we don't tell users they owe money)
  const estimatedRefund = Math.max(0, Math.round((taxDeducted - calculatedTax) * 100) / 100);

  // Step 6: Confidence tier
  const confidenceTier = mapToConfidenceTier(estimatedRefund);

  return {
    taxYear,
    grossIncome,
    taxDeducted,
    calculatedTax,
    estimatedRefund,
    creditPointsUsed: creditPoints,
    confidenceTier,
    estimateVersion: ESTIMATOR_VERSION,
    limitations: [...STANDARD_LIMITATIONS],
  };
}
