# TASK-016 — Post-Wizard Soft Result Screen + Upload Gating

## Goal
After the user completes Wizard Steps 1–5, show a **Soft Result** screen that:
1) summarizes the user’s answers (“reasons”),  
2) outputs a **binary decision**: proceed to 106 upload **only if** user is likely eligible,  
3) shows **qualitative confidence** (High/Med/Low),  
4) shows **no monetary amounts**, and  
5) does not require login/email.

This task creates the missing post-wizard decision point that TASK-017 depends on.

---

## In Scope
1. Add a new screen shown immediately after Step 5 completion:
   - Route/page: `soft-result` (name per repo conventions)
2. Implement a **Soft Eligibility Evaluator** based only on Steps 1–5 answers:
   - Output:
     - `canProceedToUpload: boolean`
     - `confidence: "high" | "medium" | "low"`
     - `reasons: string[]` (Hebrew strings mapped to selected answers)
3. UI behavior:
   - If `canProceedToUpload = true`:
     - show CTA that navigates to the next step (placeholder for TASK-017 106 upload route)
   - If `canProceedToUpload = false`:
     - do NOT show upload CTA
     - show “not likely eligible” messaging + a safe next action (see Copy)
4. Persist the wizard state (answers + selected years) into the session/state used by the flow, so later tasks can use it.

---

## Out of Scope (Hard)
- No 106 upload screen (TASK-017).
- No parsing/OCR/extraction.
- No email capture.
- No payment flow or account creation.
- No “verified eligibility”.
- No WhatsApp/support.
- No showing refund amounts or ranges.
- No new tax calculation engine. This is a **heuristic gate**, not a deterministic computation.

---

## Soft Eligibility Evaluator (Heuristic Rules)

### Inputs
Wizard Steps 1–5 selections, including selected years.

### Required Outputs
- `canProceedToUpload`:
  - True if user indicated at least one “refund-prone” scenario.
  - False only if user explicitly indicates “nothing relevant” across steps.
- `confidence`:
  - High if multiple strong signals selected.
  - Medium if one strong signal or multiple weak signals.
  - Low if only weak signals but still potentially eligible.
- `reasons[]`:
  - 2–5 short Hebrew bullet strings explaining why the system thinks there may be eligibility, derived from their selections.

### “Refund-prone” signals (initial)
Treat as **strong** signals:
- Worked for multiple employers in a year
- Period without work / partial year employment
- Significant salary change during year
- Eligible credits (degree, children, etc.)
- Mortgage / life insurance (if user selected)

Treat as **weak** signals:
- “Not sure” selections
- Generic “other income” without details

### Default
- If user selected “no changes / not relevant” everywhere:
  - `canProceedToUpload = false`
  - `confidence = "low"`
  - reasons explain “based on your answers… less likely…”.

> Keep rules simple and transparent. We will improve with data later.

---

## UX / Copy Requirements (Hebrew)

### If canProceedToUpload = true
Title:
- **נראה שיש סיכוי להחזר מס**

Confidence label:
- **סיכוי גבוה / בינוני / נמוך** (mapped from confidence enum)

Reasons:
- Bullet list: derived from `reasons[]`

CTA:
- **אימות עם טופס סיכום שכר**  
Subtext (one line):
- **כדי לאמת ולחשב במדויק נבקש טופס סיכום שכר שנתי (מכונה גם 106).**

No mention of Form 135.

### If canProceedToUpload = false
Title:
- **לפי התשובות שלך, לא נראה שיש זכאות להחזר מס**

Body:
- Explain this is based on questionnaire only and may be incomplete.

Primary action:
- **לבדוק שנה אחרת / לעדכן תשובות** (go back to wizard)
Secondary:
- **לשמור ולחזור אחר כך** (if you have such mechanism; otherwise route to landing)

Do NOT ask for 106 upload here.

---

## Routing
Current:
Landing → Steps 1–5 → (end or existing next)

Target:
Landing → Steps 1–5 → **Soft Result Screen**
- If proceed: CTA goes to `/upload-106` (route can be placeholder until TASK-017 exists)
- If not: CTA routes back to wizard

---

## Data / State
- Store wizard answers + selected years in existing session/state.
- Store `softResult` object:
  - `canProceedToUpload`
  - `confidence`
  - `reasons[]`

No DB schema changes unless unavoidable.

---

## Analytics / Logging (Minimal)
Emit:
- `flow_soft_result_viewed`
- `flow_soft_result_proceed_clicked` (only when canProceedToUpload=true)
- `flow_soft_result_back_clicked`
- `flow_soft_result_not_eligible_viewed`

---

## Files Touched (Expected)
- Wizard completion handler / final step navigation
- New Soft Result page/component
- New soft evaluator module (pure function) + unit tests
- Session/state persistence module (only minimal additions)

**Do NOT touch:**
- Auth
- Payment
- Parsing
- Tax calculation engine beyond heuristic gate

---

## Acceptance Criteria
1. Completing Step 5 always leads to the Soft Result screen.
2. Soft Result shows:
   - Binary eligibility direction (proceed vs not)
   - Confidence label (High/Med/Low)
   - Reasons derived from answers
3. Users only see “Proceed to 106 verification” CTA when `canProceedToUpload=true`.
4. No monetary amounts/ranges shown anywhere.
5. Events are emitted.

---

## Validate
- Case A (strong): multiple employers + partial year → canProceedToUpload=true, confidence=high
- Case B (weak): only “not sure” → canProceedToUpload=true, confidence=low (still allow)
- Case C (none): “no changes” across all steps → canProceedToUpload=false
- Ensure navigation works and state persists.

---

## Notes / Guardrails
- This is intentionally heuristic. Do not over-engineer.
- Keep evaluator pure and testable.
- Keep copy short and non-legalistic.
