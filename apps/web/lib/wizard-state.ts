/**
 * Wizard state type and localStorage persistence helper.
 * TASK-UI-004: 5-step onboarding wizard state model.
 * TASK-016: soft result persistence.
 */

import type { SoftResult } from "./soft-evaluator";

export interface WizardState {
  employmentChanges: string[]; // Step 1
  mortgageAndLifeInsurance: string[]; // Step 2
  personalCredits: string[]; // Step 3
  additionalIncome: string[]; // Step 4
  years: number[]; // Step 5
}

export const INITIAL_WIZARD_STATE: WizardState = {
  employmentChanges: [],
  mortgageAndLifeInsurance: [],
  personalCredits: [],
  additionalIncome: [],
  years: [],
};

const STORAGE_KEY = "taxback_precheck_v2";
const SOFT_RESULT_KEY = "taxback_soft_result_v1";

export function saveWizardState(state: WizardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function loadWizardState(): WizardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

export function clearWizardState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveSoftResult(result: SoftResult): void {
  try {
    localStorage.setItem(SOFT_RESULT_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
}

export function loadSoftResult(): SoftResult | null {
  try {
    const raw = localStorage.getItem(SOFT_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SoftResult;
  } catch {
    return null;
  }
}

export function clearSoftResult(): void {
  try {
    localStorage.removeItem(SOFT_RESULT_KEY);
  } catch {
    // ignore
  }
}
