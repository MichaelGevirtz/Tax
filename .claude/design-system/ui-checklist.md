# UI Pre-Ship Checklist

Run this checklist before committing ANY UI change. Every item must pass.

---

## Layout
- [ ] `dir="rtl" lang="he"` inherited from root layout
- [ ] Logical CSS properties only (no `left`/`right`, no `text-align: right`)
- [ ] Correct width token (`--max-content-width` for app flow, `--max-page-width` for content)
- [ ] Spacing uses `--space-*` tokens (no hardcoded px for spacing)
- [ ] Minimum `--space-xl` (32px) between sections
- [ ] No horizontal scroll at any breakpoint (tested 320px → 1440px)

## Visual
- [ ] All colors/spacing/radii use `var(--*)` tokens from `globals.css`
- [ ] Cards: border OR shadow — never both
- [ ] Card padding ≥ `--space-lg` (24px)
- [ ] Border radius uses `--radius` (12px) or `--radius-sm` (8px)
- [ ] Typography: max 3 levels used (heading / subheading / body)
- [ ] Semantic color tokens only (`--color-primary`, `--color-error`, etc.)

## Motion
- [ ] Transitions are fade-only, 150–300ms
- [ ] No slide-in, bounce, or celebration animations
- [ ] `prefers-reduced-motion` handled (inherits from `globals.css`)

## Copy (Hebrew)
- [ ] All user-facing text in Hebrew
- [ ] No forbidden patterns (verified against `copy-rules.he.md`)
- [ ] Error messages follow [what happened] + [what to do] pattern
- [ ] Disabled states have visible reason text below the element
- [ ] No refund amounts or ranges pre-payment
- [ ] No service language ("we submit", "we handle", "we file")
- [ ] No outcome promises ("guaranteed", "approved", "100%", "certain")

## Trust
- [ ] "System generates / user submits" framing maintained
- [ ] Disclaimers visible inline (not behind links or modals)
- [ ] Confirmation step exists before payment or generation
- [ ] No fake urgency, scarcity, or countdown tactics

## Accessibility
- [ ] Contrast ≥ 4.5:1 for normal text (3:1 for large text and UI components)
- [ ] Focus rings visible on all interactive elements (`:focus-visible`)
- [ ] Every `<input>` has a visible `<label>` (no placeholder-only)
- [ ] Full keyboard navigation works (tab, enter, escape, arrow keys where applicable)
- [ ] Touch targets ≥ 44px with ≥ 8px spacing between
- [ ] No color-only state indicators (pair with icon or text)
- [ ] Semantic HTML used (`<button>`, `<a>`, `<input>` + `<label>`)
- [ ] `aria-live` regions for dynamic content updates

## Mobile (tested at 320px)
- [ ] Body text ≥ 16px
- [ ] Sticky CTA visible and functional
- [ ] No content hidden on mobile that's visible on desktop
- [ ] Form inputs use correct `inputMode` and `autocomplete`
- [ ] No horizontal overflow

## Performance
- [ ] Images use Next.js `<Image>` with responsive `sizes`
- [ ] No unnecessary client-side JavaScript (prefer server components)
- [ ] Loading states use skeleton loaders (not blank screens)
- [ ] Empty states show helpful message + suggested action

## RTL-Specific
- [ ] Directional icons mirrored (arrows, chevrons, back/forward)
- [ ] Logical properties used throughout CSS module (no `margin-left` etc.)
- [ ] Numbers display correctly (LTR within RTL context)
- [ ] Currency format: `167,596 ₪` (number + space + symbol)
