import { describe, it, expect } from "vitest";
import { applyStep3Exclusivity } from "../steps/Step3PersonalCredits";

const DEGREE = "סיימתי תואר / לימודים אקדמיים";
const CREDITS =
  "יש לי נקודות זיכוי אישיות (ילדים מתחת לגיל 18, מגבלה, עולה חדש וכד׳)";
const NONE = "לא רלוונטי";

describe("Step 3 exclusivity rules", () => {
  describe("selecting the negation option", () => {
    it("clears all other selections when selecting 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([DEGREE, CREDITS], NONE);
      expect(result).toEqual([NONE]);
    });

    it("clears a single positive selection", () => {
      const result = applyStep3Exclusivity([DEGREE], NONE);
      expect(result).toEqual([NONE]);
    });
  });

  describe("selecting positive options clears negation", () => {
    it("selecting degree clears 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([NONE], DEGREE);
      expect(result).toEqual([DEGREE]);
    });

    it("selecting credits clears 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([NONE], CREDITS);
      expect(result).toEqual([CREDITS]);
    });
  });

  describe("combining positive options", () => {
    it("allows degree and credits together", () => {
      const result = applyStep3Exclusivity([DEGREE], CREDITS);
      expect(result).toEqual([DEGREE, CREDITS]);
    });

    it("allows credits and degree together", () => {
      const result = applyStep3Exclusivity([CREDITS], DEGREE);
      expect(result).toEqual([CREDITS, DEGREE]);
    });
  });

  describe("deselecting items", () => {
    it("deselects degree from combined selection", () => {
      const result = applyStep3Exclusivity([DEGREE, CREDITS], DEGREE);
      expect(result).toEqual([CREDITS]);
    });

    it("deselects credits from combined selection", () => {
      const result = applyStep3Exclusivity([DEGREE, CREDITS], CREDITS);
      expect(result).toEqual([DEGREE]);
    });

    it("deselects the negation option", () => {
      const result = applyStep3Exclusivity([NONE], NONE);
      expect(result).toEqual([]);
    });

    it("deselects last remaining positive option", () => {
      const result = applyStep3Exclusivity([DEGREE], DEGREE);
      expect(result).toEqual([]);
    });
  });

  describe("starting from empty", () => {
    it("adds a positive option to empty array", () => {
      expect(applyStep3Exclusivity([], DEGREE)).toEqual([DEGREE]);
    });

    it("adds negation option to empty array", () => {
      expect(applyStep3Exclusivity([], NONE)).toEqual([NONE]);
    });
  });
});
