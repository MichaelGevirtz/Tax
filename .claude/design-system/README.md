# Design System — Tax Refund SaaS

## Loading Rules

### Always-On (loaded with every UI task)

| File | Purpose |
|------|---------|
| `README.md` | This index |
| `ui-rules.md` | Core visual, layout, interaction, trust, accessibility rules |
| `copy-rules.he.md` | Hebrew copy voice, tone, forbidden patterns, approved patterns |

### On-Demand (loaded by keyword trigger)

| File | Trigger Keywords | Purpose |
|------|-----------------|---------|
| `seo-geo.md` | "SEO", "content page", "programmatic", "GEO", "search" | SEO + GEO strategy for programmatic content pages |
| `page-spec-template.md` | "new screen", "new page", "page spec" | Template for speccing new UI screens |
| `ui-checklist.md` | "pre-ship", "review UI", "checklist", before any UI commit | Pre-ship UI quality gate |
| `screen-examples.md` | "upload screen", "eligibility", "do/don't", "example" | Reference Do/Don't for key screens |

---

## Relationship to `docs/ui/`

The `docs/ui/` specs are the **authoritative source** for the Form 135 app flow:

- `docs/ui/skill-layout-contract.md` — spatial frame, breakpoints, RTL mandate
- `docs/ui/skill-visual-quality.md` — visual quality standard (typography, color, motion)
- `docs/ui/skill-ui-system.md` — behavioral contract (Upload → Review → Generate → Download)

This design system **extends** those specs to cover:

- Marketing/SEO pages (beyond app flow)
- Hebrew copy rules (voice, tone, legal constraints)
- SEO/GEO strategy for programmatic pages
- Reusable templates and pre-ship checklists

**Rule**: When `docs/ui/` and design-system files conflict, `docs/ui/` wins for app flow screens.

---

## Design Tokens

All tokens defined in `apps/web/app/globals.css`. Do not create alternative token systems.

## Component Styling

CSS Modules only. No Tailwind, no inline styles (except dynamic values). Reference tokens via `var(--*)`.
