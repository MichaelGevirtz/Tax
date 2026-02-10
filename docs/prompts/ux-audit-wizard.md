# UX Audit Prompt: Onboarding Wizard Steps 1–5

## Your Role

You are a senior UX architect conducting a visual, interaction, and psychological audit of a 5-step onboarding wizard for a Hebrew (RTL) tax refund SaaS product. The wizard currently looks and feels like a government form — functional but lifeless. Your job is to propose a modern, trust-building redesign that feels like a guided conversation, not a bureaucratic questionnaire.

## Context

- **Product:** Self-serve SaaS that helps Israeli salaried employees generate Form 135 tax refund filings
- **Stage audited:** Initial needs-assessment only. No pricing, no payment, no refund amounts shown at this stage.
- **Goal of this stage:** Make the user feel accurately understood and mapped — without friction or tax knowledge required.
- **User profile:** Users arrive cold from Google (SEO-only traffic). Zero brand trust. They're typically anxious about tax topics, unsure if they qualify, and skeptical of online tax tools.
- **Current problem:** The wizard UI looks dated — plain vertical text lists with checkboxes, no visual hierarchy, no icons, no personality. It functions correctly but feels like a government form, not a modern fintech product. We need a design that is both **modern** and **trust-building** simultaneously.
- **Competitor benchmark:** See `docs/product/finupp.pdf` — a competitor with a much more modern onboarding flow. Key patterns they use:
  - **Card/tile grid layout** (3-column) instead of vertical list
  - **Icons on each option** (small illustrative icons per tile)
  - **Selected state** uses bold color fill (not just a checkbox tick)
  - **Clean white card** floating on a background image/gradient
  - **Conversational, step-by-step progression** (not form-like)
  - **Celebratory results page** with illustration + large text
  - **Overall feel:** spacious, visual, confidence-building

## Task

1. **Read all files listed below** to understand the current implementation
2. **Read the competitor PDF** to understand the design benchmark
3. **Read the UI specs** to understand constraints and principles
4. **Produce a detailed UX audit** covering:

### A. Psychological Purpose Audit
For each of the 5 steps, answer:
- **Does this screen serve a single, clear psychological purpose?** If not — identify confusion or redundancy.
- **Where does the user have to "think too hard"?** (tax knowledge, certainty, fear of being wrong)
- **Where does the flow feel like a form instead of a guided conversation?**
- **What selections feel risky or irreversible to the user — and why?**
- **What happens emotionally if the user answers "no" to everything?** Is this handled safely or does it feel like rejection?

### B. Trust & Drop-Off Risk Analysis
- Where is the user most likely to abandon? Why?
- Which screens create anxiety or uncertainty?
- Does the UI communicate "we understand you" or "fill out this form"?
- How does each screen build (or erode) trust for a cold Google visitor?
- Is the cognitive load appropriate for someone with zero tax knowledge?

### C. Visual Gap Analysis (Current vs. Modern)
For each of the 5 steps, identify:
- What looks dated and why
- What the competitor does better visually
- Specific CSS/layout changes needed (be concrete — reference CSS properties, not abstract advice)

### D. Interaction Pattern Audit
- Option selection UX (checkbox list vs. card grid vs. pill buttons)
- Selected/unselected state transitions
- WhyBlock presentation (inline accordion? tooltip? side panel?)
- Acknowledgment line presentation
- Progress indicator style (dots vs. numbered stepper vs. progress bar)
- CTA bar visual weight and positioning

### E. Visual Design Recommendations
For each recommendation, specify:
- **What to change** (concrete CSS/component change)
- **Why** (which dated pattern it replaces)
- **How** (specific implementation — grid layout, card padding, border-radius, shadow, color, icon approach)
- **Risk** (what could go wrong, what to test)

### F. Component-Level Redesign Spec
For each component that needs changes, provide:
- Current state description
- Target state description
- CSS changes needed (exact properties)
- HTML/JSX structure changes if needed
- Whether new assets (icons, illustrations) are required

### G. Mobile-First Considerations
- How the grid/card layout adapts to mobile
- Touch target sizes
- Sticky CTA behavior
- Scroll behavior on small screens

### H. Emotional Safety Analysis
- What does the "negative path" feel like? (user selects all negation options across all 5 steps)
- Does the flow make the user feel judged for not having changes/credits/income?
- Is there reassurance that "no" answers are normal and valid?
- Does the final state feel like progress or like "you don't qualify"?

## Constraints (Do NOT Violate)

- **No calculation logic changes** — this is visual/UX only
- **No new libraries** unless absolutely necessary (prefer CSS-only solutions)
- **RTL-first** — all layout must use logical properties (no hardcoded left/right)
- **Accessibility** — maintain WCAG 2.1 AA (focus-visible, aria roles, contrast)
- **Trust-first copy** — no marketing language, no outcome promises, no refund amounts
- **Hebrew text** — all user-facing copy stays in Hebrew
- **CSS Modules** — the project uses CSS Modules, not Tailwind
- **CSS custom properties** — use existing design tokens from globals.css
- Follow specs in `docs/ui/` — they are the behavioral and visual contract

## Files to Read

### Current Wizard Implementation (READ ALL)
```
apps/web/components/onboarding/OnboardingWizard.tsx
apps/web/components/onboarding/OnboardingWizard.module.css
apps/web/components/onboarding/WizardOption.tsx
apps/web/components/onboarding/WizardOption.module.css
apps/web/components/onboarding/WhyBlock.tsx
apps/web/components/onboarding/WhyBlock.module.css
apps/web/components/onboarding/steps/Step1Employment.tsx
apps/web/components/onboarding/steps/Step2MortgageInsurance.tsx
apps/web/components/onboarding/steps/Step3PersonalCredits.tsx
apps/web/components/onboarding/steps/Step4AdditionalIncome.tsx
apps/web/components/onboarding/steps/Step5TaxYears.tsx
apps/web/components/onboarding/steps/steps.module.css
apps/web/components/shared/CTABar.tsx
apps/web/components/shared/CTABar.module.css
```

### Design System & Tokens
```
apps/web/app/globals.css
```

### UI Specs (Behavioral & Visual Contracts)
```
docs/ui/skill-ui-system.md
docs/ui/skill-visual-quality.md
docs/ui/skill-layout-contract.md
```

### Competitor Reference
```
docs/product/finupp.pdf
```

### Wizard State (for understanding data model)
```
apps/web/lib/wizard-state.ts
```

### Landing Page (for design language consistency)
```
apps/web/components/landing/HeroSection.module.css
apps/web/components/landing/HowItWorks.module.css
apps/web/app/page.module.css
```

## Output Format

Structure your audit as:

1. **Executive Summary** — 3-5 sentences: core visual gap + core trust gap
2. **Psychological Flow Audit** — per-step purpose, cognitive load, emotional safety
3. **Trust & Drop-Off Analysis** — where users abandon and why
4. **Per-Step Visual Audit** (Steps 1–5) — current state, gaps, specific fixes
5. **Component Redesign Specs** — WizardOption, WhyBlock, CTABar, progress indicator
6. **Global CSS Changes** — design tokens, spacing, typography adjustments
7. **Implementation Priority** — P0/P1/P2 with effort estimates (S/M/L)
8. **Assets Needed** — list of icons or illustrations required (if any)

Be specific and actionable. Every recommendation must include the exact CSS or JSX change. No vague advice like "make it more modern" — say exactly what changes achieve that.

The north star: a user landing from Google should feel within 3 seconds that this is a professional, trustworthy tool that understands their situation — not a government form they have to figure out.
