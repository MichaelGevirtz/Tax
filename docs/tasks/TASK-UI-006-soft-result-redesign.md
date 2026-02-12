# TASK-UI-006 — Soft Result Screen Redesign (Task A: Frontend)

## Goal

Replace the current `/soft-result` screen with a conversion-optimized redesign that:
1. Shows an animated confidence ring instead of a text badge
2. Splits the CTA into two fork cards: "Upload now" vs. "Remind me later" (email capture)
3. Adds a collapsible "How to get Form 106" guide
4. Cleans up unused code from the old implementation

**Reference mock:** `mock-soft-result.html` (approved, open in browser to see all states)

**Dependency:** The email submit calls `POST /api/reminder` — this task creates a **stub endpoint** that returns 200 but does nothing. TASK-018 replaces it with real persistence + email sending.

---

## In Scope

1. Rewrite `apps/web/components/onboarding/SoftResult.tsx`
2. Rewrite `apps/web/components/onboarding/SoftResult.module.css`
3. Create stub API endpoint `apps/web/app/api/reminder/route.ts`
4. Update analytics events
5. Clean up unused code from the old SoftResult
6. Update `docs/product/decision-log.md` — amend email capture policy

---

## Out of Scope (Hard)

- Real email sending (TASK-018)
- Server-side wizard state persistence (TASK-018)
- Tokenized return links (TASK-018)
- Soft evaluator logic changes (`soft-evaluator.ts` stays as-is)
- Payment flow, parsing, or auth changes
- New Prisma models or DB schema

---

## Screen Structure (Eligible State: `canProceedToUpload = true`)

Top to bottom, matching the mock exactly:

### 1. Confidence Ring
- SVG circle with `stroke-dasharray`/`stroke-dashoffset` animation
- Draws from 0 to target over 600ms ease-out
- Ring fill % and color by confidence:
  - `high`: ~85% fill, green (`--color-success`)
  - `medium`: ~60% fill, amber (`--color-warning`)
  - `low`: ~35% fill, gray (`--color-text-secondary`)
- Label inside ring fades in at 400ms:
  - `high` → "סיכוי גבוה"
  - `medium` → "סיכוי בינוני"
  - `low` → "סיכוי קיים" (NOT "סיכוי נמוך" — reframing)

### 2. Title (fade-in, 200ms delay)
```
לפי התשובות שלך, קיימים מצבים שעשויים להוביל להחזר מס
```

### 3. Reason Bullets (stagger fade-in, 50ms gap, starts 500ms)
- Render from `result.reasons[]` (existing evaluator output)
- Checkmark icon + text per reason
- Cap at 4 items (evaluator already caps at 5, display cap at 4)

### 4. Transparency Line (fade-in, 600ms)
```
האימות הסופי מבוסס על נתוני טופס 106 בלבד.
```
One line, centered, secondary text color. Not a block.

### 5. Fork Cards (fade-in + translateY 8px→0, 800ms)

Two cards side by side (desktop), stacked (mobile <640px):

**Card A — Primary ("יש לי טופס 106")**
- Upload icon (document + arrow)
- Title: יש לי טופס 106
- Subtitle: אפשר להעלות עכשיו ולקבל תוצאה תוך דקות
- CTA button (primary blue): העלאת טופס 106
- `onClick` → navigate to `/upload-106`

**Card B — Secondary ("עדיין אין לי את הטופס")**
- Envelope icon
- Title: עדיין אין לי את הטופס
- Subtitle: נשלח תזכורת עם הוראות פשוטות להשגת הטופס
- Email form:
  - Input: `type="email"`, `dir="ltr"`, placeholder `your@email.com`
  - Validation error: "נא להזין כתובת מייל תקינה"
  - Submit button: "שליחת תזכורת"
  - Privacy micro-text: "לא נשלח ספאם. תזכורת אחת בלבד."
- On submit:
  - Client-side email validation (regex)
  - Button shows "שולח..." + disabled state
  - POST to `/api/reminder` with `{ email, wizardState, softResult }`
  - On success (or stub 200): hide form, show success state
- Success state (replaces form in-place):
  - Green checkmark with scaleIn animation (300ms)
  - "התזכורת נשלחה"
  - "שלחנו מייל עם קישור חזרה והוראות להשגת טופס 106 מהמעסיק"

### 6. Guide Toggle (fade-in, 1000ms)
- Button: "איך משיגים טופס 106?" + chevron
- On click: slide-down expand (200ms), chevron rotates 180°
- Content (3 items):
  - **ממערכת השכר של המעסיק** — חלק מהמעסיקים מנפיקים דרך פורטל עובדים
  - **פנייה למחלקת שכר / HR** — בדרך כלל מספיק מייל קצר
  - **מרואה החשבון של המעסיק** — אם המעסיק משתמש ברו"ח חיצוני

### 7. Back Link (fade-in, 1100ms)
- "חזרה לשאלון" → clears soft result, navigates to `/precheck`

---

## Screen Structure (Not Eligible: `canProceedToUpload = false`)

Minimal. No fork cards, no email capture, no guide.

1. Empty ring (background circle only) with X icon centered
2. Title: "לפי התשובות שלך, לא זוהו סימנים ברורים לזכאות"
3. Body: "התוצאה מבוססת על השאלון בלבד. ייתכן שיש מידע נוסף שלא בא לידי ביטוי בתשובות."
4. Primary CTA: "לעדכן תשובות" → `/precheck`
5. Secondary text link: "לבדוק שנה אחרת" → `/precheck` (step 5)

---

## Animation Spec

| Element | Type | Duration | Delay |
|---|---|---|---|
| Confidence ring | stroke-dashoffset draw | 600ms ease-out | 0ms |
| Ring label | fade-in | 200ms | 400ms |
| Title | fade-in | 250ms | 200ms |
| Reason bullets | stagger fadeSlideIn | 200ms each | 50ms gap, starts 500ms |
| Transparency line | fade-in | 200ms | 600ms |
| Fork cards | fadeSlideIn (Y 8→0) | 300ms | 800ms |
| Guide toggle | fade-in | 200ms | 1000ms |
| Back link | fade-in | 200ms | 1100ms |
| Email success check | scaleIn (0.5→1) | 300ms | on submit |

**Forbidden:** confetti, bounce, sound, emoji, parallax, auto-playing video.

**Required:** `@media (prefers-reduced-motion: reduce)` kills all animations.

---

## Stub API Endpoint

Create `apps/web/app/api/reminder/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  // Stub — TASK-018 replaces with real persistence + email
  return NextResponse.json({ ok: true });
}
```

The frontend should still send the full payload shape so TASK-018 only needs to add server-side handling:

```typescript
// Request body shape (sent by frontend, ignored by stub)
{
  email: string;
  wizardState: WizardState;
  softResult: SoftResult;
}
```

---

## Analytics Events

### New events (add to existing `trackEvent` calls):
- `soft_result_upload_clicked` — user clicks "העלאת טופס 106" card
  - `{ confidence, reasons_count }`
- `soft_result_reminder_submitted` — email form submitted successfully
  - `{ confidence }`
- `soft_result_reminder_validation_failed` — invalid email submitted
  - `{ confidence }`
- `soft_result_guide_expanded` — user opens the 106 guide
  - `{ confidence }`

### Keep from TASK-016:
- `flow_soft_result_viewed`
- `flow_soft_result_not_eligible_viewed`
- `flow_soft_result_back_clicked`

### Remove:
- `flow_soft_result_proceed_clicked` — replaced by `soft_result_upload_clicked`

---

## Cleanup (Old Code to Remove)

From `SoftResult.tsx`:
- Remove `CONFIDENCE_LABELS` map (replaced by ring labels)
- Remove `CONFIDENCE_STYLES` map (replaced by ring color classes)
- Remove `CheckIcon` inline SVG (replaced by component-level icon)
- Remove `handleSaveAndLeave` function (no longer exists as an action)
- Remove `CTABar` import (fork cards replace it)

From `SoftResult.module.css`:
- Remove `.badge`, `.badgeHigh`, `.badgeMedium`, `.badgeLow` (replaced by ring)
- Remove `.ctaSubtext` (no longer exists)
- Rewrite entirely — the mock CSS is the target

---

## Files Touched

| File | Action |
|---|---|
| `apps/web/components/onboarding/SoftResult.tsx` | Rewrite |
| `apps/web/components/onboarding/SoftResult.module.css` | Rewrite |
| `apps/web/app/api/reminder/route.ts` | Create (stub) |
| `apps/web/lib/analytics.ts` | Add new event types if using typed events |
| `apps/web/app/soft-result/page.tsx` | No change expected |
| `docs/product/decision-log.md` | Amend (see below) |

**Do NOT touch:**
- `apps/web/lib/soft-evaluator.ts`
- `apps/web/lib/wizard-state.ts`
- Payment, auth, parsing, or DB schema

---

## Decision Log Amendment

Add to `docs/product/decision-log.md`:

```
## 2026-02-12 – Opt-in Email Capture at Soft Result (Remind Later)

Decision:
Users who cannot upload Form 106 immediately may opt-in to provide
their email on the soft-result screen to receive a reminder.

Constraints:
- Email capture is opt-in only (secondary path, not required).
- Users who upload immediately still do not provide email until after parsing.
- No marketing emails. Single reminder only.
- Email is PII — stored with @pii annotation (TASK-018).

Reason:
Users who complete the wizard but lack Form 106 at hand are the highest-intent
non-converters. Without a return mechanism, they are lost. Email capture
enables a single reminder with instructions on how to obtain Form 106.
```

---

## Acceptance Criteria

1. Eligible screen matches `mock-soft-result.html` for all three confidence levels
2. Not-eligible screen shows minimal state without fork cards
3. Confidence ring animates correctly (draw + label fade)
4. Email form validates, submits to stub, shows success state
5. Guide expands/collapses with chevron rotation
6. All animations respect `prefers-reduced-motion`
7. Responsive: fork cards stack on mobile (<640px), ring shrinks
8. Old badge/CTA code fully removed
9. Analytics events fire correctly
10. TypeScript typechecks pass
11. Decision log updated

---

## Validate

- Open `/soft-result` with high-confidence evaluator result → ring draws to ~85%, 3+ reasons, fork cards visible
- Open with medium → ring ~60%, amber
- Open with low → ring ~35%, gray, label says "סיכוי קיים"
- Open with not-eligible → minimal screen, no fork, no guide
- Submit valid email → stub returns 200 → success state shown
- Submit invalid email → red border + error message
- Click guide → expands with 3 items
- Resize to mobile → cards stack, ring shrinks
- Enable `prefers-reduced-motion` → no animations
