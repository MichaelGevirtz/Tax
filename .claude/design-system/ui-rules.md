# UI Rules — Core Contract

These rules apply to **every** screen. No exceptions.

---

## 1. Layout Foundations

- **RTL**: `dir="rtl" lang="he"` on html. Logical properties only (`margin-inline-start`, not `margin-left`).
- **Breakpoints**: sm (320px), md (640px), lg (1024px), xl (1440px).
- **Width tokens**: `--max-content-width: 720px` (app flow), `--max-page-width: 1120px` (content/marketing pages).
- **Spacing rhythm**: Multiples of 4px. Use `--space-*` tokens. Minimum 32px (`--space-xl`) between sections.
- **Forbidden**: horizontal scroll, overlapping containers, fixed side panels, full-bleed backgrounds, iframes.

> Full spatial spec: `docs/ui/skill-layout-contract.md`

### RTL Interaction Patterns

Visual RTL (logical properties) is necessary but not sufficient. Interactive elements must also follow RTL directional conventions:

| Element | Rule |
|---------|------|
| **Wizard/flow CTAs** | Forward action ("המשך") = inline-end (left in RTL). Back action ("חזרה") = inline-start (right in RTL). Render secondary before primary in DOM, or use CSS `order`. |
| **Navigation direction** | "Forward" means inline-end (leftward in RTL). "Back" means inline-start (rightward in RTL). Progress bars fill from inline-start to inline-end. |
| **Arrows & chevrons** | "Next" chevron points inline-end (leftward in RTL). "Previous" chevron points inline-start (rightward in RTL). Use `scaleX(-1)` on directional SVGs or provide RTL-aware icons. |
| **Swipe gestures** | Swipe-to-advance = swipe toward inline-end (swipe left in RTL). Swipe-to-go-back = swipe toward inline-start (swipe right in RTL). |
| **Breadcrumbs & pagination** | Read inline-start to inline-end. First item on inline-start (right in RTL), last on inline-end (left in RTL). Separator arrow points inline-end. |

**Test**: In any multi-step flow, cover the labels and verify that spatial position alone communicates direction correctly to an RTL reader.

---

## 2. Visual Standards

- **Typography**: 3 levels only — heading (semibold), subheading (semibold), body (regular). Line length 50–75 chars. Line height `--line-height-body: 1.6`.
- **Surfaces**: Subtle border OR shadow — never both. `--radius: 12px` for cards, `--radius-sm: 8px` for inner elements. Minimum `--space-lg` (24px) card padding.
- **Colors**: Semantic tokens only (`--color-primary`, `--color-success`, `--color-error`, `--color-warning`, `--color-info`). No hardcoded hex in components.
- **Motion**: 150–300ms fade ONLY. No slide-in, no bounce, no celebration animations. `prefers-reduced-motion` already handled in `globals.css`.

> Full visual spec: `docs/ui/skill-visual-quality.md`

---

## 3. App Flow Screens (Upload → Review → Generate → Download)

- Stepper always visible, non-skippable, back-allowed.
- Hard stops: disabled CTA + visible reason text below it.
- Confirmation checkbox before irreversible steps (payment, generation).
- System generates; user submits. No "we submit", "filed", or "approved" language.
- Disclaimer visible inline on Generate step (not behind a link).

> Full behavioral spec: `docs/ui/skill-ui-system.md`

---

## 4. Marketing & Content Pages

These rules cover SEO landing pages, eligibility guides, FAQ pages, and any non-app-flow screen.

### Above the fold (first viewport)
- H1: clear value prop in Hebrew, contains target keyword.
- Subheading: who it's for + what they get (one sentence).
- Single primary CTA.
- No clutter — one message per hero section.

### Content structure
- H1 → H2 → H3 hierarchy (strict, no level skipping).
- FAQ sections use `<details>`/`<summary>` + FAQPage JSON-LD.
- Internal links to related content pages and tool entry point.
- "Updated [month] [year]" label visible on every content page.

### Trust signals (non-app screens)
- How-it-works: 3-step visual (Upload → Review → Get Form 135).
- Numbers over testimonials ("X טפסים הופקו" — only if verifiable).
- No stock photos, no smiling faces, no fake social proof.
- Professional, calm visual language.

### Forbidden on marketing pages
- "Guaranteed refund" or any outcome promise.
- Refund amounts or ranges (even estimated).
- "We'll handle everything" / service language.
- Phone numbers, chat widgets, "contact us".
- Urgency tactics ("last chance", countdowns, "limited spots").
- Competitor bashing.
- "Free" unless genuinely free (eligibility check is free; Form 135 generation is not).

---

## 5. Trust Patterns (Financial SaaS)

| Pattern | Rule |
|---------|------|
| Responsibility | System generates the form. User submits it themselves. |
| Language | Never: "approved", "certified", "filed", "submitted for you". |
| Errors | Always actionable: [what happened] + [what to do next]. |
| Disabled states | Show reason text below the disabled element. |
| Confirmation | Checkbox or explicit action before payment or generation. |
| Disclaimers | Visible inline, never behind a link or modal. |
| Pre-payment | Eligibility + qualitative confidence only. No amounts. No percentages. |
| Post-payment | Form 135 + submission instructions. No "refund guaranteed". |

---

## 6. Accessibility (Non-Negotiable)

- WCAG 2.1 AA minimum.
- Contrast: 4.5:1 for normal text, 3:1 for large text and UI components.
- Focus: visible rings (`outline: 2px solid var(--color-primary); outline-offset: 2px`) — already in `globals.css`.
- Labels: every `<input>` has a visible `<label>`. No placeholder-only inputs.
- Keyboard: full tab navigation for all interactive elements.
- Touch targets: 44px minimum dimension with 8px spacing between.
- ARIA: semantic HTML first (`<button>`, `<a>`, `<input>`). ARIA only when semantics are insufficient.
- No color-only state indicators — always pair with icon or text.
- Screen reader: meaningful Hebrew `alt` text, `aria-live` for dynamic updates.

---

## 7. Mobile Rules

- Sticky CTA bar at bottom within app flow.
- No horizontal scroll at any viewport width (test at 320px).
- Body text minimum 16px (`--font-size-body: 17px`).
- Touch targets minimum 44px with 8px spacing.
- Images: Next.js `<Image>` with responsive `sizes`.
- Forms: appropriate `inputMode` and `autocomplete` attributes.
- No content hidden on mobile that's visible on desktop.

---

## 8. Component Conventions

- **Styling**: CSS Modules. No Tailwind, no inline styles (except computed values).
- **Tokens**: Use `var(--*)` from `globals.css`. Never hardcode colors, spacing, or radii.
- **Icons**: Inline SVG via React components. Mirror directional icons for RTL (arrows, chevrons).
- **Semantic HTML**: `<button>` not `<div onClick>`. `<a>` for navigation. `<input>` with `<label>`.
- **Loading states**: Skeleton loaders preferred over spinners. Never a blank screen.
- **Empty states**: Helpful message + suggested action. Never "no data" or "nothing here" alone.
