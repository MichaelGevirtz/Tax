import type { TaxBracketTable, CreditPointTable } from "./types";

/** Source: Israeli Tax Authority, tax year 2021 */
export const BRACKETS_2021: TaxBracketTable = {
  year: 2021,
  brackets: [
    { from: 0, to: 75_480, rate: 0.10 },
    { from: 75_481, to: 108_360, rate: 0.14 },
    { from: 108_361, to: 173_880, rate: 0.20 },
    { from: 173_881, to: 241_680, rate: 0.31 },
    { from: 241_681, to: 502_920, rate: 0.35 },
    { from: 502_921, to: 647_640, rate: 0.47 },
    { from: 647_641, to: Infinity, rate: 0.50 },
  ],
};

/** Source: Israeli Tax Authority, credit point value 2021 = 2,616 ₪/year */
export const CREDITS_2021: CreditPointTable = {
  year: 2021,
  pointValue: 2_616,
  basePoints: 2.25,
};
