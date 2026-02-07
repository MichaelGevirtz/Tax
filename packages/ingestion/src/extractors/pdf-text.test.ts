import { describe, it, expect } from "vitest";
import { isImageOnlyPdf, IMAGE_ONLY_THRESHOLD, type ExtractedText } from "./pdf-text";

describe("pdf-text", () => {
  describe("isImageOnlyPdf", () => {
    describe("returns true for image-only detection", () => {
      it("should return true for empty extraction", () => {
        const extracted: ExtractedText = { raw: "" };
        expect(isImageOnlyPdf(extracted)).toBe(true);
      });

      it("should return true for whitespace-only extraction", () => {
        const extracted: ExtractedText = { raw: "   \n\n\t\t   \n  " };
        expect(isImageOnlyPdf(extracted)).toBe(true);
      });

      it("should return true for extraction below default threshold", () => {
        // 49 characters is below default threshold of 50
        const extracted: ExtractedText = { raw: "a".repeat(49) };
        expect(isImageOnlyPdf(extracted)).toBe(true);
      });

      it("should return true for extraction with only control characters", () => {
        // Control characters (0x00-0x1f) don't count as meaningful
        const extracted: ExtractedText = { raw: "\x00\x01\x02\x0f\x1f".repeat(20) };
        expect(isImageOnlyPdf(extracted)).toBe(true);
      });

      it("should return true for extraction with few meaningful characters", () => {
        // 60 chars total, but only 15 meaningful (below 20 threshold)
        const extracted: ExtractedText = { raw: "a".repeat(15) + " ".repeat(45) };
        expect(isImageOnlyPdf(extracted)).toBe(true);
      });
    });

    describe("returns false for valid text extraction", () => {
      it("should return false for extraction at default threshold", () => {
        // Exactly 50 meaningful characters
        const extracted: ExtractedText = { raw: "a".repeat(50) };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should return false for extraction above default threshold", () => {
        const extracted: ExtractedText = { raw: "Form 106 - Annual Tax Statement for Employee 123456789" };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should return false for typical Form 106 content", () => {
        const extracted: ExtractedText = {
          raw: `
            Form 106 - Annual Tax Statement
            Employee ID: 123456782
            Employer ID: 987654324
            Tax Year: 2024
            Gross Income: 150000
            Tax Deducted: 25000
          `,
        };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should return false for mixed content with whitespace", () => {
        // Has enough meaningful characters (50+) despite whitespace
        const extracted: ExtractedText = { raw: "Hello World! This is a test document with enough text.\n\n\n\n" };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });
    });

    describe("custom threshold", () => {
      it("should respect custom threshold parameter", () => {
        const extracted: ExtractedText = { raw: "a".repeat(30) };

        // Below custom threshold of 40
        expect(isImageOnlyPdf(extracted, 40)).toBe(true);

        // At or above custom threshold of 30
        expect(isImageOnlyPdf(extracted, 30)).toBe(false);

        // Above custom threshold of 20
        expect(isImageOnlyPdf(extracted, 20)).toBe(false);
      });

      it("should still check meaningful characters with custom threshold", () => {
        // 100 chars total but only 10 meaningful
        const extracted: ExtractedText = { raw: "a".repeat(10) + " ".repeat(90) };

        // Even with threshold of 50, should be true because < 20 meaningful chars
        expect(isImageOnlyPdf(extracted, 50)).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle extraction with mixed whitespace types", () => {
        const extracted: ExtractedText = { raw: "  \t\n\r\n  a".repeat(25) };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should handle Hebrew text", () => {
        // Hebrew characters are meaningful - 50+ characters
        const extracted: ExtractedText = { raw: "טופס 106 - דוח שנתי לשכיר עבור שנת המס 2024 מספר מעסיק" };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should handle numeric content", () => {
        const extracted: ExtractedText = { raw: "123456789012345678901234567890123456789012345678901234567890" };
        expect(isImageOnlyPdf(extracted)).toBe(false);
      });

      it("should use IMAGE_ONLY_THRESHOLD constant correctly", () => {
        // Verify the constant is exported and has expected value
        expect(IMAGE_ONLY_THRESHOLD).toBe(50);

        // Text at threshold boundary
        const atThreshold: ExtractedText = { raw: "x".repeat(IMAGE_ONLY_THRESHOLD) };
        expect(isImageOnlyPdf(atThreshold)).toBe(false);

        const belowThreshold: ExtractedText = { raw: "x".repeat(IMAGE_ONLY_THRESHOLD - 1) };
        expect(isImageOnlyPdf(belowThreshold)).toBe(true);
      });
    });
  });
});
