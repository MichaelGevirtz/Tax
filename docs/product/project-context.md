# Project Context – Tax Refund SaaS

## Business Goal

Build a small, self-serve, high-margin SaaS for Israeli employees that helps them prepare a valid tax-refund filing (Form 135) quickly and confidently — without becoming a service business.

This is not a startup. It is a cash-efficient side business optimized for ROI, not scale.

## Success Metrics

- Annual net revenue: 150K–250K ₪
- Low operational load: no agents, no sales, no manual handling
- High trust, low liability: system generates documents; user submits
- Traffic source: SEO/geo and LLMs only (no paid ads)
- Maintenance: minimal, predictable, mostly regulatory updates

## Target Customer

Israeli salaried employees (שכירים) who probably deserve a tax refund but:

- Don't understand the forms
- Don't want to talk to an agent
- Don't trust "20% success fee" services
- Will pay for clarity, speed, and control — not hand-holding

## Core Value Proposition

"Upload your Form 106 or answer a few simple questions, review the extracted data, get a ready-to-submit Form 135 — clearly, safely, and on your terms."

Key differentiators:

- Self-serve (no phone calls, no agents)
- Deterministic flow (no promises, no guessing)
- Transparent responsibility (user submits)
- Lower cost than service providers
- Faster and less stressful than manual filing

## Revenue Model

Primary: one-time payment per filing (fixed price).

- One tax year: ~149–249 ₪
- Multi-year bundle (later): discounted upsell
- No percentage of refund
- No success fee
- No ongoing subscription (initially)

Why this works: clear value exchange, no incentive misalignment, no dependency on refund outcome, simple accounting.

### Secondary (future): Partner-operated service tier

- Commission-based pricing (terms TBD with partner)
- Operated entirely by an external partner — not in-house
- No power of attorney granted by us
- No in-house human handling, phone support, or case management
- Positioned as "Coming soon" until partner confirmed
- Revenue: share arrangement with partner
- Purpose: capture users who prefer human assistance, without building service operations

See `decision-log.md` (2026-02-08) for full constraints.

## Explicit Exclusions

Intentional exclusions to protect margins and sanity:

- No "we submit for you" (self-serve product; partner service tier is separate)
- No phone support (in-house)
- No success-based fees (in-house; partner tier may use commission model)
- No employer or B2B flows
- No paid traffic arbitrage
- No complex subscriptions early on

Each would increase legal exposure, support load, or break the SaaS model.

## Cost Structure

Main costs: hosting/infra, PDF processing/OCR, LLM usage, light maintenance (tax form updates).

Avoided: human labor, customer success teams, sales, paid marketing.

Result: high gross margin, costs scale sub-linearly with users, revenue scales with SEO not headcount.

## Acquisition

- SEO-led / geo distribution
- Entry via either:
  - A/B Variant A: Document-first (Form 106 upfront)
  - A/B Variant B: Short pre-check → request Form 106 only if positive

## Competitive Positioning

Existing players optimize for: service revenue, trust via humans, success fees.

This product optimizes for: automation, user autonomy, cost transparency, speed.

Not competing head-on — serving a different psychological segment.

## Product Principles

- Deterministic calculations
- Versioned logic
- Auditable results
- SaaS-first (no service dependency)

## Explicit Constraints

- No guaranteed external APIs
- User supplies documents manually
- Product must not become a service business (partner service tier is externally operated, not in-house)

## Success Criteria

- User can upload documents, get a clear eligibility result, and submit independently
- Historical calculations can be reproduced exactly
