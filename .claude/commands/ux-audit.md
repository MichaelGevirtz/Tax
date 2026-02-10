# UX Audit: $ARGUMENTS

## Your Role

You are a senior UX architect conducting a visual, interaction, and psychological audit of the **$ARGUMENTS** page/component in a Hebrew (RTL) tax refund SaaS product. Your job is to identify what feels dated, where trust breaks down, and propose a modern redesign that feels like a guided conversation — not a government form.

## Context

- **Product:** Self-serve SaaS for Israeli salaried employees to generate Form 135 tax refund filings
- **Stage:** Users arrive cold from Google (SEO-only traffic). Zero brand trust. Anxious about tax topics, unsure if they qualify, skeptical of online tax tools.
- **Goal:** Make users feel accurately understood and mapped — without friction or tax knowledge required.
- **Current problem:** The UI is functional but looks like a government form — plain text lists, no visual hierarchy, no personality. We need both **modern** and **trust-building** simultaneously.
- **Competitor benchmark:** See `docs/product/finupp.pdf` for a modern Israeli tax flow with card grids, icons, bold selected states, and conversational progression.

## Instructions

1. **Find and read all source files** related to the `$ARGUMENTS` page/component. Search in:
   - `apps/web/app/$ARGUMENTS/` (page route)
   - `apps/web/components/$ARGUMENTS/` (component directory)
   - `apps/web/components/onboarding/` (if wizard-related)
   - Related CSS modules, shared components, and state files

2. **Always read these files** for design context:
   - `apps/web/app/globals.css` (design tokens)
   - `docs/ui/skill-visual-quality.md`
   - `docs/ui/skill-layout-contract.md`
   - `docs/ui/skill-ui-system.md`
   - `docs/product/finupp.pdf` (competitor reference)

3. **Produce the audit** following the sections below.

## Audit Framework

### A. Psychological Purpose Audit
For each screen/section in `$ARGUMENTS`:
- Does it serve a single, clear psychological purpose? If not — identify confusion or redundancy.
- Where does the user have to "think too hard"? (tax knowledge, certainty, fear of being wrong)
- Where does the flow feel like a form instead of a guided conversation?
- What selections feel risky or irreversible — and why?
- What happens emotionally if the user answers "no" to everything? Is this handled safely or does it feel like rejection?

### B. Trust & Drop-Off Risk Analysis
- Where is the user most likely to abandon? Why?
- Which screens/sections create anxiety or uncertainty?
- Does the UI communicate "we understand you" or "fill out this form"?
- How does each section build (or erode) trust for a cold Google visitor?
- Is the cognitive load appropriate for someone with zero tax knowledge?

### C. Visual Gap Analysis (Current vs. Modern)
For each section, identify:
- What looks dated and why
- What the competitor does better visually
- Specific CSS/layout changes needed (concrete — reference CSS properties, not abstract advice)

### D. Interaction Pattern Audit
- Selection UX (checkbox list vs. card grid vs. pill buttons)
- Selected/unselected state transitions
- Help/explanation presentation (accordion? tooltip? inline?)
- Progress indicator style
- CTA visual weight and positioning

### E. Visual Design Recommendations
For each recommendation, specify:
- **What to change** (concrete CSS/component change)
- **Why** (which dated pattern it replaces)
- **How** (specific implementation — grid layout, padding, border-radius, shadow, color, icons)
- **Risk** (what could go wrong, what to test)

### F. Component-Level Redesign Spec
For each component that needs changes:
- Current state description
- Target state description
- CSS changes needed (exact properties)
- HTML/JSX structure changes if needed
- Whether new assets (icons, illustrations) are required

### G. Mobile-First Considerations
- How layouts adapt to mobile
- Touch target sizes (min 44px)
- Sticky CTA behavior
- Scroll behavior on small screens

### H. Emotional Safety Analysis
- What does the "negative path" feel like?
- Does the flow make the user feel judged?
- Is there reassurance that "no" answers are normal and valid?
- Does the final state feel like progress or rejection?

## Constraints (Do NOT Violate)

- No calculation logic changes — visual/UX only
- No new libraries unless absolutely necessary (CSS-only preferred)
- RTL-first — logical properties only (no hardcoded left/right)
- WCAG 2.1 AA (focus-visible, aria roles, contrast 4.5:1)
- Trust-first copy — no marketing language, no outcome promises, no refund amounts
- Hebrew text — all user-facing copy stays in Hebrew
- CSS Modules — no Tailwind
- Use existing design tokens from globals.css
- Follow specs in `docs/ui/`

## Output Format

1. **Executive Summary** — 3-5 sentences: core visual gap + core trust gap
2. **Psychological Flow Audit** — per-section purpose, cognitive load, emotional safety
3. **Trust & Drop-Off Analysis** — abandonment points and why
4. **Per-Section Visual Audit** — current state, gaps, specific fixes
5. **Component Redesign Specs** — exact CSS/JSX changes per component
6. **Global CSS Changes** — design token or spacing adjustments needed
7. **Implementation Priority** — P0/P1/P2 with effort estimates (S/M/L)
8. **Assets Needed** — icons or illustrations required (if any)

Be specific and actionable. Every recommendation must include the exact CSS or JSX change. No vague advice like "make it more modern" — say exactly what achieves that.

**North star:** A user landing from Google should feel within 3 seconds that this is a professional, trustworthy tool that understands their situation — not a government form they have to figure out.
