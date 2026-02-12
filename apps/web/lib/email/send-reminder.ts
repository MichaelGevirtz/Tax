import { Resend } from "resend";
import { redact } from "../../../../packages/utils/src/redaction";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.REMINDER_FROM_EMAIL ?? "noreply@taxback.co.il";

function buildReminderHtml(returnUrl: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, Helvetica, sans-serif; direction: rtl; text-align: right; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    השלמת את השאלון ונמצאו סימנים אפשריים לזכאות להחזר מס.
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    כדי להמשיך, יש להעלות טופס 106 (סיכום שכר שנתי).
  </p>

  <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px;">
    איך משיגים טופס 106?
  </p>
  <ul style="font-size: 15px; line-height: 1.8; padding-inline-start: 20px; margin: 0 0 24px;">
    <li>ממערכת השכר של המעסיק</li>
    <li>פנייה למחלקת שכר / HR</li>
    <li>מרואה החשבון של המעסיק</li>
  </ul>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${returnUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
      חזרה לבדיקה
    </a>
  </div>

  <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 24px 0 0;">
    מייל זה נשלח פעם אחת בלבד. לא נשלח מיילים נוספים.
  </p>

</body>
</html>`;
}

export async function sendReminderEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://taxback.co.il";
  const returnUrl = `${baseUrl}/return/${token}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "תזכורת: בדיקת החזר מס — השלב הבא",
      html: buildReminderHtml(returnUrl),
    });
    return true;
  } catch (error) {
    console.error(
      `[reminder] Failed to send email to ${redact(email)}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}
