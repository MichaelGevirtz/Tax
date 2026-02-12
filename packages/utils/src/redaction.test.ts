import { describe, it, expect } from "vitest";
import { redact } from "./redaction";

describe("redact", () => {
  it("redacts email addresses", () => {
    expect(redact("user test@example.com data")).toBe(
      "user [REDACTED_EMAIL] data",
    );
  });

  it("redacts multiple emails", () => {
    expect(redact("a@b.com and c@d.org")).toBe(
      "[REDACTED_EMAIL] and [REDACTED_EMAIL]",
    );
  });

  it("redacts Israeli ID numbers (7-9 digits)", () => {
    expect(redact("ID: 031394828")).toBe("ID: [REDACTED_ID]");
  });

  it("does not redact short numbers", () => {
    expect(redact("code 12345")).toBe("code 12345");
  });

  it("handles strings with no PII", () => {
    expect(redact("hello world")).toBe("hello world");
  });

  it("redacts both email and ID in one string", () => {
    const result = redact("user@test.com with ID 123456789");
    expect(result).not.toContain("user@test.com");
    expect(result).not.toContain("123456789");
  });
});
