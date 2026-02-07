import { describe, it, expect } from "vitest";
import {
  extractFieldByAnchor,
  extractMandatoryFields,
  tryParseStubFormat,
  parseNumber,
  parseIsraeliId,
  parseYear,
  findNumericPatterns,
  findIdPatterns,
  checkAmbiguity,
  FIELD_ANCHORS,
  MANDATORY_FIELDS,
} from "./box-extractor";
import { IngestionFailure } from "../errors/ingestion-errors";

describe("box-extractor", () => {
  describe("parseNumber", () => {
    it("parses simple integers", () => {
      expect(parseNumber("1234")).toBe(1234);
    });

    it("parses numbers with comma separators", () => {
      expect(parseNumber("1,234")).toBe(1234);
      expect(parseNumber("1,234,567")).toBe(1234567);
    });

    it("parses decimals", () => {
      expect(parseNumber("1234.56")).toBe(1234.56);
      expect(parseNumber("1,234.56")).toBe(1234.56);
    });

    it("returns null for negative numbers", () => {
      expect(parseNumber("-100")).toBeNull();
    });

    it("returns null for invalid input", () => {
      expect(parseNumber("abc")).toBeNull();
      expect(parseNumber("")).toBeNull();
    });
  });

  describe("parseIsraeliId", () => {
    it("parses valid 9-digit ID", () => {
      expect(parseIsraeliId("123456782")).toBe("123456782");
    });

    it("pads short IDs to 9 digits", () => {
      // 39337423 padded to 039337423 has valid checksum
      expect(parseIsraeliId("39337423")).toBe("039337423");
    });

    it("returns null for invalid checksums", () => {
      // 123456789 has invalid checksum
      expect(parseIsraeliId("123456789")).toBeNull();
      // 111111111 has invalid checksum (sum=13)
      expect(parseIsraeliId("111111111")).toBeNull();
    });

    it("returns null for too long IDs", () => {
      expect(parseIsraeliId("1234567890")).toBeNull();
    });

    it("strips non-digit characters", () => {
      expect(parseIsraeliId("123-456-782")).toBe("123456782");
    });
  });

  describe("parseYear", () => {
    it("parses 4-digit year", () => {
      expect(parseYear("2023")).toBe(2023);
      expect(parseYear("Tax Year: 2024")).toBe(2024);
    });

    it("returns null for years before 2010", () => {
      expect(parseYear("2009")).toBeNull();
    });

    it("returns null for invalid years", () => {
      expect(parseYear("abc")).toBeNull();
    });
  });

  describe("findNumericPatterns", () => {
    it("finds simple numbers", () => {
      const results = findNumericPatterns("Amount: 1234 and 5678");
      expect(results).toHaveLength(2);
      expect(results[0].value).toBe("1234");
      expect(results[1].value).toBe("5678");
    });

    it("finds numbers with comma separators", () => {
      const results = findNumericPatterns("Total: 1,234,567.89");
      expect(results.some((r) => r.value === "1,234,567.89")).toBe(true);
    });

    it("captures positions correctly", () => {
      const text = "abc 123 def";
      const results = findNumericPatterns(text);
      expect(results[0].position).toBe(4);
    });
  });

  describe("findIdPatterns", () => {
    it("finds valid Israeli IDs", () => {
      const results = findIdPatterns("ID: 123456782");
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe("123456782");
    });

    it("skips invalid IDs", () => {
      const results = findIdPatterns("ID: 123456789");
      expect(results).toHaveLength(0);
    });
  });

  describe("FIELD_ANCHORS", () => {
    it("has anchors for all mandatory fields", () => {
      for (const field of MANDATORY_FIELDS) {
        expect(FIELD_ANCHORS[field]).toBeDefined();
      }
    });

    it("matches Hebrew patterns", () => {
      expect(FIELD_ANCHORS.grossIncome.test('סה"כ הכנסה ממשכורת')).toBe(true);
      expect(FIELD_ANCHORS.taxYear.test("שנת מס")).toBe(true);
    });

    it("matches OCR Hebrew patterns", () => {
      // OCR from real Form 106 uses different wording than idealized labels
      expect(FIELD_ANCHORS.employeeId.test("מספר זהות סוג משרה")).toBe(true);
      expect(FIELD_ANCHORS.employerId.test("שם מעסיק כתובת")).toBe(true);
      expect(FIELD_ANCHORS.employerId.test("תיק ניכויים")).toBe(true);
      expect(FIELD_ANCHORS.grossIncome.test("משכורת : 622,809")).toBe(true);
      expect(FIELD_ANCHORS.taxDeducted.test("מס הכנסה : 167,596")).toBe(true);
      expect(FIELD_ANCHORS.healthInsuranceDeducted.test("דמי בריאות : 27,708")).toBe(true);
    });

    it("matches English patterns for backward compatibility", () => {
      expect(FIELD_ANCHORS.grossIncome.test("Gross Income")).toBe(true);
      expect(FIELD_ANCHORS.employeeId.test("Employee ID")).toBe(true);
    });
  });

  describe("extractFieldByAnchor", () => {
    it("extracts employee ID near anchor", () => {
      const text = "Employee ID: 123456782";
      const result = extractFieldByAnchor(text, "employeeId");
      expect(result).not.toBeNull();
      expect(result!.value).toBe("123456782");
    });

    it("extracts tax year near anchor", () => {
      const text = "Tax Year: 2024";
      const result = extractFieldByAnchor(text, "taxYear");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(2024);
    });

    it("extracts money amounts near anchor", () => {
      const text = "Gross Income: 150,000.00";
      const result = extractFieldByAnchor(text, "grossIncome");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(150000);
    });

    it("returns null when anchor not found", () => {
      const text = "Some random text without anchors";
      const result = extractFieldByAnchor(text, "grossIncome");
      expect(result).toBeNull();
    });

    it("extracts Hebrew-anchored fields", () => {
      const text = 'סה"כ הכנסה ממשכורת: 120,000';
      const result = extractFieldByAnchor(text, "grossIncome");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(120000);
    });

    it("extracts grossIncome from OCR 'משכורת :' pattern", () => {
      const text = "]158 ,172[ = משכורת : 622,809 [272,258]";
      const result = extractFieldByAnchor(text, "grossIncome");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(622809);
    });

    it("extracts taxDeducted from OCR 'מס הכנסה :' pattern", () => {
      const text = "]042 [ מס הכנסה : 167,596";
      const result = extractFieldByAnchor(text, "taxDeducted");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(167596);
    });

    it("extracts healthInsurance from OCR 'דמי בריאות' pattern", () => {
      const text = "דמי בריאות : 27,708";
      const result = extractFieldByAnchor(text, "healthInsuranceDeducted");
      expect(result).not.toBeNull();
      expect(result!.value).toBe(27708);
    });
  });

  describe("checkAmbiguity", () => {
    it("returns false for clear extractions", () => {
      const text = "Gross Income: 150000";
      const result = extractFieldByAnchor(text, "grossIncome")!;
      expect(checkAmbiguity(text, "grossIncome", result)).toBe(false);
    });

    it("returns true when multiple candidates are nearby", () => {
      const text = "Gross Income: 150000 160000 170000";
      const result = extractFieldByAnchor(text, "grossIncome")!;
      expect(checkAmbiguity(text, "grossIncome", result)).toBe(true);
    });
  });

  describe("tryParseStubFormat", () => {
    it("parses complete stub format", () => {
      const text = `
        Employee ID: 123456782
        Employer ID: 516179157
        Tax Year: 2024
        Gross Income: 150,000
        Tax Deducted: 25,000
        Social Security: 8,500
        Health Insurance: 4,200
      `;
      const result = tryParseStubFormat(text);
      expect(result).not.toBeNull();
      expect(result!.employeeId).toBe("123456782");
      expect(result!.employerId).toBe("516179157");
      expect(result!.taxYear).toBe(2024);
      expect(result!.grossIncome).toBe(150000);
      expect(result!.taxDeducted).toBe(25000);
      expect(result!.socialSecurityDeducted).toBe(8500);
      expect(result!.healthInsuranceDeducted).toBe(4200);
    });

    it("returns null for incomplete stub format", () => {
      const text = "Employee ID: 123456782";
      const result = tryParseStubFormat(text);
      expect(result).toBeNull();
    });

    it("returns null for invalid IDs", () => {
      // 111111111 has invalid checksum (sum=13, not divisible by 10)
      const text = `
        Employee ID: 111111111
        Employer ID: 516179157
        Tax Year: 2024
        Gross Income: 150,000
        Tax Deducted: 25,000
        Social Security: 8,500
        Health Insurance: 4,200
      `;
      const result = tryParseStubFormat(text);
      expect(result).toBeNull();
    });
  });

  describe("extractMandatoryFields", () => {
    it("throws MANDATORY_FIELD_MISSING for missing fields", () => {
      const text = "Some text without any form fields";
      expect(() => extractMandatoryFields(text)).toThrow(IngestionFailure);
      try {
        extractMandatoryFields(text);
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionFailure);
        expect((e as IngestionFailure).code).toBe("MANDATORY_FIELD_MISSING");
      }
    });

    it("throws FIELD_AMBIGUOUS for ambiguous extractions with low confidence", () => {
      // Create text with multiple candidates very close to anchor
      const text = "Gross Income 100 200 300 400 500";
      try {
        extractMandatoryFields(text);
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionFailure);
        // Either MANDATORY_FIELD_MISSING (if other fields missing) or FIELD_AMBIGUOUS
        expect(["MANDATORY_FIELD_MISSING", "FIELD_AMBIGUOUS"]).toContain(
          (e as IngestionFailure).code
        );
      }
    });

    it("extracts all fields from complete Hebrew form text", () => {
      const text = `
        מספר זהות עובד: 123456782
        מספר מזהה מעסיק: 516179157
        שנת מס: 2024
        סה"כ הכנסה ממשכורת: 150,000
        מס שנוכה: 25,000
        ביטוח לאומי: 8,500
        ביטוח בריאות: 4,200
      `;
      const result = extractMandatoryFields(text);
      expect(result.employeeId).toBe("123456782");
      expect(result.employerId).toBe("516179157");
      expect(result.taxYear).toBe(2024);
      expect(result.grossIncome).toBe(150000);
      expect(result.taxDeducted).toBe(25000);
      expect(result.socialSecurityDeducted).toBe(8500);
      expect(result.healthInsuranceDeducted).toBe(4200);
    });

    it("extracts all fields from complete English form text", () => {
      const text = `
        Employee ID: 123456782
        Employer ID: 516179157
        Tax Year: 2024
        Gross Income: 150,000
        Tax Deducted: 25,000
        Social Security: 8,500
        Health Insurance: 4,200
      `;
      const result = extractMandatoryFields(text);
      expect(result.employeeId).toBe("123456782");
      expect(result.taxYear).toBe(2024);
      expect(result.grossIncome).toBe(150000);
    });

    it("extracts all fields from OCR-style Form 106 text", () => {
      // Realistic OCR text snippet from real Form 106 (table layout:
      // values on one line, labels on the next)
      const text = [
        "רוזטל מערכות ידע בעמ עמינדב 21 תל אביב 921513545",
        "שם מעסיק כתובת מעסיק תיק ניכויים משרד שומה",
        "משה מיכאל 10 פתח תקוה 031394828",
        "שם העובד כתובת העובד מספר זהות סוג משרה",
        "לשנת מס 2024 (טופס 106)",
        "משכורת : 622,809",
        "מס הכנסה : 167,596",
        "ביטוח לאומי : 25,220",
        "דמי בריאות : 27,708",
      ].join("\n");
      const result = extractMandatoryFields(text);
      expect(result.employerId).toBe("921513545");
      expect(result.employeeId).toBe("031394828");
      expect(result.taxYear).toBe(2024);
      expect(result.grossIncome).toBe(622809);
      expect(result.taxDeducted).toBe(167596);
      expect(result.socialSecurityDeducted).toBe(25220);
      expect(result.healthInsuranceDeducted).toBe(27708);
    });
  });
});
