/**
 * Credit point calculator.
 * Maps wizard personalCredits selections to credit point count.
 * Pure function, no IO.
 */

import { getCreditTable } from "../tax-tables";

/**
 * Known wizard personalCredits option strings.
 * Must stay in sync with apps/web/components/onboarding/steps/Step3PersonalCredits.tsx
 */
const CREDIT_OPTION_DEGREE = "סיום תואר / לימודים אקדמיים";
const CREDIT_OPTION_CHILDREN = "ילדים מתחת לגיל 18";
const CREDIT_OPTION_NONE = "לא רלוונטי";

/**
 * Conservative credit point additions per wizard selection.
 * These are minimums — the real value may be higher depending on details
 * we don't collect in the wizard (number of children, degree completion year, etc.)
 */
const WIZARD_CREDIT_MAP: Record<string, number> = {
  [CREDIT_OPTION_DEGREE]: 1, // 1 point for year of completion + following year
  [CREDIT_OPTION_CHILDREN]: 1, // Conservative: 1 point (actual varies by child age/count)
  // "עולה חדש / תושב חוזר" and "מגבלה רפואית" are not mapped in v1
  // because the point values vary significantly and require more data
};

/** Wizard state shape (subset relevant to credit calculation) */
export interface WizardCreditsInput {
  personalCredits?: string[];
}

/**
 * Calculate total credit points based on wizard state.
 * Returns base points (2.25) if no wizard data provided.
 *
 * @param year Tax year (for looking up base points)
 * @param wizardInput Optional wizard state for enrichment
 * @returns Total credit points
 */
export function calculateCreditPoints(
  year: number,
  wizardInput?: WizardCreditsInput,
): number {
  const creditTable = getCreditTable(year);
  const basePoints = creditTable?.basePoints ?? 2.25;

  if (!wizardInput?.personalCredits || wizardInput.personalCredits.length === 0) {
    return basePoints;
  }

  // "לא רלוונטי" means user explicitly said no additional credits
  if (wizardInput.personalCredits.includes(CREDIT_OPTION_NONE)) {
    return basePoints;
  }

  let additionalPoints = 0;
  for (const selection of wizardInput.personalCredits) {
    additionalPoints += WIZARD_CREDIT_MAP[selection] ?? 0;
  }

  return basePoints + additionalPoints;
}

/**
 * Get the annual monetary value of credit points for a given year and point count.
 * @returns Value in ₪, or null if year not supported.
 */
export function getCreditValue(year: number, points: number): number | null {
  const creditTable = getCreditTable(year);
  if (!creditTable) return null;

  return Math.round(points * creditTable.pointValue * 100) / 100;
}
