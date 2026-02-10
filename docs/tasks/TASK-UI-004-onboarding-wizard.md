# TASK-UI-004 – Replace /precheck with 5-Step Onboarding Wizard

## Status: PLAN

## PLAN

### Goal
Replace the existing `/precheck` screen (legacy multi-card checklist from TASK-UI-002) with a new **5-step onboarding wizard** (one question per screen, Hebrew RTL).

On wizard completion, navigate directly to the Form 106 upload route.

Remove the legacy `/results` page and all related components/code — the wizard replaces both screens.

This task is **UI + routing + analytics + cleanup only**.
No eligibility calculation. No payment. No 106 parsing. No Form 135 generation.

### Inputs
- Wizard content v1.2 (defined in this TASK below)
- Existing landing page CTA routing
- Existing design system (CSS Modules + CSS custom properties, RTL, Noto Sans Hebrew)
- Analytics contract from `apps/web/lib/analytics.ts`

### Outputs
- 5-step wizard UI at `/precheck` (replaces legacy content in-place)
- Analytics events fired at each step + completion
- Clean removal of legacy precheck + results code
- Client state preserved across wizard steps (in-memory + optional localStorage)

### Constraints
- **Business**: No refund amounts/ranges or outcome guarantees anywhere in the wizard (Payment Flow Guardrails — AGENTS.md)
- **Business**: "Why" text is educational only — must not imply eligibility or promise
- **Technical**: Hebrew RTL, CSS Modules + custom properties (no Tailwind), logical CSS properties
- **Technical**: Next.js 16 App Router, `"use client"` components where needed
- **Decision D amendment**: The original Decision D (Refund-Likelihood Gate) routed to eligibility → payment → upload. This TASK amends the flow: wizard completion routes **directly to upload**. Payment gate placement will be addressed in a future TASK.
- **Ref**: `docs/product/decision-log.md` — Option D (Refund-Likelihood Gate)
- **Ref**: `.claude/AGENTS.md` — Payment Flow Guardrails

### Open Questions
None — all review questions resolved (see Review Decisions below).

### Review Decisions (Q1–Q6)

| # | Topic | Decision | Detail |
|---|-------|----------|--------|
| Q1 | Flow target | Wizard → upload directly | Decision D flow amended; payment gate deferred to future TASK |
| Q2 | /results cleanup | Delete | Remove `/results` page, `ResultsContent.tsx`, `ResultsSummary.tsx` + CSS, and all dead imports |
| Q3 | Step 2 exclusivity | "גם...וגם" standalone | Mutually exclusive with individual "משכנתא" and "ביטוח חיים" items. "לא היה לי" and "לא בטוח" exclusive with all others |
| Q4 | Step 3 select mode | Single-select | Accept data loss by design — trust-building step, not exhaustive data capture |
| Q5 | Analytics | In this TASK | Events defined and implemented alongside UI code in the same TASK |
| Q6 | "Why" text display | Show on selection | "Why" explanation appears only after user selects an option in that step |

---

## Wizard Content (v1.2 — Reviewed)

### Step 1 — שינוי בתבנית ההעסקה או השכר
**Type:** multi-select (≥ 1 required)

**Question:**
> האם במהלך אחת מהשנים שבחרת היה שינוי בתבנית ההעסקה או השכר שלך?

**Options:**
- שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)
- החלפת מקום עבודה
- עבודה אצל יותר ממעסיק אחד באותה שנה
- תקופה ללא עבודה / עבודה חלקית
- לא זכור לי שינוי משמעותי

**Why** (shown after any option is selected):
> מס הכנסה מחשב מס לפי הנחת הכנסה חודשית אחידה לאורך השנה. שינויים בשכר או בתעסוקה עלולים ליצור פער בין המס שנוכה בפועל לבין המס הנדרש.

**Validation:** ≥ 1 option selected. "המשך" disabled until valid.

---

### Step 2 — משכנתא וביטוח חיים
**Type:** multi-select with exclusivity rules (≥ 1 required)

**Question:**
> האם באחת מהשנים היה לך אחד מהדברים הבאים?

**Options:**
- משכנתא
- ביטוח חיים פרטי (שאינו חלק ממשכנתא)
- גם משכנתא וגם ביטוח חיים פרטי
- לא היה לי אף אחד מאלה
- לא בטוח

**Exclusivity rules:**
- Selecting **"גם משכנתא וגם ביטוח חיים פרטי"** → deselects "משכנתא" and "ביטוח חיים פרטי" (and vice versa: selecting either individual item deselects the combined option)
- Selecting **"לא היה לי אף אחד מאלה"** → deselects all other options
- Selecting **"לא בטוח"** → deselects all other options
- Selecting any positive option → deselects "לא היה לי" and "לא בטוח"

**Why** (shown after any option is selected):
> במקרים כאלה קיימים לעיתים תשלומים שעשויים לזכות בהטבות מס, אך הם לא תמיד מנוצלים אוטומטית ודורשים בדיקה יזומה.

**Validation:** ≥ 1 option selected + exclusivity enforced. "המשך" disabled until valid.

---

### Step 3 — נקודות זיכוי והטבות אישיות
**Type:** single-select (exactly 1 required)

**Question:**
> האם יש לך נקודות זיכוי או הטבות אישיות שייתכן שלא נוצלו?

**Options:**
- סיימתי תואר / לימודים אקדמיים
- יש לי נקודות זיכוי אישיות (ילדים מתחת לגיל 18, מגבלה, עולה חדש וכד׳)
- לא רלוונטי

**Why** (shown after any option is selected):
> נקודות זיכוי והטבות אישיות אינן תמיד מחושבות במלואן דרך המעסיק.

**Validation:** exactly 1 selected. "המשך" disabled until valid.

---

### Step 4 — הכנסות נוספות מעבר לתלוש השכר
**Type:** single-select (exactly 1 required)

**Question:**
> האם היו לך הכנסות נוספות מעבר לתלוש השכר?

**Options:**
- רווחים משוק ההון
- הכנסה משכר דירה
- הכנסה נוספת אחרת
- לא היו לי הכנסות נוספות

**Why** (shown after any option is selected):
> הכנסות נוספות משפיעות על חישוב המס הכולל, גם כאשר חלקן פטור ממס או ממוסה בשיעור קבוע.

**Validation:** exactly 1 selected. "המשך" disabled until valid.

---

### Step 5 — בחירת שנות הבדיקה
**Type:** multi-select (≥ 1 required)

**Question:**
> לאילו שנים תרצה לבדוק?

**Options:** 2020, 2021, 2022, 2023, 2024, 2025

**Helper text:**
> כל שנה נבדקת בנפרד לפי הנתונים שלה.

**Validation:** ≥ 1 year selected. "המשך" / "סיום" disabled until valid.

**Note:** No "Why" text for this step — it's self-explanatory.

---

## State Model (Client)

Store in client state (React state / context). Optionally persist to localStorage under key `taxback_precheck_v1`.

```ts
interface WizardState {
  employmentChanges: string[];          // Step 1
  mortgageAndLifeInsurance: string[];   // Step 2
  personalCredits: "degree" | "credits" | "none" | null;  // Step 3
  additionalIncome: "capital_markets" | "rent" | "other" | "none" | null;  // Step 4
  years: number[];                      // Step 5
}
```

---

## Analytics Events

All events use the existing `trackEvent()` from `apps/web/lib/analytics.ts`. Extend the typed properties as needed.

| Event | When | Properties |
|-------|------|------------|
| `wizard_started` | Step 1 mounts (once) | `step_id: "step_1"`, `screen_id: "wizard"` |
| `wizard_step_completed` | User clicks "המשך" on any step | `step_id`, `step_number`, `selections_count` |
| `wizard_step_back` | User clicks back | `step_id`, `from_step_number` |
| `wizard_completed` | User clicks final CTA on Step 5 | `total_steps: 5`, `years_count`, `total_selections` |
| `wizard_abandoned` | User navigates away mid-wizard (beforeunload or route change) | `last_step_id`, `last_step_number` |

---

## Routing Requirements

1. Landing page CTA **"לבדוק עכשיו"** → `/precheck` (same route, new content)
2. Wizard completion → navigate to existing Form 106 upload page
3. Wizard state preserved across steps (in-memory; optional localStorage backup)
4. Back button within wizard navigates to previous step (not browser back)

---

## Cleanup Requirements (Non-negotiable)

Remove legacy code from TASK-UI-002:

### Delete entirely:
- `apps/web/app/results/page.tsx`
- `apps/web/app/results/ResultsContent.tsx`
- `apps/web/components/results/ResultsSummary.tsx`
- `apps/web/components/results/ResultsSummary.module.css`
- `apps/web/components/precheck/PrecheckForm.tsx`
- `apps/web/components/precheck/PrecheckForm.module.css`
- `apps/web/components/precheck/ScenarioCard.tsx`
- `apps/web/components/precheck/ScenarioCard.module.css`
- `apps/web/components/precheck/TaxYearSelector.tsx`
- `apps/web/components/precheck/TaxYearSelector.module.css`
- `apps/web/lib/precheck-scenarios.ts`

### Modify:
- `apps/web/app/precheck/page.tsx` — replace content with wizard
- `apps/web/lib/analytics.ts` — update/extend typed event properties for wizard events

### Verify after cleanup:
- No dead imports remain
- Build passes (`next build`)
- Lint passes
- No unused CSS modules

---

## IMPLEMENT

### Files Touched

**New files:**
- `apps/web/components/onboarding/OnboardingWizard.tsx` — main wizard container + step navigation
- `apps/web/components/onboarding/OnboardingWizard.module.css`
- `apps/web/components/onboarding/steps/Step1Employment.tsx`
- `apps/web/components/onboarding/steps/Step2MortgageInsurance.tsx`
- `apps/web/components/onboarding/steps/Step3PersonalCredits.tsx`
- `apps/web/components/onboarding/steps/Step4AdditionalIncome.tsx`
- `apps/web/components/onboarding/steps/Step5TaxYears.tsx`
- `apps/web/components/onboarding/steps/steps.module.css` (shared step styles)
- `apps/web/components/onboarding/WizardOption.tsx` — reusable option card (checkbox/radio)
- `apps/web/components/onboarding/WizardOption.module.css`
- `apps/web/components/onboarding/WhyBlock.tsx` — conditional "why" explanation block
- `apps/web/components/onboarding/WhyBlock.module.css`
- `apps/web/lib/wizard-state.ts` — state type + localStorage helper
- `apps/web/components/onboarding/__tests__/wizard-validation.test.ts`
- `apps/web/components/onboarding/__tests__/step2-exclusivity.test.ts`

**Modified files:**
- `apps/web/app/precheck/page.tsx` — replace with wizard entry
- `apps/web/lib/analytics.ts` — extend event types for wizard events

**Deleted files:** (see Cleanup Requirements above)

---

## VALIDATE

### Validation Artifacts
- Unit test: `wizard-validation.test.ts` — per-step validation (min selections, single-select enforcement)
- Unit test: `step2-exclusivity.test.ts` — all exclusivity rule combinations
- Manual: verify Hebrew RTL rendering, "Why" appears on selection, "המשך" disabled states
- Build: `next build` passes with no errors
- Lint: no lint errors or unused imports

### Success Criteria
- Clicking "לבדוק עכשיו" renders the 5-step wizard (not legacy checklist)
- Each step shows one question, validates before allowing "המשך"
- Step 2 exclusivity rules work correctly
- "Why" text appears only after user selects an option
- Wizard completion navigates to Form 106 upload route
- All legacy `/precheck` and `/results` code is removed
- No refund amounts, ranges, or outcome guarantees appear anywhere
- Analytics events fire at each step transition
- All tests pass, build passes, lint passes

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- decision-log.md — update Decision D to note wizard → upload flow amendment
- None other expected

### Follow-ups
- TASK for payment gate placement in the upload → Form 135 flow
- TASK for localStorage recovery UX (resume wizard after page close)
