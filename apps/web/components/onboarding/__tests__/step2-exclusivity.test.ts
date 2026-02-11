import { describe, it, expect } from "vitest";
import { applyStep2Exclusivity } from "../steps/Step2MortgageInsurance";

const MORTGAGE = "משכנתא";
const LIFE_INSURANCE = "ביטוח חיים פרטי";
const NONE = "לא היה לי";
const UNSURE = "לא בטוח";

describe("Step 2 exclusivity rules", () => {
  describe("selecting exclusive options", () => {
    it("selecting 'none' clears all other selections", () => {
      const result = applyStep2Exclusivity([MORTGAGE, LIFE_INSURANCE], NONE);
      expect(result).toEqual([NONE]);
    });

    it("selecting 'unsure' clears all other selections", () => {
      const result = applyStep2Exclusivity([MORTGAGE], UNSURE);
      expect(result).toEqual([UNSURE]);
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

    it("selecting life insurance clears 'unsure'", () => {
      const result = applyStep2Exclusivity([UNSURE], LIFE_INSURANCE);
      expect(result).toEqual([LIFE_INSURANCE]);
    });
  });

  describe("combining positive options (multi-select)", () => {
    it("allows mortgage and life insurance together", () => {
      const result = applyStep2Exclusivity([MORTGAGE], LIFE_INSURANCE);
      expect(result).toEqual([MORTGAGE, LIFE_INSURANCE]);
    });

    it("allows life insurance and mortgage together", () => {
      const result = applyStep2Exclusivity([LIFE_INSURANCE], MORTGAGE);
      expect(result).toEqual([LIFE_INSURANCE, MORTGAGE]);
    });

    it("both selected individually replaces 'both' option behavior", () => {
      let result = applyStep2Exclusivity([], MORTGAGE);
      result = applyStep2Exclusivity(result, LIFE_INSURANCE);
      expect(result).toEqual([MORTGAGE, LIFE_INSURANCE]);
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

    it("deselects 'unsure' when it is the only selection", () => {
      const result = applyStep2Exclusivity([UNSURE], UNSURE);
      expect(result).toEqual([]);
    });
  });

  describe("starting from empty", () => {
    it("adds a single option to empty array", () => {
      expect(applyStep2Exclusivity([], MORTGAGE)).toEqual([MORTGAGE]);
    });

    it("adds 'none' to empty array", () => {
      expect(applyStep2Exclusivity([], NONE)).toEqual([NONE]);
    });

    it("adds 'unsure' to empty array", () => {
      expect(applyStep2Exclusivity([], UNSURE)).toEqual([UNSURE]);
    });
  });
});
