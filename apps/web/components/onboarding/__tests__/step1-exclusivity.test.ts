import { describe, it, expect } from "vitest";
import { applyStep1Exclusivity } from "../steps/Step1Employment";

const SALARY_CHANGE = "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)";
const JOB_CHANGE = "החלפת מקום עבודה";
const MULTIPLE_EMPLOYERS = "עבודה אצל יותר ממעסיק אחד באותה שנה";
const NO_WORK = "תקופה ללא עבודה / עבודה חלקית";
const NO_CHANGE = "לא זכור לי שינוי משמעותי";

describe("Step 1 exclusivity rules", () => {
  describe("selecting the negation option", () => {
    it("clears all other selections when selecting 'no change'", () => {
      const result = applyStep1Exclusivity(
        [SALARY_CHANGE, JOB_CHANGE],
        NO_CHANGE,
      );
      expect(result).toEqual([NO_CHANGE]);
    });

    it("clears a single positive selection", () => {
      const result = applyStep1Exclusivity([SALARY_CHANGE], NO_CHANGE);
      expect(result).toEqual([NO_CHANGE]);
    });

    it("clears all four positive selections", () => {
      const result = applyStep1Exclusivity(
        [SALARY_CHANGE, JOB_CHANGE, MULTIPLE_EMPLOYERS, NO_WORK],
        NO_CHANGE,
      );
      expect(result).toEqual([NO_CHANGE]);
    });
  });

  describe("selecting positive options clears negation", () => {
    it("selecting salary change clears 'no change'", () => {
      const result = applyStep1Exclusivity([NO_CHANGE], SALARY_CHANGE);
      expect(result).toEqual([SALARY_CHANGE]);
    });

    it("selecting job change clears 'no change'", () => {
      const result = applyStep1Exclusivity([NO_CHANGE], JOB_CHANGE);
      expect(result).toEqual([JOB_CHANGE]);
    });

    it("selecting multiple employers clears 'no change'", () => {
      const result = applyStep1Exclusivity([NO_CHANGE], MULTIPLE_EMPLOYERS);
      expect(result).toEqual([MULTIPLE_EMPLOYERS]);
    });

    it("selecting no work clears 'no change'", () => {
      const result = applyStep1Exclusivity([NO_CHANGE], NO_WORK);
      expect(result).toEqual([NO_WORK]);
    });
  });

  describe("combining positive options", () => {
    it("allows multiple positive options together", () => {
      const result = applyStep1Exclusivity([SALARY_CHANGE], JOB_CHANGE);
      expect(result).toEqual([SALARY_CHANGE, JOB_CHANGE]);
    });

    it("allows three positive options together", () => {
      let result = applyStep1Exclusivity([], SALARY_CHANGE);
      result = applyStep1Exclusivity(result, JOB_CHANGE);
      result = applyStep1Exclusivity(result, NO_WORK);
      expect(result).toEqual([SALARY_CHANGE, JOB_CHANGE, NO_WORK]);
    });
  });

  describe("deselecting items", () => {
    it("deselects a positive option", () => {
      const result = applyStep1Exclusivity(
        [SALARY_CHANGE, JOB_CHANGE],
        SALARY_CHANGE,
      );
      expect(result).toEqual([JOB_CHANGE]);
    });

    it("deselects the negation option", () => {
      const result = applyStep1Exclusivity([NO_CHANGE], NO_CHANGE);
      expect(result).toEqual([]);
    });

    it("deselects last remaining positive option", () => {
      const result = applyStep1Exclusivity([SALARY_CHANGE], SALARY_CHANGE);
      expect(result).toEqual([]);
    });
  });

  describe("starting from empty", () => {
    it("adds a positive option to empty array", () => {
      expect(applyStep1Exclusivity([], SALARY_CHANGE)).toEqual([
        SALARY_CHANGE,
      ]);
    });

    it("adds negation option to empty array", () => {
      expect(applyStep1Exclusivity([], NO_CHANGE)).toEqual([NO_CHANGE]);
    });
  });
});
