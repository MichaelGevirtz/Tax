/**
 * Registry: year -> tax bracket table + credit point table lookup.
 * Supports tax years 2020-2025.
 */

import type { TaxBracketTable, CreditPointTable } from "./types";
import { BRACKETS_2020, CREDITS_2020 } from "./brackets-2020";
import { BRACKETS_2021, CREDITS_2021 } from "./brackets-2021";
import { BRACKETS_2022, CREDITS_2022 } from "./brackets-2022";
import { BRACKETS_2023, CREDITS_2023 } from "./brackets-2023";
import { BRACKETS_2024, CREDITS_2024 } from "./brackets-2024";
import { BRACKETS_2025, CREDITS_2025 } from "./brackets-2025";

const BRACKET_REGISTRY: ReadonlyMap<number, TaxBracketTable> = new Map([
  [2020, BRACKETS_2020],
  [2021, BRACKETS_2021],
  [2022, BRACKETS_2022],
  [2023, BRACKETS_2023],
  [2024, BRACKETS_2024],
  [2025, BRACKETS_2025],
]);

const CREDIT_REGISTRY: ReadonlyMap<number, CreditPointTable> = new Map([
  [2020, CREDITS_2020],
  [2021, CREDITS_2021],
  [2022, CREDITS_2022],
  [2023, CREDITS_2023],
  [2024, CREDITS_2024],
  [2025, CREDITS_2025],
]);

export function getBracketTable(year: number): TaxBracketTable | undefined {
  return BRACKET_REGISTRY.get(year);
}

export function getCreditTable(year: number): CreditPointTable | undefined {
  return CREDIT_REGISTRY.get(year);
}

export function getSupportedYears(): number[] {
  return Array.from(BRACKET_REGISTRY.keys()).sort();
}

export type { TaxBracketTable, CreditPointTable, TaxBracket } from "./types";
