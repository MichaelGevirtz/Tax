/**
 * Pure tax bracket calculator.
 * Computes expected income tax from gross income using Israeli progressive brackets.
 * No IO, no side effects.
 */

import { getBracketTable } from "../tax-tables";

/**
 * Calculate the expected income tax for a given gross annual income and tax year.
 * Uses the progressive bracket system: each bracket's rate applies only to
 * the income within that bracket's range.
 *
 * @returns The total tax amount in ₪, or null if the year is not supported.
 */
export function calculateTaxForYear(grossIncome: number, year: number): number | null {
  const table = getBracketTable(year);
  if (!table) return null;

  if (grossIncome <= 0) return 0;

  let totalTax = 0;
  let previousBound = 0;

  for (const bracket of table.brackets) {
    if (grossIncome <= previousBound) break;

    const upper = bracket.to === Infinity ? grossIncome : Math.min(grossIncome, bracket.to);
    const taxableInBracket = upper - previousBound;
    totalTax += taxableInBracket * bracket.rate;
    previousBound = bracket.to;
  }

  // Round to nearest agora (2 decimal places) for determinism
  return Math.round(totalTax * 100) / 100;
}
