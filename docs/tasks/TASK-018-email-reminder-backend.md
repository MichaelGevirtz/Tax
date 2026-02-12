# TASK-018 — Email Reminder Backend (Task B)

## Goal

Replace the stub `/api/reminder` endpoint (from TASK-UI-006) with real functionality:
1. Persist email + wizard state server-side
2. Generate a tokenized return link
3. Send a single reminder email with 106 retrieval instructions
4. Handle return-link resolution (restore wizard state)

**Depends on:** TASK-UI-006 (stub endpoint + frontend already shipping)

---

## In Scope

1. Replace stub `apps/web/app/api/reminder/route.ts` with real handler
2. Add Prisma model for reminder records
3. Generate a unique return token per submission
4. Create return-link resolution endpoint or page
5. Send one transactional email (reminder + 106 guide + return link)
6. Rate-limit: max 1 reminder per email per 24h
7. PII handling: email marked `@pii`, redacted in logs

---

## Out of Scope (Hard)

- Marketing emails or drip sequences
- Account creation or login
- Changing the soft-result frontend (already done in TASK-UI-006)
- Payment flow
- Analytics dashboards

---

## Data Model

New Prisma model:

```prisma
model Reminder {
  id           String      @id @default(cuid())
  email        String      // @pii
  token        String      @unique @default(cuid())
  wizardState  Json        // Steps 1–5 answers
  softResult   Json        // { canProceedToUpload, confidence, reasons }
  sentAt       DateTime?
  returnedAt   DateTime?   // set when user clicks return link
  createdAt    DateTime    @default(now())

  @@index([email])
  @@index([token])
}
```

---

## API: POST /api/reminder

### Request Body
```typescript
{
  email: string;       // validated server-side
  wizardState: WizardState;
  softResult: SoftResult;
}
```

### Behavior
1. Validate email format (Zod schema)
2. Check rate limit: if a Reminder with this email exists and `createdAt` < 24h ago → return `429`
3. Create `Reminder` row with generated `token`
4. Queue/send reminder email (see Email section)
5. Return `{ ok: true }`

### Error Responses
- `400` — invalid email or missing fields
- `429` — rate limited (already sent within 24h)
- `500` — internal error

---

## Return Link Resolution

### Route: `/return/[token]`

Page at `apps/web/app/return/[token]/page.tsx`:

1. Look up `Reminder` by `token`
2. If not found or expired (>30 days) → redirect to `/precheck`
3. If found:
   - Set `returnedAt = now()` on the record
   - Write `wizardState` to localStorage (via client-side hydration)
   - Write `softResult` to localStorage
   - Redirect to `/soft-result` (user sees their previous result, can proceed to upload)

### Token Expiry
- Tokens are valid for 30 days from `createdAt`
- After 30 days, redirect to `/precheck` (user restarts wizard)
- No cleanup cron needed in v1 — just check on access

---

## Reminder Email

### Subject
```
תזכורת: בדיקת החזר מס — השלב הבא
```

### Body (HTML, RTL)

Content sections:
1. **Opening:** "השלמת את השאלון ונמצאו סימנים אפשריים לזכאות להחזר מס."
2. **Next step:** "כדי להמשיך, יש להעלות טופס 106 (סיכום שכר שנתי)."
3. **How to get 106:** (same 3 items as the on-screen guide)
   - ממערכת השכר של המעסיק
   - פנייה למחלקת שכר / HR
   - מרואה החשבון של המעסיק
4. **Return CTA button:** "חזרה לבדיקה" → links to `/return/[token]`
5. **Footer:** "מייל זה נשלח פעם אחת בלבד. לא נשלח מיילים נוספים."

### Email Provider
Use the email provider already configured in the project. If none exists, use Resend (simplest transactional email API, free tier sufficient for v1).

### Sending
- Send immediately on POST (no queue in v1)
- Set `sentAt` after successful send
- If send fails, still return 200 to user (fire-and-forget from UX perspective), log error

---

## PII Handling

- `email` field in Prisma: marked `// @pii`
- `wizardState` JSON may contain selections (not directly PII, but treat as sensitive)
- Logging: never log raw email — use `redact()` from `/packages/utils/src/redaction.ts`
- The `token` in the return URL is opaque (cuid) — not reversible to email

---

## Validation Schema

Create Zod schema for the request body:

```typescript
// apps/web/lib/schemas/reminder.schema.ts
import { z } from "zod";

export const reminderRequestSchema = z.object({
  email: z.string().email(),
  wizardState: z.object({
    employmentChanges: z.array(z.string()),
    mortgageAndLifeInsurance: z.array(z.string()),
    personalCredits: z.array(z.string()),
    additionalIncome: z.array(z.string()),
    years: z.array(z.number()),
  }),
  softResult: z.object({
    canProceedToUpload: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
    reasons: z.array(z.string()),
  }),
});
```

---

## Files Touched

| File | Action |
|---|---|
| `apps/web/app/api/reminder/route.ts` | Rewrite (replace stub) |
| `apps/web/app/return/[token]/page.tsx` | Create |
| `apps/web/lib/schemas/reminder.schema.ts` | Create |
| `prisma/schema.prisma` | Add Reminder model |
| Email template file (location TBD by provider) | Create |
| `packages/utils/src/redaction.ts` | Add email pattern if missing |

**Do NOT touch:**
- `SoftResult.tsx` (already updated by TASK-UI-006)
- `soft-evaluator.ts`
- Payment, auth, or parsing

---

## Analytics Events

- `reminder_email_sent` — server-side, after successful send
  - `{ confidence }`
- `reminder_email_rate_limited` — server-side, when 429 returned
- `reminder_return_link_clicked` — when return page loads with valid token
  - `{ confidence, days_since_created }`
- `reminder_return_link_expired` — when token is >30 days old

---

## Acceptance Criteria

1. POST `/api/reminder` with valid email → creates Reminder row, sends email, returns 200
2. POST with same email within 24h → returns 429
3. POST with invalid email → returns 400
4. Email arrives with correct Hebrew content, return link, and 106 guide
5. Clicking return link → restores wizard state in localStorage → redirects to `/soft-result`
6. Expired token (>30 days) → redirects to `/precheck`
7. Email field marked `@pii` in Prisma
8. No raw email in logs
9. TypeScript typechecks pass
10. Tests for: API validation, rate limiting, token resolution, token expiry

---

## Validate

- Submit email via soft-result screen → check inbox → email arrives with correct content
- Click return link in email → lands on `/soft-result` with previous confidence/reasons
- Submit same email again within 24h → frontend should handle 429 gracefully (show message like "כבר שלחנו תזכורת. ניתן לבדוק בתיבת המייל")
- Wait >30 days (or manually expire token) → return link redirects to `/precheck`

---

## Notes

- v1 sends immediately (no queue). If email volume grows, add a queue later.
- No unsubscribe needed — this is a single transactional email, not marketing.
- The frontend (TASK-UI-006) already sends the full payload. This task only adds server-side handling.
