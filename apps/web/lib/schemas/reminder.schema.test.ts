import { describe, it, expect } from "vitest";
import { reminderRequestSchema } from "./reminder.schema";

const VALID = {
  email: "user@example.com",
  wizardState: {
    employmentChanges: ["החלפת מקום עבודה"],
    mortgageAndLifeInsurance: ["לא היה לי"],
    personalCredits: ["לא רלוונטי"],
    additionalIncome: ["לא היו לי הכנסות נוספות"],
    years: [2024],
  },
  softResult: {
    canProceedToUpload: true,
    confidence: "medium" as const,
    reasons: ["החלפת מקום עבודה"],
  },
};

describe("reminderRequestSchema", () => {
  it("accepts a valid request", () => {
    const result = reminderRequestSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = reminderRequestSchema.safeParse({
      ...VALID,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _, ...rest } = VALID;
    const result = reminderRequestSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid confidence value", () => {
    const result = reminderRequestSchema.safeParse({
      ...VALID,
      softResult: { ...VALID.softResult, confidence: "extreme" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-number years", () => {
    const result = reminderRequestSchema.safeParse({
      ...VALID,
      wizardState: { ...VALID.wizardState, years: ["2024"] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing wizardState fields", () => {
    const result = reminderRequestSchema.safeParse({
      ...VALID,
      wizardState: { employmentChanges: [] },
    });
    expect(result.success).toBe(false);
  });
});
