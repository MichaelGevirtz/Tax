import { describe, it, expect } from "vitest";
import { applyStep2Exclusivity } from "../steps/Step2MortgageInsurance";

const MORTGAGE = "משכנתא";
const LIFE_INSURANCE = "ביטוח חיים פרטי (שאינו חלק ממשכנתא)";
const BOTH = "גם משכנתא וגם ביטוח חיים פרטי";
const NONE = "לא היה לי אף אחד מאלה";
const UNSURE = "לא בטוח";

describe("Step 2 exclusivity rules", () => {
  describe("selecting exclusive options", () => {
    it("selecting 'none' clears all other selections", () => {
      const result = applyStep2Exclusivity([MORTGAGE, LIFE_INSURANCE], NONE);
      expect(result).toEqual([NONE]);
    });

    it("selecting 'unsure' clears all other selections", () => {
      const result = applyStep2Exclusivity([MORTGAGE, BOTH], UNSURE);
      expect(result).toEqual([UNSURE]);
    });

    it("selecting 'none' clears 'both'", () => {
      const result = applyStep2Exclusivity([BOTH], NONE);
      expect(result).toEqual([NONE]);
    });
  });

  describe("selecting 'both' vs individual items", () => {
    it("selecting 'both' deselects individual mortgage", () => {
      const result = applyStep2Exclusivity([MORTGAGE], BOTH);
      expect(result).toEqual([BOTH]);
    });

    it("selecting 'both' deselects individual life insurance", () => {
      const result = applyStep2Exclusivity([LIFE_INSURANCE], BOTH);
      expect(result).toEqual([BOTH]);
    });

    it("selecting 'both' deselects both individual items", () => {
      const result = applyStep2Exclusivity(
        [MORTGAGE, LIFE_INSURANCE],
        BOTH,
      );
      expect(result).toEqual([BOTH]);
    });

    it("selecting mortgage deselects 'both'", () => {
      const result = applyStep2Exclusivity([BOTH], MORTGAGE);
      expect(result).toEqual([MORTGAGE]);
    });

    it("selecting life insurance deselects 'both'", () => {
      const result = applyStep2Exclusivity([BOTH], LIFE_INSURANCE);
      expect(result).toEqual([LIFE_INSURANCE]);
    });
  });

  describe("selecting positive options clears exclusive options", () => {
    it("selecting mortgage clears 'none'", () => {
      const result = applyStep2Exclusivity([NONE], MORTGAGE);
      expect(result).toEqual([MORTGAGE]);
    });

    it("selecting mortgage clears 'unsure'", () => {
      const result = applyStep2Exclusivity([UNSURE], MORTGAGE);
      expect(result).toEqual([MORTGAGE]);
    });

    it("selecting life insurance clears 'none'", () => {
      const result = applyStep2Exclusivity([NONE], LIFE_INSURANCE);
      expect(result).toEqual([LIFE_INSURANCE]);
    });

    it("selecting 'both' clears 'none'", () => {
      const result = applyStep2Exclusivity([NONE], BOTH);
      expect(result).toEqual([BOTH]);
    });

    it("selecting 'both' clears 'unsure'", () => {
      const result = applyStep2Exclusivity([UNSURE], BOTH);
      expect(result).toEqual([BOTH]);
    });
  });

  describe("deselecting items", () => {
    it("deselects a currently selected item", () => {
      const result = applyStep2Exclusivity([MORTGAGE, LIFE_INSURANCE], MORTGAGE);
      expect(result).toEqual([LIFE_INSURANCE]);
    });

    it("deselects 'none' when it is the only selection", () => {
      const result = applyStep2Exclusivity([NONE], NONE);
      expect(result).toEqual([]);
    });

    it("deselects 'both' when it is the only selection", () => {
      const result = applyStep2Exclusivity([BOTH], BOTH);
      expect(result).toEqual([]);
    });
  });

  describe("combining individual positive items", () => {
    it("allows mortgage and life insurance together", () => {
      const result = applyStep2Exclusivity([MORTGAGE], LIFE_INSURANCE);
      expect(result).toEqual([MORTGAGE, LIFE_INSURANCE]);
    });

    it("allows life insurance and mortgage together", () => {
      const result = applyStep2Exclusivity([LIFE_INSURANCE], MORTGAGE);
      expect(result).toEqual([LIFE_INSURANCE, MORTGAGE]);
    });
  });

  describe("starting from empty", () => {
    it("adds a single option to empty array", () => {
      expect(applyStep2Exclusivity([], MORTGAGE)).toEqual([MORTGAGE]);
    });

    it("adds 'none' to empty array", () => {
      expect(applyStep2Exclusivity([], NONE)).toEqual([NONE]);
    });

    it("adds 'both' to empty array", () => {
      expect(applyStep2Exclusivity([], BOTH)).toEqual([BOTH]);
    });
  });
});
