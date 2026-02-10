import { describe, it, expect } from "vitest";
import { applyStep4Exclusivity } from "../steps/Step4AdditionalIncome";

const CAPITAL = "רווחים משוק ההון";
const RENT = "הכנסה משכר דירה";
const OTHER = "הכנסה נוספת אחרת";
const NONE = "לא היו לי הכנסות נוספות";

describe("Step 4 exclusivity rules", () => {
  describe("selecting the negation option", () => {
    it("clears all other selections when selecting 'no additional income'", () => {
      const result = applyStep4Exclusivity([CAPITAL, RENT, OTHER], NONE);
      expect(result).toEqual([NONE]);
    });

    it("clears a single positive selection", () => {
      const result = applyStep4Exclusivity([CAPITAL], NONE);
      expect(result).toEqual([NONE]);
    });

    it("clears two positive selections", () => {
      const result = applyStep4Exclusivity([RENT, OTHER], NONE);
      expect(result).toEqual([NONE]);
    });
  });

  describe("selecting positive options clears negation", () => {
    it("selecting capital markets clears 'no additional income'", () => {
      const result = applyStep4Exclusivity([NONE], CAPITAL);
      expect(result).toEqual([CAPITAL]);
    });

    it("selecting rent clears 'no additional income'", () => {
      const result = applyStep4Exclusivity([NONE], RENT);
      expect(result).toEqual([RENT]);
    });

    it("selecting other clears 'no additional income'", () => {
      const result = applyStep4Exclusivity([NONE], OTHER);
      expect(result).toEqual([OTHER]);
    });
  });

  describe("combining positive options", () => {
    it("allows capital and rent together", () => {
      const result = applyStep4Exclusivity([CAPITAL], RENT);
      expect(result).toEqual([CAPITAL, RENT]);
    });

    it("allows all three positive options together", () => {
      let result = applyStep4Exclusivity([], CAPITAL);
      result = applyStep4Exclusivity(result, RENT);
      result = applyStep4Exclusivity(result, OTHER);
      expect(result).toEqual([CAPITAL, RENT, OTHER]);
    });

    it("allows rent and other together", () => {
      const result = applyStep4Exclusivity([RENT], OTHER);
      expect(result).toEqual([RENT, OTHER]);
    });

    it("allows capital and other together", () => {
      const result = applyStep4Exclusivity([CAPITAL], OTHER);
      expect(result).toEqual([CAPITAL, OTHER]);
    });
  });

  describe("deselecting items", () => {
    it("deselects capital from combined selection", () => {
      const result = applyStep4Exclusivity([CAPITAL, RENT], CAPITAL);
      expect(result).toEqual([RENT]);
    });

    it("deselects rent from triple selection", () => {
      const result = applyStep4Exclusivity([CAPITAL, RENT, OTHER], RENT);
      expect(result).toEqual([CAPITAL, OTHER]);
    });

    it("deselects the negation option", () => {
      const result = applyStep4Exclusivity([NONE], NONE);
      expect(result).toEqual([]);
    });

    it("deselects last remaining positive option", () => {
      const result = applyStep4Exclusivity([CAPITAL], CAPITAL);
      expect(result).toEqual([]);
    });
  });

  describe("starting from empty", () => {
    it("adds a positive option to empty array", () => {
      expect(applyStep4Exclusivity([], CAPITAL)).toEqual([CAPITAL]);
    });

    it("adds negation option to empty array", () => {
      expect(applyStep4Exclusivity([], NONE)).toEqual([NONE]);
    });
  });
});
