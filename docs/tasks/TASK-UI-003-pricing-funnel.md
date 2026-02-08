# TASK-UI-003 — Pricing Screen + Full Funnel Analytics + E2E QA

Owner: Dev
Loop: PIV (Plan → Implement → Validate → Iterate)
Status: PLAN
Depends on: TASK-UI-001 (scaffolding, design direction), TASK-UI-002 (pre-check flow)

---

## PLAN

### Goal

Build the pricing screen (S3), wire up full-funnel analytics verification, and perform end-to-end QA across all 4 screens (S0→S1→S2→S3).

### Pricing Screen (S3)

#### Layout

Two options displayed side-by-side on desktop, stacked on mobile. Self-serve option is visually primary (larger, highlighted, recommended badge). Service option is secondary (smaller, muted, "Coming soon").

#### Option A — Self-Serve (Primary)

- Price: placeholder (currently ~170₪, configurable — not hardcoded)
- Label: "שירות עצמי" or similar placeholder
- Feature list:
  - "הנחיה צעד אחר צעד"
  - "יצירת חבילת טופס 135"
  - "אתה מגיש בעצמך"
  - "ללא עמלת הצלחה"
- CTA: "Start" → navigates to the existing Form 106 upload flow
- Badge: "Recommended" / "מומלץ" (visually distinct)

#### Option B — Service Tier (Secondary, Coming Soon)

- Label: "שירות מלווה" or similar placeholder
- Description: "טיפול על ידי מומחים" / handled by experts
- Status: "Coming soon" / "בקרוב" — clearly marked as unavailable
- Feature list:
  - "בדיקה על ידי מומחה"
  - "ליווי אנושי"
  - "תשלום לפי תוצאה"
- CTA: "Leave details" / "השאירו פרטים" → opens a simple lead capture form (name + phone/email)
- Must NOT show specific pricing (13-20% + 250₪) until partner arrangement is confirmed
- Must clearly communicate this is a different service path, not the SaaS product

#### Lead Capture Form (for service tier)

Minimal form:
- Name (free text)
- Phone or email (one required)
- Submit button
- On submit: store locally (console.log for v1) + fire analytics event + show confirmation message ("We'll be in touch")
- Privacy note: "Your details will only be used to contact you about this service"

Note: no backend persistence for leads in v1. This is a placeholder to gauge interest.

#### Copy Constraints

- Self-serve option must NOT say "approved", "certified", "guaranteed"
- Self-serve option must say user submits themselves
- Service option must be clearly labeled as a separate, human-operated service
- Service option must NOT imply it's part of the same automated system
- No dark patterns: service option terms visible, not hidden behind clicks
- Price must be displayed clearly on the self-serve option (not revealed after click)

### Full Funnel Analytics

#### New Events (S3)

| Event | Trigger | Properties |
|-------|---------|------------|
| `pricing_viewed` | User enters S3 | `{ screen_id: "S3" }` |
| `pricing_option_selected` | User clicks on an option card (hover/focus) | `{ screen_id: "S3", option: "selfserve" \| "service" }` |
| `selfserve_cta_clicked` | User clicks self-serve CTA | `{ screen_id: "S3", option: "selfserve" }` |
| `service_lead_submitted` | User submits lead capture form | `{ screen_id: "S3", option: "service" }` |
| `service_lead_dismissed` | User closes lead form without submitting | `{ screen_id: "S3", option: "service" }` |

Privacy: lead capture data (name, phone, email) must NOT appear in analytics events.

#### Funnel Verification

Verify the complete funnel event chain fires correctly:

```
S0: page_viewed → cta_clicked (start_precheck)
S1: precheck_started → scenario_selected (×N) → precheck_completed
S2: results_viewed → proceed_to_pricing_clicked
S3: pricing_viewed → selfserve_cta_clicked OR service_lead_submitted
```

All events must carry: `flow_id` (UUID, consistent across session), `flow_name: "precheck_to_pricing_v1"`, `step_id`, `timestamp`.

#### Drop-off Detection Events

| Drop-off Point | Signal |
|----------------|--------|
| Landing abandoned | `page_viewed` (S0) without `cta_clicked` |
| Pre-check abandoned | `precheck_started` without `precheck_completed` |
| Results abandoned | `results_viewed` without `proceed_to_pricing_clicked` |
| Pricing abandoned | `pricing_viewed` without `selfserve_cta_clicked` or `service_lead_submitted` |

### Components

- **PricingCard** — Reusable card with: badge (optional), title, price (optional), feature list, CTA button. Supports `primary` and `secondary` variants. Primary variant is visually emphasized.
- **LeadCaptureForm** — Name + contact field + submit. Inline form (no modal in v1 — simpler). Shows success message after submit.
- **PricingLayout** — Container for side-by-side (desktop) / stacked (mobile) pricing cards.

### Responsive Requirements

All components must render correctly at:
- 375px (mobile) — cards stacked, self-serve on top
- 768px (tablet/iPad) — cards side-by-side or stacked (design direction dependent)
- 1280px (laptop) — cards side-by-side
- 1920px (ultra-wide) — cards side-by-side, max-width capped

### End-to-End QA

After all 3 tasks are complete, perform a full QA pass:

#### Layout & Responsive
- [ ] All 4 screens render correctly at 375px, 768px, 1280px, 1920px
- [ ] No horizontal scrolling at any breakpoint
- [ ] Content max-width capped on ultra-wide (no stretching)
- [ ] Consistent spacing rhythm across all screens

#### RTL & Hebrew
- [ ] All screens render correctly in RTL
- [ ] Hebrew text renders with correct font
- [ ] No LTR artifacts (misaligned icons, wrong text direction)
- [ ] Form inputs align correctly in RTL

#### Navigation & Flow
- [ ] S0 → S1: CTA navigates correctly
- [ ] S1 → S2: Continue navigates correctly with selected data
- [ ] S2 → S3: CTA navigates correctly
- [ ] S3 self-serve → Upload flow: CTA navigates correctly
- [ ] Back navigation works at every step (browser back button)
- [ ] Direct URL access: each route renders correctly when accessed directly

#### Copy Compliance
- [ ] No screen contains guarantee language
- [ ] No screen implies system files or submits
- [ ] Disclaimer visible on S2
- [ ] Self-serve option clearly states user submits themselves
- [ ] Service option clearly labeled as separate, human-operated
- [ ] Service option marked as "Coming soon"

#### Analytics
- [ ] All events fire with correct properties (verified in console)
- [ ] `flow_id` is consistent (same UUID) across S0→S3 in one session
- [ ] `flow_name` is "precheck_to_pricing_v1" on all events
- [ ] No PII in any event payload
- [ ] Drop-off detection: verify events do NOT fire when user abandons

#### Accessibility
- [ ] All interactive elements keyboard-accessible (Tab, Enter, Escape)
- [ ] All text meets WCAG AA contrast (4.5:1)
- [ ] All form inputs have visible labels
- [ ] Focus indicators visible on all interactive elements

### Inputs / Dependencies
- TASK-UI-001 completed: routing, shared components, analytics utility, landing page
- TASK-UI-002 completed: pre-check flow, results screen
- Skill documents:
  - `docs/ui/skill-layout-contract.md`
  - `docs/ui/skill-ui-system.md`
  - `docs/ui/skill-visual-quality.md`
  - `docs/analytics/skill-analytics-ui.md`

### Out of Scope
- Payment integration (Stripe/Tranzila)
- CRM or backend for service tier leads
- Authentication
- Real Hebrew copy (placeholder only)
- Partner agreement for service tier

---

## IMPLEMENT

### Files Touched
- `apps/web/app/pricing/page.tsx` — Replace placeholder with full S3 screen
- `apps/web/components/pricing/PricingCard.tsx`
- `apps/web/components/pricing/PricingLayout.tsx`
- `apps/web/components/pricing/LeadCaptureForm.tsx`

No other files may be modified without updating this PLAN.

---

## VALIDATE

### Validation Checklist
- [ ] Pricing screen renders correctly at all 4 breakpoints
- [ ] Self-serve option is visually primary (larger, highlighted, badge)
- [ ] Service option is visually secondary, clearly marked "Coming soon"
- [ ] Self-serve CTA navigates to upload flow
- [ ] Lead capture form submits and shows confirmation
- [ ] All copy constraints enforced (no guarantees, clear responsibility)
- [ ] All analytics events fire correctly with required properties
- [ ] Full funnel E2E QA checklist passes (see above)
- [ ] No PII in analytics
- [ ] Keyboard accessible
- [ ] WCAG AA contrast met

### Success Criteria
- Complete 4-screen funnel: Landing → Pre-check → Results → Pricing
- Self-serve path connects to existing upload flow (full user journey possible)
- Service tier captures interest without operational commitment
- All analytics events tracked for funnel measurement
- Full QA pass across all screens, devices, and compliance checks
- No violations of skill documents

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None expected (doc updates done in TASK-UI-001 prerequisites)

### Follow-ups
- Future: Payment integration task
- Future: Hebrew copy refinement task
- Future: Service tier partner integration (if validated by lead interest)
- Future: A/B testing infrastructure
- Future: Analytics provider integration (replace console.debug with real service)
- Measure: Landing → pre-check start rate, pre-check completion rate, pricing conversion to self-serve
