# Skill: Layout Contract (Site-Wide)

## Purpose

Define the global spatial frame that all pages must follow. Every page in the application uses this contract to ensure consistent structure, spacing, and alignment.

## Non-Goals

- Not a design system or component library
- Not branding or marketing guidelines
- Not visual specs (see `skill-visual-quality.md`)

---

## Global Frame

Every page consists of exactly 3 vertical zones:

1. **Header**: fixed-height top bar. Contains logo, minimal navigation. Consistent across all pages.
2. **Main content**: scrollable area between header and footer. All page content lives here.
3. **Footer**: fixed-height bottom bar. Contains legal links, copyright. Consistent across all pages.

Rules:

- Header and footer must be identical across all page categories
- Main content area fills remaining viewport height (min-height: 100vh minus header/footer)
- No content may render outside these 3 zones
- No sidebar navigation in v1

---

## Width & Spacing Rhythm

| Token | Value | Usage |
|-------|-------|-------|
| `max-content-width` | 720px | Max width for app flow content |
| `max-page-width` | 1120px | Max width for content/blog pages |
| `mobile-padding` | 16px | Horizontal padding on mobile |
| `tablet-padding` | 24px | Horizontal padding on tablet |
| `desktop-padding` | 32px | Horizontal padding on desktop |
| `spacing-unit` | 4px | Base unit. All spacing is a multiple of this. |

Rules:

- Content is always horizontally centered within the main area
- No element may exceed `max-content-width` (app flow) or `max-page-width` (content pages)
- All margins, paddings, and gaps must be multiples of `spacing-unit` (4px)

---

## Sectioning Rules

- Pages are built from vertically stacked, full-width sections
- Each section contains one logical block of content (e.g., stepper, form, summary)
- Sections must not have mixed widths (no narrow + wide side-by-side within a section)
- Sections are separated by consistent vertical spacing (minimum 32px)
- No floating or absolutely positioned content panels within sections

---

## Page Categories

| Category | Description | Max Width | Examples |
|----------|-------------|-----------|----------|
| App flow | Stepped user flow (Form 135 generation) | 720px | Upload, Review, Generate, Download |
| Content | Blog posts, guides, help articles | 1120px | "How to get Form 106" |
| Static | Legal, about, privacy | 1120px | Terms, Privacy Policy |

Rules:

- App flow pages always include the stepper component
- Content and static pages never include the stepper
- All categories share the same header and footer

---

## Responsive Breakpoints

| Breakpoint | Name | Min Width | Target |
|------------|------|-----------|--------|
| `sm` | Mobile | 0px (default) | Phones (320px–639px) |
| `md` | Tablet | 640px | iPad, tablets (640px–1023px) |
| `lg` | Desktop | 1024px | Laptops (1024px–1439px) |
| `xl` | Ultra-wide | 1440px | Large monitors, ultra-wide |

Rules:

- Mobile-first: base styles target mobile, larger breakpoints override
- App flow pages are single-column at all breakpoints
- Content pages may use 2-column layout at `lg` and above
- Ultra-wide (`xl`): content max-width capped via `max-content-width` / `max-page-width` — no stretching
- All screens must be tested at: 375px (mobile), 768px (tablet), 1280px (laptop), 1920px (ultra-wide)

---

## RTL Requirement

- The root `<html>` element must set `dir="rtl"` and `lang="he"`
- All layout must render correctly in RTL without manual overrides
- Horizontal padding, margins, and alignment must use logical properties (`padding-inline-start`, not `padding-left`) or a CSS framework that handles RTL automatically
- No hardcoded `left`/`right` values in layout CSS

---

## Forbidden Patterns

- No horizontal scrolling on any page at any breakpoint
- No overlapping containers or z-index stacking beyond header/footer/modals
- No fixed-position content panels (only header, footer, and sticky CTA bar may be fixed/sticky)
- No full-bleed backgrounds that break the spacing rhythm
- No layout that requires JavaScript to calculate widths or positions
- No iframes for content
- No multi-column app flow layouts
