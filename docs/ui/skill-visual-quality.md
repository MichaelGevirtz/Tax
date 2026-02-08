# Skill: Visual Quality System

## Purpose

Define visual quality rules so every screen looks fintech-grade, calm, and trustworthy. These rules apply to all pages.

## Non-Goals

- Not branding (no specific colors or fonts chosen here)
- Not a design system or token library
- Not UX theory or methodology
- Not marketing or landing page guidelines

---

## Visual Tone

Every screen must feel: **calm, modern, trustworthy, professional**.

- No playfulness, gamification, or casual illustration
- No aggressive marketing visuals in the app flow
- Financial seriousness without being cold or clinical
- Clean and spacious, not dense or cluttered

---

## Typography Rules

### Hierarchy

Exactly 3 levels:

| Level | Usage | Weight |
|-------|-------|--------|
| Heading | Screen titles, section headers | Semibold |
| Subheading | Card titles, field group labels | Semibold |
| Body | All other text, descriptions, labels | Regular |

Rules:

- Max 2 font weights used: Regular (400) and Semibold (600). No Light, no Bold, no Black.
- Body text line length: 50–75 characters. Prevent text from stretching across full width on desktop.
- Line height: minimum 1.5x for body text for readability
- Hebrew font must have proper Hebrew glyph support (e.g., Noto Sans Hebrew, or system Hebrew font)
- Numbers in data fields should use tabular (monospaced) numerals for alignment

---

## Spacing & Whitespace

- Base spacing unit: 4px. All spacing values are multiples of 4.
- Generous whitespace between sections ("air, not dense")
- Minimum spacing between related elements: 8px
- Minimum spacing between unrelated sections: 32px
- Minimum padding inside interactive elements (buttons, inputs): 12px vertical, 16px horizontal
- Cards have minimum internal padding of 24px

Common spacing scale:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps (icon-to-label) |
| `sm` | 8px | Related elements |
| `md` | 16px | Within-group spacing |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Between sections |
| `2xl` | 48px | Major section breaks |

---

## Surfaces

### Cards

- Used to group related content (e.g., upload area, review table, summary)
- Subtle border (1px, light neutral color) OR subtle shadow — not both
- Border radius: consistent across all cards (e.g., 8px)
- Background: white or very light neutral. No colored card backgrounds in the app flow.

### Separators

- Hairline dividers (1px) or spacing-only separation — not heavy borders
- Dividers are neutral/light colored, never primary or accent colored
- Prefer spacing over dividers when possible

### Elevation

- Max 1 shadow level for cards (subtle, diffused shadow)
- No stacked shadows (no card-inside-card shadows)
- Shadow values must be subtle: large blur, low opacity, no hard edges
- Sticky CTA bar may use a top shadow to indicate elevation

---

## Color Usage Rules

### Semantic Colors Only

Define colors by role, not by name:

| Role | Usage |
|------|-------|
| Primary | Main CTA buttons, active stepper step, links |
| Neutral | Text, borders, backgrounds, disabled states |
| Success | Confirmed fields, completed steps, success messages |
| Warning | Fields needing review, non-blocking alerts |
| Error | Validation errors, blocking alerts, failed states |
| Info | Informational alerts, help text |

Rules:

- 1 primary accent color for CTAs. Not scattered across UI — used sparingly.
- Error/warning/success colors must be calm. No aggressive reds or flashing. Use muted, accessible tones.
- Backgrounds: white or near-white only in the app flow. No dark mode in v1.
- Text: dark neutral for body (not pure black — e.g., `#1a1a1a` or similar)
- Do not use color as the only indicator of state. Pair with icons or text labels.

---

## Motion Rules

- Transitions for state changes: 150–300ms duration, ease-out timing
- No celebratory animations (no confetti, no bouncing, no particle effects, no fireworks)
- No decorative motion (no floating elements, no parallax, no auto-playing animations)
- Motion must serve clarity: show what changed, where something went, what appeared/disappeared
- Page transitions: simple fade or none. No slide-in pages.
- Respect `prefers-reduced-motion`: disable all non-essential animations when set
- Loading spinners: simple, calm rotation. No pulsing logos or complex loading animations.

---

## Loading / Empty / Error Visual Standards

### Loading States

- Use skeleton placeholders that match the shape of the expected content
- Never show a completely blank screen while loading
- Skeleton colors: light neutral pulse (subtle animation allowed)
- Show loading state within 100ms of action start (no perceived "freeze")

### Empty States

- Always show a message explaining what's expected (e.g., "Upload a Form 106 to get started")
- Include 1 clear action (e.g., upload button)
- No decorative illustrations in v1 — text + action is sufficient

### Error States

- Show what happened in plain language (not technical jargon, not raw error messages)
- Show what the user can do about it (retry, fix input, contact support)
- Error messages appear inline, near the source of the error
- Full-page errors only for unrecoverable failures (e.g., server down)

---

## RTL Requirements

- All components must render correctly with `dir="rtl"`
- Icons with directional meaning (arrows, chevrons, progress indicators) must mirror in RTL
- Text alignment follows content direction (right-aligned for Hebrew)
- Form labels align to the inline-start side (right in RTL)
- Tables: first column on the right in RTL
- Do not hardcode `text-align: left` or `text-align: right` — use `start`/`end`

---

## Accessibility Baseline

These 4 rules are mandatory for every screen:

1. **Contrast**: All text meets WCAG AA contrast ratio — 4.5:1 for normal text, 3:1 for large text (18px+ semibold or 24px+ regular)
2. **Keyboard navigation**: All interactive elements (buttons, inputs, links, checkboxes) reachable and operable via keyboard (Tab to navigate, Enter/Space to activate, Escape to dismiss)
3. **Form labels**: Every form input has a visible, associated `<label>` element. No placeholder-only inputs.
4. **Focus indicators**: All interactive elements show a visible focus ring when focused via keyboard. Focus ring must meet contrast requirements against the background.
