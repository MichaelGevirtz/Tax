import type { TaxBracketTable, CreditPointTable } from "./types";

/** Source: Israeli Tax Authority, tax year 2022 */
export const BRACKETS_2022: TaxBracketTable = {
  year: 2022,
  brackets: [
    { from: 0, to: 77_400, rate: 0.10 },
    { from: 77_401, to: 110_880, rate: 0.14 },
    { from: 110_881, to: 178_080, rate: 0.20 },
    { from: 178_081, to: 247_440, rate: 0.31 },
    { from: 247_441, to: 514_920, rate: 0.35 },
    { from: 514_921, to: 663_240, rate: 0.47 },
    { from: 663_241, to: Infinity, rate: 0.50 },
  ],
};

/** Source: Israeli Tax Authority, credit point value 2022 = 2,676 ₪/year */
export const CREDITS_2022: CreditPointTable = {
  year: 2022,
  pointValue: 2_676,
  basePoints: 2.25,
};
