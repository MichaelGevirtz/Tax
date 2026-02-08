# TASK-UI-001 — Landing Page + Project Scaffolding + Design Direction

Owner: Dev
Loop: PIV (Plan → Implement → Validate → Iterate)
Status: PLAN

## Prerequisites

Before implementation begins:
1. Update `docs/product/decision-log.md` — record strategy change: service tier (commission-based, partner-operated) is now an approved future option alongside the self-serve SaaS model.
2. Update `docs/product/rejected-ideas.md` — amend "Service-First Model" rejection to clarify: rejected as the *primary* model, but approved as a secondary partner-operated tier labeled "Coming soon."
3. Update `docs/product/project-context.md` — add service tier as a future revenue path under Revenue Model, with explicit constraints (partner-operated, not in-house, no power of attorney by us).

---

## PLAN

### Goal

Deliver 3 deliverables:

1. **Design direction options** — Present 3 visual design directions and 3 UX layout approaches for the user to choose from before any implementation.
2. **Project scaffolding** — Set up routing, shared UI primitives, analytics utility, RTL/Hebrew font infrastructure, and responsive breakpoint system.
3. **Marketing landing page (S0)** — First screen of the conversion funnel, built with the chosen design direction.

### Phase 1: Design Direction (before code)

#### 3 Visual Design Directions

Research and present 3 distinct visual directions. Each must:
- Comply with `docs/ui/skill-visual-quality.md` (fintech-grade, calm, trustworthy)
- Work in Hebrew/RTL
- Include: color palette concept, typography approach, surface/card style, overall mood
- Be presented as a short written description with reference examples (existing sites or screenshots)

Directions should range across the spectrum of "calm professional" — e.g.:
- Direction A: Minimal/clean (lots of white, thin lines, maximum air)
- Direction B: Warm/approachable (soft colors, rounded surfaces, friendly but professional)
- Direction C: Bold/confident (stronger contrast, defined sections, authoritative feel)

User selects one before implementation proceeds.

#### 3 UX Layout Approaches

Research and present 3 approaches for the full S0→S3 funnel structure:
- Approach 1: Single-page scroll (landing + pre-check + results + pricing all on one long page with anchor navigation)
- Approach 2: Multi-page flow (each screen is a separate route, linear progression)
- Approach 3: Hybrid (landing is a scroll page, pre-check onward is a stepped flow on separate routes)

Each approach should note: pros, cons, mobile behavior, and how it affects analytics tracking.

User selects one before implementation proceeds.

### Phase 2: Scaffolding

#### Routing Setup
- Set up Next.js App Router routes for the funnel:
  - `/` — Landing page (S0)
  - `/precheck` — Pre-check (S1) [placeholder for TASK-UI-002]
  - `/results` — Results (S2) [placeholder for TASK-UI-003]
  - `/pricing` — Pricing (S3) [placeholder for TASK-UI-003]
- Connect to existing upload flow route (for self-serve CTA → upload handoff)

#### Responsive Breakpoint System
Extend `docs/ui/skill-layout-contract.md` breakpoints to cover all device classes:

| Breakpoint | Name | Min Width | Target |
|------------|------|-----------|--------|
| `sm` | Mobile | 0px | Phones (320px–639px) |
| `md` | Tablet | 640px | iPad, tablets (640px–1023px) |
| `lg` | Desktop | 1024px | Laptops (1024px–1439px) |
| `xl` | Ultra-wide | 1440px | Large monitors, ultra-wide |

Rules:
- Mobile-first: base styles target mobile
- Ultra-wide: content max-width capped (no stretching beyond `max-content-width`)
- All screens must be tested at: 375px (mobile), 768px (tablet), 1280px (laptop), 1920px (ultra-wide)

#### Shared Primitives
Create reusable components needed across all funnel screens:
- **DisclaimerBlock** — Reusable disclaimer with configurable text. Always visible, not dismissible.
- **CTABar** — Primary + optional secondary button. Sticky on mobile, static on desktop. Per `skill-ui-system.md`.
- **SectionContainer** — Enforces max-width, padding, and spacing per layout contract.

#### Analytics Utility
Create a minimal analytics event dispatcher:
- Conforms to `docs/analytics/skill-analytics-ui.md` schema
- Required properties on every event: `flow_id` (UUID, generated per session), `flow_name` (static string per funnel), `step_id`, `timestamp`
- Optional properties: `screen_id`, `error_code`, `locale`, `is_rtl`
- Privacy: utility must never accept PII fields (no ID, no amounts — enforce via type contract)
- v1 implementation: log events to `console.debug` (no external analytics provider yet)

#### RTL / Hebrew Infrastructure
- Ensure `<html dir="rtl" lang="he">` is set globally
- Hebrew font loaded and working (Noto Sans Hebrew or system Hebrew font)
- Verify logical CSS properties are used (no hardcoded `left`/`right`)

### Phase 3: Landing Page (S0)

Build the marketing landing page using the selected design direction and layout approach.

#### Sections (minimum)

**Hero**
- Value proposition headline (placeholder Hebrew)
- Subheading: brief explainer
- Primary CTA: "בדיקה קצרה — האם כדאי לבדוק החזר מס?" (or similar placeholder)
- Secondary CTA: anchor to "How it works" section

**Trust Signals Row**
- 3–4 badges/icons: "שירות עצמי", "ללא עמלת הצלחה", "אתה שולט בתהליך", "מאובטח"
- Privacy one-liner

**How It Works**
- 3–4 steps visual: Pre-check → Upload 106 → Generate 135 → Submit yourself
- Brief description per step

**FAQ Accordion**
- "האם מובטח לי החזר?" → No, this is an indicative check...
- "האם אתם מגישים בשבילי?" → No, you submit yourself...
- "אילו מסמכים צריך?" → Form 106 from your employer...
- "כמה זה עולה?" → Placeholder pricing info
- Placeholder Hebrew for all answers

**Footer**
- Privacy policy link (placeholder)
- Terms of service link (placeholder)
- Copyright

#### Copy Constraints (enforced on S0)
- Never say: "מגיע לך החזר", "אנחנו נגיש בשבילך"
- Use: "ייתכן שמגיע לך", "כדאי לבדוק", "הבדיקה הסופית מתבצעת על סמך טופס 106"
- No guarantees, no implied filing, no tax advice

#### Analytics Events (S0)
- `page_viewed` — on page load. Properties: `{ screen_id: "S0" }`
- `cta_clicked` — on any CTA click. Properties: `{ screen_id: "S0", cta_id: "start_precheck" | "how_it_works" }`
- `faq_opened` — on FAQ item expand. Properties: `{ screen_id: "S0", faq_id: string }`

### Inputs / Dependencies
- Skill documents:
  - `docs/ui/skill-layout-contract.md`
  - `docs/ui/skill-ui-system.md`
  - `docs/ui/skill-visual-quality.md`
  - `docs/analytics/skill-analytics-ui.md`
- Existing Next.js app at `apps/web/`

### Out of Scope
- Pre-check questionnaire (TASK-UI-002)
- Results screen (TASK-UI-002)
- Pricing screen (TASK-UI-003)
- Payment integration
- Authentication
- Real Hebrew copy (placeholder only)
- External analytics provider integration

---

## IMPLEMENT

### Files Touched

Phase 1 (design direction):
- No code files — design direction document only

Phase 2 (scaffolding):
- `apps/web/app/layout.tsx` — RTL, Hebrew font, global frame
- `apps/web/app/page.tsx` — Landing page route
- `apps/web/app/precheck/page.tsx` — Placeholder route
- `apps/web/app/results/page.tsx` — Placeholder route
- `apps/web/app/pricing/page.tsx` — Placeholder route
- `apps/web/lib/analytics.ts` — Analytics event dispatcher
- `apps/web/components/shared/DisclaimerBlock.tsx`
- `apps/web/components/shared/CTABar.tsx`
- `apps/web/components/shared/SectionContainer.tsx`
- `docs/ui/skill-layout-contract.md` — Add `xl` breakpoint

Phase 3 (landing page):
- `apps/web/components/landing/HeroSection.tsx`
- `apps/web/components/landing/TrustSignals.tsx`
- `apps/web/components/landing/HowItWorks.tsx`
- `apps/web/components/landing/FAQAccordion.tsx`
- `apps/web/components/landing/Footer.tsx`

No other files may be modified without updating this PLAN.

---

## VALIDATE

### Validation Checklist
- [ ] Design direction: 3 visual options presented, user selected one
- [ ] UX layout: 3 approaches presented, user selected one
- [ ] Landing page renders correctly at all 4 breakpoints (375px, 768px, 1280px, 1920px)
- [ ] RTL: all content right-aligned, no layout breaks, logical CSS properties used
- [ ] Hebrew font loads and renders correctly
- [ ] All sections present: Hero, Trust Signals, How It Works, FAQ, Footer
- [ ] Primary CTA navigates to `/precheck`
- [ ] FAQ accordion opens/closes correctly
- [ ] Copy scan: no forbidden claims (no guarantees, no implied filing)
- [ ] Analytics: `page_viewed`, `cta_clicked`, `faq_opened` events fire with correct properties in console
- [ ] Analytics: no PII in any event payload
- [ ] Placeholder routes (`/precheck`, `/results`, `/pricing`) render without error
- [ ] Shared components (DisclaimerBlock, CTABar, SectionContainer) render correctly in isolation
- [ ] Keyboard accessible: all interactive elements reachable via Tab
- [ ] Contrast: text meets WCAG AA (4.5:1)

### Success Criteria
- Deployable landing page that looks fintech-grade on all devices
- Routing infrastructure ready for TASK-UI-002 and TASK-UI-003
- Analytics utility functional and type-safe
- No violations of skill documents

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- decision-log.md — service tier strategy change
- rejected-ideas.md — amended service model rejection
- project-context.md — service tier added as future path
- skill-layout-contract.md — `xl` breakpoint added

### Follow-ups
- TASK-UI-002: Pre-check + educational results
- TASK-UI-003: Pricing + full funnel analytics
- Future: Hebrew copy refinement task
- Future: External analytics provider integration
