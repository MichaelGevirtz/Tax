import { describe, it, expect } from "vitest";
import { applyStep3Exclusivity } from "../steps/Step3PersonalCredits";

const DEGREE = "סיום תואר / לימודים אקדמיים";
const CHILDREN = "ילדים מתחת לגיל 18";
const IMMIGRANT = "עולה חדש / תושב חוזר";
const DISABILITY = "מגבלה רפואית";
const NONE = "לא רלוונטי";

describe("Step 3 exclusivity rules", () => {
  describe("selecting the negation option", () => {
    it("clears all other selections when selecting 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([DEGREE, CHILDREN, IMMIGRANT], NONE);
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

    it("selecting children clears 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([NONE], CHILDREN);
      expect(result).toEqual([CHILDREN]);
    });

    it("selecting immigrant clears 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([NONE], IMMIGRANT);
      expect(result).toEqual([IMMIGRANT]);
    });

    it("selecting disability clears 'לא רלוונטי'", () => {
      const result = applyStep3Exclusivity([NONE], DISABILITY);
      expect(result).toEqual([DISABILITY]);
    });
  });

  describe("combining positive options", () => {
    it("allows degree and children together", () => {
      const result = applyStep3Exclusivity([DEGREE], CHILDREN);
      expect(result).toEqual([DEGREE, CHILDREN]);
    });

    it("allows multiple positive options together", () => {
      let result = applyStep3Exclusivity([], DEGREE);
      result = applyStep3Exclusivity(result, CHILDREN);
      result = applyStep3Exclusivity(result, IMMIGRANT);
      expect(result).toEqual([DEGREE, CHILDREN, IMMIGRANT]);
    });

    it("allows all four positive options together", () => {
      let result = applyStep3Exclusivity([], DEGREE);
      result = applyStep3Exclusivity(result, CHILDREN);
      result = applyStep3Exclusivity(result, IMMIGRANT);
      result = applyStep3Exclusivity(result, DISABILITY);
      expect(result).toEqual([DEGREE, CHILDREN, IMMIGRANT, DISABILITY]);
    });
  });

  describe("deselecting items", () => {
    it("deselects degree from combined selection", () => {
      const result = applyStep3Exclusivity([DEGREE, CHILDREN], DEGREE);
      expect(result).toEqual([CHILDREN]);
    });

    it("deselects children from combined selection", () => {
      const result = applyStep3Exclusivity([DEGREE, CHILDREN], CHILDREN);
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
