import { describe, it, expect } from "vitest";
import { evaluateSoftEligibility } from "../soft-evaluator";
import { INITIAL_WIZARD_STATE } from "../wizard-state";
import type { WizardState } from "../wizard-state";

function makeState(overrides: Partial<WizardState>): WizardState {
  return { ...INITIAL_WIZARD_STATE, years: [2024], ...overrides };
}

describe("evaluateSoftEligibility", () => {
  describe("Case A — multiple strong signals → true, high", () => {
    it("multiple employers + partial year", () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: [
            "עבודה אצל יותר ממעסיק אחד באותה שנה",
            "תקופה ללא עבודה / עבודה חלקית",
          ],
          mortgageAndLifeInsurance: ["לא היה לי"],
          personalCredits: ["לא רלוונטי"],
          additionalIncome: ["לא היו לי הכנסות נוספות"],
        }),
      );
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.reasons.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Case B — only weak signal → true, low", () => {
    it('only "לא בטוח" in Step 2', () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: ["לא זכור לי שינוי משמעותי"],
          mortgageAndLifeInsurance: ["לא בטוח"],
          personalCredits: ["לא רלוונטי"],
          additionalIncome: ["לא היו לי הכנסות נוספות"],
        }),
      );
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("low");
      expect(result.reasons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Case C — all negations → false", () => {
    it("all steps select negation option", () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: ["לא זכור לי שינוי משמעותי"],
          mortgageAndLifeInsurance: ["לא היה לי"],
          personalCredits: ["לא רלוונטי"],
          additionalIncome: ["לא היו לי הכנסות נוספות"],
        }),
      );
      expect(result.canProceedToUpload).toBe(false);
      expect(result.confidence).toBe("low");
      expect(result.reasons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Case D — one strong signal → true, medium", () => {
    it("only job switch selected", () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: ["החלפת מקום עבודה"],
          mortgageAndLifeInsurance: ["לא היה לי"],
          personalCredits: ["לא רלוונטי"],
          additionalIncome: ["לא היו לי הכנסות נוספות"],
        }),
      );
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("medium");
    });
  });

  describe("Case E — mortgage + degree → true, high", () => {
    it("cross-step strong signals", () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: ["לא זכור לי שינוי משמעותי"],
          mortgageAndLifeInsurance: ["משכנתא"],
          personalCredits: ["סיום תואר / לימודים אקדמיים"],
          additionalIncome: ["לא היו לי הכנסות נוספות"],
        }),
      );
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("high");
      expect(result.reasons).toContain("תשלומי משכנתא");
      expect(result.reasons).toContain("סיום תואר אקדמי");
    });
  });

  describe("Case F — two weak signals → true, medium", () => {
    it('"לא בטוח" + "הכנסה נוספת אחרת"', () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: ["לא זכור לי שינוי משמעותי"],
          mortgageAndLifeInsurance: ["לא בטוח"],
          personalCredits: ["לא רלוונטי"],
          additionalIncome: ["הכנסה נוספת אחרת"],
        }),
      );
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("medium");
    });
  });

  describe("reasons array constraints", () => {
    it("caps at 5 reasons even with many signals", () => {
      const result = evaluateSoftEligibility(
        makeState({
          employmentChanges: [
            "עבודה אצל יותר ממעסיק אחד באותה שנה",
            "תקופה ללא עבודה / עבודה חלקית",
            "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)",
            "החלפת מקום עבודה",
          ],
          mortgageAndLifeInsurance: ["משכנתא", "ביטוח חיים פרטי"],
          personalCredits: ["סיום תואר / לימודים אקדמיים"],
          additionalIncome: ["רווחים משוק ההון"],
        }),
      );
      expect(result.reasons.length).toBeLessThanOrEqual(5);
      expect(result.canProceedToUpload).toBe(true);
      expect(result.confidence).toBe("high");
    });
  });
});
