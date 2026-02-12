import { NextRequest, NextResponse } from "next/server";
import { reminderRequestSchema } from "../../../lib/schemas/reminder.schema";
import {
  findRecentReminderByEmail,
  createReminder,
  setReminderSentAt,
} from "@tax/adapters";
import { sendReminderEmail } from "../../../lib/email/send-reminder";
import { redact } from "../../../../../packages/utils/src/redaction";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = reminderRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { email, wizardState, softResult } = parsed.data;

    // Rate limit: max 1 reminder per email per 24h
    const existing = await findRecentReminderByEmail(email);
    if (existing) {
      console.info(
        `[reminder] Rate limited: ${redact(email)} already has a recent reminder`,
      );
      return NextResponse.json(
        { ok: false, error: "Rate limited" },
        { status: 429 },
      );
    }

    // Create reminder record
    const reminder = await createReminder({ email, wizardState, softResult });

    // Send email (fire-and-forget from UX perspective)
    const sent = await sendReminderEmail(email, reminder.token);
    if (sent) {
      await setReminderSentAt(reminder.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[reminder] Unexpected error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
