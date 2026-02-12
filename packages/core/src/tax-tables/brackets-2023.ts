import type { TaxBracketTable, CreditPointTable } from "./types";

/** Source: Israeli Tax Authority, tax year 2023 */
export const BRACKETS_2023: TaxBracketTable = {
  year: 2023,
  brackets: [
    { from: 0, to: 81_480, rate: 0.10 },
    { from: 81_481, to: 116_760, rate: 0.14 },
    { from: 116_761, to: 187_440, rate: 0.20 },
    { from: 187_441, to: 260_520, rate: 0.31 },
    { from: 260_521, to: 542_160, rate: 0.35 },
    { from: 542_161, to: 698_280, rate: 0.47 },
    { from: 698_281, to: Infinity, rate: 0.50 },
  ],
};

/** Source: Israeli Tax Authority, credit point value 2023 = 2,820 ₪/year */
export const CREDITS_2023: CreditPointTable = {
  year: 2023,
  pointValue: 2_820,
  basePoints: 2.25,
};
