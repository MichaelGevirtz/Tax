import type { TaxBracketTable, CreditPointTable } from "./types";

/** Source: Israeli Tax Authority, tax year 2024 */
export const BRACKETS_2024: TaxBracketTable = {
  year: 2024,
  brackets: [
    { from: 0, to: 84_120, rate: 0.10 },
    { from: 84_121, to: 120_720, rate: 0.14 },
    { from: 120_721, to: 193_800, rate: 0.20 },
    { from: 193_801, to: 269_280, rate: 0.31 },
    { from: 269_281, to: 560_280, rate: 0.35 },
    { from: 560_281, to: 721_560, rate: 0.47 },
    { from: 721_561, to: Infinity, rate: 0.50 },
  ],
};

/** Source: Israeli Tax Authority, credit point value 2024 = 2,904 ₪/year */
export const CREDITS_2024: CreditPointTable = {
  year: 2024,
  pointValue: 2_904,
  basePoints: 2.25,
};
