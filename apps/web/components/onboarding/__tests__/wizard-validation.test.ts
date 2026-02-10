import { describe, it, expect } from "vitest";
import type { WizardState } from "../../../lib/wizard-state";
import { INITIAL_WIZARD_STATE } from "../../../lib/wizard-state";

/**
 * Wizard step validation logic (mirrors OnboardingWizard.isStepValid).
 * Extracted here for unit testing.
 */
function isStepValid(step: number, state: WizardState): boolean {
  switch (step) {
    case 0:
      return state.employmentChanges.length >= 1;
    case 1:
      return state.mortgageAndLifeInsurance.length >= 1;
    case 2:
      return state.personalCredits.length >= 1;
    case 3:
      return state.additionalIncome.length >= 1;
    case 4:
      return state.years.length >= 1;
    default:
      return false;
  }
}

describe("wizard step validation", () => {
  describe("Step 1 — Employment Changes (multi-select, ≥ 1)", () => {
    it("is invalid with no selections", () => {
      expect(isStepValid(0, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("is valid with one selection", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        employmentChanges: ["החלפת מקום עבודה"],
      };
      expect(isStepValid(0, state)).toBe(true);
    });

    it("is valid with multiple selections", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        employmentChanges: [
          "החלפת מקום עבודה",
          "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)",
        ],
      };
      expect(isStepValid(0, state)).toBe(true);
    });
  });

  describe("Step 2 — Mortgage & Life Insurance (multi-select, ≥ 1)", () => {
    it("is invalid with no selections", () => {
      expect(isStepValid(1, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("is valid with one selection", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        mortgageAndLifeInsurance: ["משכנתא"],
      };
      expect(isStepValid(1, state)).toBe(true);
    });
  });

  describe("Step 3 — Personal Credits (multi-select, ≥ 1)", () => {
    it("is invalid with no selections", () => {
      expect(isStepValid(2, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("is valid with one selection", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        personalCredits: ["סיימתי תואר / לימודים אקדמיים"],
      };
      expect(isStepValid(2, state)).toBe(true);
    });

    it("is valid with multiple selections", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        personalCredits: [
          "סיימתי תואר / לימודים אקדמיים",
          "יש לי נקודות זיכוי אישיות (ילדים מתחת לגיל 18, מגבלה, עולה חדש וכד׳)",
        ],
      };
      expect(isStepValid(2, state)).toBe(true);
    });

    it("is valid with 'לא רלוונטי'", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        personalCredits: ["לא רלוונטי"],
      };
      expect(isStepValid(2, state)).toBe(true);
    });
  });

  describe("Step 4 — Additional Income (multi-select, ≥ 1)", () => {
    it("is invalid with no selections", () => {
      expect(isStepValid(3, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("is valid with one selection", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        additionalIncome: ["רווחים משוק ההון"],
      };
      expect(isStepValid(3, state)).toBe(true);
    });

    it("is valid with multiple selections", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        additionalIncome: ["רווחים משוק ההון", "הכנסה משכר דירה"],
      };
      expect(isStepValid(3, state)).toBe(true);
    });

    it("is valid with 'לא היו לי הכנסות נוספות'", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        additionalIncome: ["לא היו לי הכנסות נוספות"],
      };
      expect(isStepValid(3, state)).toBe(true);
    });
  });

  describe("Step 5 — Tax Years (multi-select, ≥ 1)", () => {
    it("is invalid with no selections", () => {
      expect(isStepValid(4, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("is valid with one year", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        years: [2024],
      };
      expect(isStepValid(4, state)).toBe(true);
    });

    it("is valid with multiple years", () => {
      const state: WizardState = {
        ...INITIAL_WIZARD_STATE,
        years: [2022, 2023, 2024],
      };
      expect(isStepValid(4, state)).toBe(true);
    });
  });

  describe("invalid step numbers", () => {
    it("returns false for negative step", () => {
      expect(isStepValid(-1, INITIAL_WIZARD_STATE)).toBe(false);
    });

    it("returns false for step > 4", () => {
      expect(isStepValid(5, INITIAL_WIZARD_STATE)).toBe(false);
    });
  });
});
