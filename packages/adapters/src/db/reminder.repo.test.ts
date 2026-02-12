import { describe, it, expect } from "vitest";
import { isTokenExpired } from "./reminder.repo";

describe("isTokenExpired", () => {
  it("returns false for a token created now", () => {
    expect(isTokenExpired(new Date())).toBe(false);
  });

  it("returns false for a token created 29 days ago", () => {
    const date = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    expect(isTokenExpired(date)).toBe(false);
  });

  it("returns true for a token created 31 days ago", () => {
    const date = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    expect(isTokenExpired(date)).toBe(true);
  });

  it("returns true for a token created 365 days ago", () => {
    const date = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    expect(isTokenExpired(date)).toBe(true);
  });
});
