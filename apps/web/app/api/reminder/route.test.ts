import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock the adapters
vi.mock("@tax/adapters", () => ({
  findRecentReminderByEmail: vi.fn(),
  createReminder: vi.fn(),
  setReminderSentAt: vi.fn(),
}));

// Mock the email sender
vi.mock("../../../lib/email/send-reminder", () => ({
  sendReminderEmail: vi.fn().mockResolvedValue(true),
}));

// Mock redaction (simple passthrough for tests)
vi.mock("../../../../../packages/utils/src/redaction", () => ({
  redact: (s: string) => "[REDACTED]",
}));

import {
  findRecentReminderByEmail,
  createReminder,
  setReminderSentAt,
} from "@tax/adapters";
import { sendReminderEmail } from "../../../lib/email/send-reminder";

const VALID_BODY = {
  email: "test@example.com",
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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (findRecentReminderByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (createReminder as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rem_1",
      token: "tok_abc123",
      email: "test@example.com",
    });
    (setReminderSentAt as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (sendReminderEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  describe("validation", () => {
    it("returns 400 for invalid email", async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing email", async () => {
      const { email: _, ...noEmail } = VALID_BODY;
      const res = await POST(makeRequest(noEmail));
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing wizardState", async () => {
      const { wizardState: _, ...noWizard } = VALID_BODY;
      const res = await POST(makeRequest(noWizard));
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing softResult", async () => {
      const { softResult: _, ...noResult } = VALID_BODY;
      const res = await POST(makeRequest(noResult));
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid confidence enum", async () => {
      const res = await POST(
        makeRequest({
          ...VALID_BODY,
          softResult: { ...VALID_BODY.softResult, confidence: "extreme" },
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("rate limiting", () => {
    it("returns 429 when email already has a recent reminder", async () => {
      (
        findRecentReminderByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "rem_existing",
        email: "test@example.com",
        createdAt: new Date(),
      });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(429);
      expect(createReminder).not.toHaveBeenCalled();
    });
  });

  describe("successful creation", () => {
    it("returns 200 and creates reminder for valid request", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);

      expect(createReminder).toHaveBeenCalledWith({
        email: "test@example.com",
        wizardState: VALID_BODY.wizardState,
        softResult: VALID_BODY.softResult,
      });
    });

    it("sends email after creating reminder", async () => {
      await POST(makeRequest(VALID_BODY));

      expect(sendReminderEmail).toHaveBeenCalledWith(
        "test@example.com",
        "tok_abc123",
      );
      expect(setReminderSentAt).toHaveBeenCalledWith("rem_1");
    });

    it("still returns 200 if email send fails", async () => {
      (sendReminderEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
      expect(setReminderSentAt).not.toHaveBeenCalled();
    });
  });
});
