/**
 * Types for Israeli income tax bracket tables and credit point tables.
 * Published annually by the Israeli Tax Authority.
 */

export interface TaxBracket {
  /** Lower bound of the bracket (inclusive), in annual ₪ */
  from: number;
  /** Upper bound of the bracket (inclusive), in annual ₪. Infinity for the top bracket. */
  to: number;
  /** Tax rate as a decimal (e.g., 0.10 for 10%) */
  rate: number;
}

export interface TaxBracketTable {
  year: number;
  brackets: TaxBracket[];
}

export interface CreditPointTable {
  year: number;
  /** Annual value of one credit point in ₪ */
  pointValue: number;
  /** Base credit points for every Israeli resident */
  basePoints: number;
}
