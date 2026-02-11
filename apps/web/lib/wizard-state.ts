/**
 * Wizard state type and localStorage persistence helper.
 * TASK-UI-004: 5-step onboarding wizard state model.
 */

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
