import type { TaxBracketTable, CreditPointTable } from "./types";

/** Source: Israeli Tax Authority, tax year 2020 */
export const BRACKETS_2020: TaxBracketTable = {
  year: 2020,
  brackets: [
    { from: 0, to: 75_960, rate: 0.10 },
    { from: 75_961, to: 108_960, rate: 0.14 },
    { from: 108_961, to: 174_960, rate: 0.20 },
    { from: 174_961, to: 243_120, rate: 0.31 },
    { from: 243_121, to: 505_920, rate: 0.35 },
    { from: 505_921, to: 651_600, rate: 0.47 },
    { from: 651_601, to: Infinity, rate: 0.50 },
  ],
};

/** Source: Israeli Tax Authority, credit point value 2020 = 2,628 ₪/year */
export const CREDITS_2020: CreditPointTable = {
  year: 2020,
  pointValue: 2_628,
  basePoints: 2.25,
};
