# TASK-UI-005 – Wizard Visual Redesign (Conversational Flow + Semantic Icons)

## PLAN

### Goal
Redesign the 5-step onboarding wizard from a card-tile grid to a **conversational flow** layout — single-column horizontal option cards, question-as-hero, minimal dot progress, "או" separators, semantic icon colors, and GEO trust signals.

Approved mocks:
- **Layout & interaction**: `docs/design/mock-option-b-conversational.html`
- **Icon colors**: `docs/design/mock-icon-color-comparison.html` (right column — "Muted Semantic")

This is a visual/UX redesign with two logic changes (unchanged from original plan):
- **Step 2**: Remove "גם משכנתא וגם ביטוח חיים פרטי" option (multi-select handles it). Simplify to 4 options.
- **Step 3**: Expand from 3 compound options to 5 individual options (degree, children, new immigrant, disability, not relevant).

All legacy code is deleted — no backward compatibility.

### Inputs
- Approved interactive mock (layout): `docs/design/mock-option-b-conversational.html`
- Approved interactive mock (icon colors): `docs/design/mock-icon-color-comparison.html`
- UI audit: conducted in design review chat (Feb 2026)
- Current implementation: `apps/web/components/onboarding/` + `apps/web/components/shared/CTABar.*`
- Design tokens: `apps/web/app/globals.css`
- UI specs: `docs/ui/skill-visual-quality.md`, `docs/ui/skill-layout-contract.md`, `docs/ui/skill-ui-system.md`
- GEO spec: `.claude/design-system/seo-geo.md`

### Design Decisions (from audit)
1. **Single-column horizontal cards** instead of 2-col grid — better mobile, no asymmetry, faster scanning
2. **No card wrapper** — white page bg, content sits directly on page
3. **Dot progress** — minimal dots (active = elongated bar) + fraction "2/5", not segmented bar
4. **"או" separator** — visual divider between positive and negation/dismissive options
5. **Semantic icon colors** — 4 muted categories: financial (blue), property (amber), personal (rose), neutral (gray). On select → all go white-on-blue.
6. **Pill-shaped CTA** — `border-radius: 999px`, stronger shadow, subtle hover lift
7. **Stronger contrast** — darker border (#D5D0CA), darker bg-alt (#EDEAE6), darker selected bg (#C9DDFB)
8. **Trust footer** on Step 1 — "כ-2 דקות · ללא רישום · בדיקה חינמית"
9. **GEO micro-explainer** on Step 1 — "בדיקת זכאות חינמית להחזר מס · תוצאה תוך 2 דקות · ללא מסירת פרטים אישיים"
10. **Freshness date** — "נכון לפברואר 2026" in progress area (all steps)
11. **Selected state** — thick inline-start border (4px) + `primary-subtle` bg + icon container fills blue + bold label + circle checkmark

### Outputs
Redesigned wizard with:
1. **WizardOption** → horizontal card with icon circle, inline-start accent border on selected, circle check on end
2. **Progress indicator** → minimal dot row with fraction counter, freshness date below
3. **No card wrapper** — wizard page has white bg, no card surface
4. **WhyBlock** → inline subtle text with border-inline-start, shown after selection
5. **CTABar** → pill-shaped primary, ghost secondary, trust footer on Step 1
6. **Step 5** → year pills in 3-col grid with selected-years summary
7. **Steps 1–4** → single-column option list with "או" separator before negation/dismissive
8. **Negation options** → muted card below "או" separator (Steps 1, 3, 4). Step 2: positive options above "או", dismissive below.
9. **Acknowledgment line** → inline text with checkmark icon (no background bar)
10. **Icons** → semantic colors per category with tinted bg circles
11. **GEO elements** → micro-explainer + freshness date

### Constraints
- RTL-first: all layout uses logical properties (no hardcoded left/right)
- CSS Modules: no Tailwind, no inline styles
- Accessibility: maintain WCAG 2.1 AA (focus-visible, aria roles, contrast)
- Design tokens: use existing `globals.css` tokens; update 3 contrast tokens, add 4 icon color tokens
- No new libraries
- Hebrew text: all user-facing copy stays in Hebrew
- Follow motion rules from `docs/ui/skill-visual-quality.md` (fade-only, no slide-in, respect prefers-reduced-motion)
- Delete all legacy/unused code — no backward compatibility shims
- Bump localStorage version key to invalidate stale wizard state from previous option sets

### Open Questions
None — all decisions resolved during design review.

---

## IMPLEMENT

### Step-by-step implementation order

#### Phase 1: Design tokens + shared components

**1.1 Update globals.css — contrast + icon tokens**
Update existing tokens for fintech-appropriate contrast:
```css
--color-border:        #D5D0CA;   /* was #E8E4DF — 12% darker */
--color-bg-alt:        #EDEAE6;   /* was #F5F3F0 — 8% darker */
--color-primary-subtle: #C9DDFB;  /* was #DBEAFE — more saturated */
```
Add semantic icon color tokens:
```css
--icon-financial: #4B7BE5;         /* salary, chart, briefcase, switch, multi, gap */
--icon-property:  #B45309;         /* house, rental */
--icon-personal:  #B44669;         /* family, plane, access, degree */
--icon-neutral:   #8C857D;         /* none, question, shield */
```

**1.2 Update icons.tsx — add `color` category prop**
- Each icon component already exists in `apps/web/components/onboarding/icons.tsx`
- Add a `category` export mapping: `ICON_CATEGORIES: Record<string, 'financial' | 'property' | 'personal' | 'neutral'>`
- Icons still use `currentColor` for stroke — color is applied via CSS on the wrapper

**1.3 Redesign WizardOption → horizontal card**
Replace current tile/negation/pill variants with:
- **`"card"` variant** (default): horizontal row — icon circle | label text | circle checkmark
  - Unselected: `border: 2px solid var(--color-border)`, icon in tinted circle with category color
  - Selected: `border-inline-start: 4px`, `background: var(--color-primary-subtle)`, icon circle fills `--color-primary` with white icon, label bolds, circle check fills blue with white checkmark
  - Hover: `border-color: var(--color-primary)`, light bg
- **`"negation"` variant**: same horizontal layout but muted — `background: var(--color-bg-alt)`, `border: transparent`, smaller icon, secondary text color
- **`"pill"` variant**: unchanged (year pills for Step 5)
- Add `iconColor` prop: `'financial' | 'property' | 'personal' | 'neutral'` for CSS class

**1.4 Redesign WhyBlock → inline subtle text**
- Remove label ("למה זה חשוב?") — just show the text directly
- Style: `font-size: var(--font-size-xs)`, `color: var(--color-text-secondary)`, `border-inline-start: 2px solid var(--color-border)`, `padding-inline-start: var(--space-lg)`
- Fade-in animation on appear

**1.5 Redesign CTABar → pill shape + trust footer + RTL button order**
- Primary: `border-radius: var(--radius-pill)`, padding `16px 56px`, `box-shadow: 0 4px 14px rgba(37,99,235,0.3)`, subtle hover lift (`translateY(-1px)`)
- Secondary: `border-radius: var(--radius-pill)`, ghost text, smaller font
- **RTL button order**: "חזרה" (back) on inline-start (right in RTL), "המשך" (continue) on inline-end (left in RTL). Back = past direction, Continue = forward direction. Render secondary BEFORE primary in DOM, or use `order` CSS.
- Keep sticky mobile behavior
- Add optional `trustFooter` boolean prop — when true, renders trust signals below CTA

**1.6 Add "או" Separator component**
- New small component `OptionsSeparator` (or inline in steps.module.css)
- Style: flex row with `::before`/`::after` 1px lines, "או" text in center
- `font-size: var(--font-size-xs)`, `color: var(--color-text-secondary)`

#### Phase 2: Wizard shell

**2.1 Redesign OnboardingWizard**
- Remove card surface wrapper (no `.card` div)
- Set wizard page background to `var(--color-bg-white)` (white, not warm bg)
- Replace segmented progress bar with **dot progress**:
  - 5 dots: inactive = 8px circle `var(--color-border)`, active = 28px×8px rounded bar `var(--color-primary)`, completed = 8px circle `var(--color-primary)` at 0.5 opacity
  - Fraction label: `"2/5"` in `var(--font-size-xs)`, `var(--color-text-secondary)`
- Add freshness date: `"נכון לפברואר 2026"` below dots, 11px, secondary color, 0.7 opacity
- Remove step title from progress area (question serves as the title now)
- Add GEO micro-explainer on Step 1 only: `"בדיקת זכאות חינמית להחזר מס · תוצאה תוך 2 דקות · ללא מסירת פרטים אישיים"`
- Question rendered at 26px bold, centered, generous spacing above/below

#### Phase 3: Step-by-step content

**3.1 Step 1 — Employment Changes**
- Render 4 positive options as `card` variant (single column)
- Add "או" separator
- Render negation ("לא זכור לי שינוי משמעותי") as `negation` variant
- Pass `iconColor` per option: salary=financial, switch=financial, multi=financial, gap=financial, none=neutral
- Show trust footer on CTA bar (Step 1 only)
- No logic changes

**3.2 Step 2 — Mortgage & Insurance**
- Remove "גם משכנתא וגם ביטוח חיים פרטי" option
- Simplify to 4 options: משכנתא, ביטוח חיים פרטי, לא היה לי, לא בטוח
- Render first 2 (positive) as `card` variant
- Add "או" separator
- Render last 2 (dismissive) as `negation` variant
- Pass `iconColor`: house=property, shield=neutral, none=neutral, question=neutral
- Update `applyStep2Exclusivity` — simplify (no "both" branch)
- Update `getAcknowledgment` — handle both-selected-individually case

**3.3 Step 3 — Personal Credits**
- Expand from 3 options to 5: סיום תואר, ילדים מתחת לגיל 18, עולה חדש / תושב חוזר, מגבלה רפואית, לא רלוונטי
- Render first 4 as `card` variant
- Add "או" separator
- Render "לא רלוונטי" as `negation` variant
- Pass `iconColor`: degree=personal, family=personal, plane=personal, access=personal, none=neutral
- Update `applyStep3Exclusivity` — same pattern, more options
- Update `getAcknowledgment` — handle individual items

**3.4 Step 4 — Additional Income**
- Render 3 positive options as `card` variant
- Add "או" separator
- Render negation as `negation` variant
- Pass `iconColor`: chart=financial, rental=property, briefcase=financial, none=neutral
- No logic changes

**3.5 Step 5 — Tax Years**
- Replace flex-wrap pills with **3-column grid** pills
- Use WizardOption pill variant (unchanged from current)
- Add selected-years summary line: "נבחרו X שנים: 2022, 2023, 2024"
- Responsive: 2-col on mobile (<640px)
- No logic changes

#### Phase 4: Cleanup

**4.1 Delete legacy code**
- Remove old tile/grid CSS from WizardOption.module.css
- Remove old segmented progress CSS from OnboardingWizard.module.css
- Remove card surface CSS
- Remove old 2-col grid CSS from steps.module.css
- Remove unused CSS classes
- Remove dead code paths
- Remove corner badge markup (replaced by circle check)

**4.2 Bump localStorage version**
- Change `STORAGE_KEY` in `wizard-state.ts` from `"taxback_precheck_v1"` to `"taxback_precheck_v2"` to invalidate stale state

### Files Touched

**Modified:**
- `apps/web/app/globals.css` — update 3 contrast tokens, add 4 icon color tokens
- `apps/web/components/onboarding/icons.tsx` — add ICON_CATEGORIES mapping
- `apps/web/components/onboarding/WizardOption.tsx` — horizontal card layout, iconColor prop
- `apps/web/components/onboarding/WizardOption.module.css` — full rewrite: card/negation/pill styles
- `apps/web/components/onboarding/WhyBlock.tsx` — simplify to inline text
- `apps/web/components/onboarding/WhyBlock.module.css` — rewrite: subtle inline style
- `apps/web/components/onboarding/OnboardingWizard.tsx` — dot progress, remove card wrapper, add GEO elements
- `apps/web/components/onboarding/OnboardingWizard.module.css` — full rewrite: dot progress, white bg, no card
- `apps/web/components/onboarding/steps/Step1Employment.tsx` — single-col cards, separator, trust footer
- `apps/web/components/onboarding/steps/Step2MortgageInsurance.tsx` — remove "both" option, separator, logic update
- `apps/web/components/onboarding/steps/Step3PersonalCredits.tsx` — expand to 5 options, separator, logic update
- `apps/web/components/onboarding/steps/Step4AdditionalIncome.tsx` — single-col cards, separator
- `apps/web/components/onboarding/steps/Step5TaxYears.tsx` — 3-col pill grid
- `apps/web/components/onboarding/steps/steps.module.css` — rewrite: single-col, separator, feedback area, pill grid
- `apps/web/components/shared/CTABar.tsx` — pill shape, trustFooter prop
- `apps/web/components/shared/CTABar.module.css` — pill shape, hover lift, trust footer styles
- `apps/web/lib/wizard-state.ts` — bump storage key to v2

No other files may be modified without updating the PLAN.

---

## VALIDATE

### Validation Artifacts
- Unit tests: `Step1Employment.test.ts` — exclusivity logic (unchanged, should still pass)
- Unit tests: `Step2MortgageInsurance.test.ts` — updated exclusivity (remove "both" tests, add both-individually test)
- Unit tests: `Step3PersonalCredits.test.ts` — updated exclusivity (5 options)
- Unit tests: `Step4AdditionalIncome.test.ts` — exclusivity logic (unchanged, should still pass)
- TypeScript typecheck: `cd apps/web && npx tsc --noEmit`
- Visual check: compare running app against `docs/design/mock-option-b-conversational.html` mock
- Icon color check: compare against `docs/design/mock-icon-color-comparison.html` (right column)

### Success Criteria
- All existing unit tests pass (updated for Step 2/3 logic changes)
- TypeScript compiles without errors
- All 5 steps render matching the Option B mock (horizontal cards, dot progress, separators, semantic icons)
- RTL layout correct (logical properties, no hardcoded left/right)
- Keyboard navigation works (Tab through cards, Enter/Space to select)
- Focus-visible indicators present on all interactive elements
- Mobile: sticky CTA, single column (already single column — no breakpoint change needed)
- `prefers-reduced-motion` disables animations
- No legacy CSS classes or dead code remaining
- localStorage key bumped to v2
- GEO elements present: micro-explainer on Step 1, freshness date on all steps
- Trust footer visible on Step 1 CTA area
- Icon colors match semantic categories (financial=blue, property=amber, personal=rose, neutral=gray)
- Contrast: borders visible against white bg (darker tokens applied)

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None (pending completion)

### Follow-ups
- None (pending completion)
