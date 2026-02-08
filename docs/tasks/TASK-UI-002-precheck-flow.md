# TASK-UI-002 — Pre-check Flow + Educational Results

Owner: Dev
Loop: PIV (Plan → Implement → Validate → Iterate)
Status: PLAN
Depends on: TASK-UI-001 (scaffolding, shared components, analytics utility, design direction)

---

## PLAN

### Goal

Build the pre-check flow (S1) and educational results screen (S2). The pre-check helps users understand whether it's worth checking for a tax refund — it does NOT predict eligibility or calculate amounts.

This is educational framing, not a classifier. There are no "positive/unlikely" outputs. The result screen explains common refund scenarios and directs the user to proceed with Form 106 upload for a real check.

### Screens

#### S1 — Pre-check (Educational)

The exact format (questionnaire vs. checklist vs. interactive guide) was deferred to the UX layout decision in TASK-UI-001. Implement whichever approach was selected.

Regardless of format, the content must:

- Present common scenarios that typically lead to tax refunds for Israeli employees:
  - Changed jobs during the year
  - Worked only part of the year
  - Had significant life events (marriage, new child, divorce)
  - Completed a degree or professional certification
  - Made pension/life insurance contributions not reflected in employer withholding
  - Had investment income (stocks, interest) with tax withheld
- Allow the user to indicate which scenarios apply to them (checkboxes, yes/no, or similar)
- Include tax year selection (default: last 6 years, per open-questions.md)
- Must NOT ask for: Israeli ID, salary amounts, employer name, or any PII
- Must NOT request Form 106 at this stage

Copy constraints:
- Frame as "common reasons people check for refunds" — not "reasons you're eligible"
- Never say: "מגיע לך החזר", "אתה זכאי"
- Use: "כדאי לבדוק", "ייתכן שרלוונטי", "מצבים שעשויים להוביל להחזר"

#### S2 — Educational Results

After completing the pre-check, the user sees an educational summary.

**Content structure:**
- Summary of scenarios the user indicated as relevant
- For each relevant scenario: short explanation of *why* it might lead to a refund (1–2 sentences, plain Hebrew)
- Clear next step: "To check if you're actually eligible, upload your Form 106"
- If no scenarios selected: "Based on your answers, a refund is less likely — but uploading Form 106 is the only way to know for sure"

**Mandatory elements:**
- Disclaimer block (using shared DisclaimerBlock component):
  - "אין באמור ייעוץ מס"
  - "הבדיקה הסופית מתבצעת על סמך טופס 106"
- CTA: "Continue to pricing" → navigates to `/pricing`
- Secondary CTA: "Learn more about Form 106" (links to FAQ or help content — placeholder link for v1)

**Must NOT include:**
- Refund amount estimates
- Probability percentages
- "You are eligible" / "You are not eligible" language
- Traffic-light or score-based indicators (no green/yellow/red)

### Components

Build on shared components from TASK-UI-001. New components:

- **PrecheckForm** — Container for the pre-check interaction (format per UX decision). Supports RTL. Collects scenario selections without PII.
- **ScenarioCard** — Individual scenario item (icon + title + short description + selection control). Reusable across checklist/questionnaire formats.
- **ResultsSummary** — Displays selected scenarios with educational explanations. Read-only.
- **TaxYearSelector** — Year selection (multi-select or range). Default: last 6 years. Renders correctly in RTL.

### Analytics Events

#### S1 — Pre-check
| Event | Trigger | Properties |
|-------|---------|------------|
| `precheck_started` | User enters S1 | `{ screen_id: "S1" }` |
| `scenario_selected` | User selects/deselects a scenario | `{ screen_id: "S1", scenario_id: string, selected: boolean }` |
| `tax_years_selected` | User confirms year selection | `{ screen_id: "S1", years_count: number }` |
| `precheck_completed` | User clicks continue | `{ screen_id: "S1", scenarios_selected_count: number, years_count: number }` |

#### S2 — Results
| Event | Trigger | Properties |
|-------|---------|------------|
| `results_viewed` | User enters S2 | `{ screen_id: "S2", scenarios_count: number }` |
| `proceed_to_pricing_clicked` | User clicks CTA to pricing | `{ screen_id: "S2" }` |
| `learn_more_clicked` | User clicks secondary CTA | `{ screen_id: "S2" }` |

Privacy: no PII in events. `scenario_id` is a structural identifier (e.g., "job_change"), not user-entered text.

### Responsive Requirements

All components must render correctly at:
- 375px (mobile)
- 768px (tablet/iPad)
- 1280px (laptop)
- 1920px (ultra-wide)

ScenarioCards: single column on mobile, 2-column grid on tablet+.

### Inputs / Dependencies
- TASK-UI-001 completed: routing, shared components, analytics utility, design direction, RTL infrastructure
- Skill documents:
  - `docs/ui/skill-layout-contract.md`
  - `docs/ui/skill-ui-system.md`
  - `docs/ui/skill-visual-quality.md`
  - `docs/analytics/skill-analytics-ui.md`

### Out of Scope
- Pricing screen (TASK-UI-003)
- Form 106 upload flow (existing, separate)
- Any tax calculation logic
- Authentication
- Payment
- Real Hebrew copy (placeholder only)

---

## IMPLEMENT

### Files Touched
- `apps/web/app/precheck/page.tsx` — Replace placeholder with full S1 screen
- `apps/web/app/results/page.tsx` — Replace placeholder with full S2 screen
- `apps/web/components/precheck/PrecheckForm.tsx`
- `apps/web/components/precheck/ScenarioCard.tsx`
- `apps/web/components/precheck/TaxYearSelector.tsx`
- `apps/web/components/results/ResultsSummary.tsx`

No other files may be modified without updating this PLAN.

---

## VALIDATE

### Validation Checklist
- [ ] S1 renders correctly at all 4 breakpoints (375px, 768px, 1280px, 1920px)
- [ ] S2 renders correctly at all 4 breakpoints
- [ ] RTL: all content right-aligned, scenario cards and form elements align correctly
- [ ] User can select/deselect scenarios
- [ ] User can select tax years
- [ ] Continue button navigates to `/pricing`
- [ ] Results screen shows only selected scenarios with educational text
- [ ] Results screen shows disclaimer (always visible, not dismissible)
- [ ] "No scenarios selected" state renders correctly with appropriate message
- [ ] Copy scan: no eligibility claims, no guarantees, no PII collection
- [ ] Analytics: all events fire with correct properties in console
- [ ] Analytics: no PII in event payloads
- [ ] Analytics: `scenario_id` values are structural identifiers, not user text
- [ ] Keyboard accessible: all interactive elements reachable via Tab
- [ ] Navigation: S0 → S1 → S2 flow works end-to-end

### Success Criteria
- Educational pre-check flow that informs without misleading
- Clean handoff to pricing screen (TASK-UI-003)
- All analytics events tracked for funnel measurement
- No violations of skill documents or copy constraints

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None expected

### Follow-ups
- TASK-UI-003: Pricing screen + full funnel QA
- Future: Hebrew copy refinement
- Future: Scenario content review with tax domain expert
