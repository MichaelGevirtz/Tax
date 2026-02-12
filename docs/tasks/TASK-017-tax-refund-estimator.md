# TASK-017 — Tax Refund Estimator (Core)

## PLAN

### Goal

Build a deterministic, versioned tax refund estimator that:
1. Calculates **expected tax** from Israeli tax brackets + personal credit points
2. Compares with **actual tax deducted** (from Form 106)
3. Returns an **estimated refund amount** + a **confidence tier** (HIGH / MODERATE / LOW / NONE)

The estimated refund amount is **never shown to the user pre-payment**. Instead, the confidence tier drives UI urgency signals on the verified result screen (TASK-UI-007).

### Why This Matters

The current soft evaluator (`apps/web/lib/soft-evaluator.ts`) uses wizard heuristics only — it doesn't look at real numbers. After a user uploads Form 106, we have hard data (gross income, tax deducted). Running it through real tax brackets lets us:

- Upgrade confidence from heuristic → data-driven
- Show urgency for high-refund users ("פוטנציאל גבוה להחזר")
- Skip payment for zero-refund years (builds trust, saves support costs)
- Prioritize years ("שנת 2022 מראה את הפוטנציאל הגבוה ביותר")

### Inputs

1. **From Form 106** (Extracted106):
   - `grossIncome` — total annual earnings
   - `taxDeducted` — actual tax withheld by employer
   - `taxYear` — determines which bracket table to use

2. **From Wizard** (WizardState — optional enrichment):
   - `personalCredits` selections → mapped to credit point count
   - `employmentChanges` → multiple employers flag (common over-deduction cause)

3. **Static Data** (published by Israeli Tax Authority):
   - Annual tax bracket tables (2020–2025)
   - Credit point value per year
   - Base credit points per resident

### Outputs

```typescript
interface RefundEstimate {
  taxYear: number;
  grossIncome: number;
  taxDeducted: number;
  calculatedTax: number;        // What should have been paid
  estimatedRefund: number;      // taxDeducted - calculatedTax (≥ 0)
  creditPointsUsed: number;     // How many credit points applied
  confidenceTier: "HIGH" | "MODERATE" | "LOW" | "NONE";
  estimateVersion: string;      // e.g. "estimator_v1_2024"
  limitations: string[];        // What this estimate doesn't account for
}
```

**Confidence Tier Mapping:**

| Estimated Refund | Tier | UI Signal |
|---|---|---|
| > 5,000 ₪ | HIGH | "פוטנציאל גבוה להחזר" — strong urgency |
| 1,000–5,000 ₪ | MODERATE | "זיהינו סימנים חיוביים להחזר מס" |
| 1–999 ₪ | LOW | Neutral tone, no urgency |
| ≤ 0 ₪ | NONE | "לא זיהינו עילה להחזר לשנה זו" |

### Constraints

- **Deterministic:** Same inputs → same output (CLAUDE.md §1)
- **Versioned:** Every estimate carries `estimateVersion` string (CLAUDE.md §1)
- **Pure functions only:** No IO, no DB, no network. Lives in `packages/core/` (CLAUDE.md §Scope)
- **Conservative estimate:** This is a **floor**, not a ceiling. The estimate only accounts for base credit points and standard brackets. Deductions (pension, mortgage, donations) are NOT included — the real refund is likely higher.
- **No monetary amounts shown pre-payment** (decision-log.md §2026-02-XX Option D)
- **Limitations array required:** Every estimate must document what it doesn't account for

### Israeli Tax Data (Public, Published Annually)

#### Tax Brackets (2024, annual amounts in ₪)

| Bracket | From | To | Rate |
|---|---|---|---|
| 1 | 0 | 84,120 | 10% |
| 2 | 84,121 | 120,720 | 14% |
| 3 | 120,721 | 193,800 | 20% |
| 4 | 193,801 | 269,280 | 31% |
| 5 | 269,281 | 560,280 | 35% |
| 6 | 560,281 | 721,560 | 47% |
| 7 | 721,561+ | — | 50% |

*Source: Israeli Tax Authority, updated annually. Each supported year needs its own table.*

#### Credit Points (2024)

- **Point value:** ~2,904 ₪/year (2024)
- **Base allocation:** Every Israeli resident: 2.25 points
- **Women:** Additional 0.5 points
- **Wizard-derivable additions:**
  - Children under 18: 1–2 points per child (age-dependent)
  - Academic degree: 1 point (year of completion + following year)
  - New immigrant: 3 points (first 18 months), then 2, then 1
  - Disability: varies

For v1, we apply **base points only** (2.25) unless wizard data enriches it. This keeps the estimate conservative.

### Open Questions

1. **Gender:** The wizard doesn't currently ask for gender. Women get +0.5 credit points. Should we add a gender question or default to minimum (male) credits?
   - **Recommendation:** Default to 2.25 (male), note in limitations. Gender question can come later.

2. **Multiple employer correction:** When someone has 2+ employers, each employer may withhold tax as if they're the sole employer, causing systematic over-deduction. Should we model this?
   - **Recommendation:** Not in v1. The bracket calculation already catches over-deduction when grossIncome is from all employers combined in a single 106. Flag in limitations.

3. **Which tax years to support?** The wizard allows 2020–2025. We need bracket tables for each.
   - **Recommendation:** Support 2020–2025. Bracket tables change slightly each year. All are publicly available.

---

## IMPLEMENT

### Architecture

```
packages/core/src/
├── tax-tables/
│   ├── types.ts              # TaxBracketTable, CreditPointTable types
│   ├── brackets-2020.ts      # Tax bracket table for 2020
│   ├── brackets-2021.ts
│   ├── brackets-2022.ts
│   ├── brackets-2023.ts
│   ├── brackets-2024.ts
│   ├── brackets-2025.ts
│   └── index.ts              # Registry: year → table lookup
├── rules/
│   ├── credits.ts            # Credit point calculator (wizard → points)
│   └── eligibility.ts        # (unused for now, keep placeholder)
│   └── deductions.ts         # (unused for now, keep placeholder)
├── calc/
│   ├── tax-calculator.ts     # grossIncome + year → expected tax
│   ├── credit-calculator.ts  # wizard state → total credit points
│   └── refund-estimator.ts   # Main entry: Extracted106 + wizard → RefundEstimate
└── versions/
    └── estimator-version.ts  # ESTIMATOR_VERSION constant
```

### Files Touched

| File | Action |
|---|---|
| `packages/core/src/tax-tables/types.ts` | Create |
| `packages/core/src/tax-tables/brackets-2020.ts` | Create |
| `packages/core/src/tax-tables/brackets-2021.ts` | Create |
| `packages/core/src/tax-tables/brackets-2022.ts` | Create |
| `packages/core/src/tax-tables/brackets-2023.ts` | Create |
| `packages/core/src/tax-tables/brackets-2024.ts` | Create |
| `packages/core/src/tax-tables/brackets-2025.ts` | Create |
| `packages/core/src/tax-tables/index.ts` | Create |
| `packages/core/src/rules/credits.ts` | Implement (currently empty) |
| `packages/core/src/calc/tax-calculator.ts` | Create |
| `packages/core/src/calc/credit-calculator.ts` | Create |
| `packages/core/src/calc/refund-estimator.ts` | Implement (currently empty) |
| `packages/core/src/versions/estimator-version.ts` | Create |
| `packages/core/src/index.ts` | Add exports |
| `packages/domain/src/schemas/refund-estimate.schema.ts` | Create (Zod schema for output) |
| `packages/domain/src/types/index.ts` | Add RefundEstimate type export |

**Do NOT touch:**
- `apps/web/` (no UI in this task)
- `packages/ingestion/` (no pipeline changes)
- `soft-evaluator.ts` (stays heuristic-based)
- Prisma schema (no DB in this task)

### Key Functions

#### `calculateTaxForYear(grossIncome: number, year: number): number`
Pure bracket calculation. Iterates through brackets, sums tax per bracket.

#### `calculateCreditPoints(wizardState?: WizardState): number`
Maps wizard selections to credit point count. Returns 2.25 (base) if no wizard data.

#### `estimateRefund(input: EstimatorInput): RefundEstimate`
Main entry point:
```typescript
interface EstimatorInput {
  extracted106: Extracted106;
  wizardState?: WizardState;  // Optional enrichment
}
```

Logic:
1. Look up tax brackets for `extracted106.taxYear`
2. Calculate expected tax: `calculateTaxForYear(grossIncome, year)`
3. Calculate credit points: `calculateCreditPoints(wizardState)`
4. Subtract credit value: `expectedTax -= creditPoints × pointValue`
5. Ensure `expectedTax >= 0`
6. `estimatedRefund = taxDeducted - expectedTax` (floor at 0)
7. Map to confidence tier
8. Attach limitations array
9. Return `RefundEstimate`

#### Limitations Array (always populated)

```typescript
const STANDARD_LIMITATIONS = [
  "ההערכה מבוססת על מדרגות מס סטנדרטיות ונקודות זיכוי בסיסיות בלבד",
  "לא נכללים: ניכויים בגין פנסיה, משכנתא, תרומות, קרנות השתלמות",
  "ההחזר בפועל צפוי להיות גבוה יותר מההערכה",
  "אין לראות בהערכה זו ייעוץ מס או התחייבות לסכום כלשהו",
];
```

---

## VALIDATE

### Validation Artifacts

- Unit tests: `packages/core/src/calc/tax-calculator.test.ts`
- Unit tests: `packages/core/src/calc/credit-calculator.test.ts`
- Unit tests: `packages/core/src/calc/refund-estimator.test.ts`
- Unit tests: `packages/core/src/tax-tables/index.test.ts`

### Test Cases

#### Tax Calculator
1. Income 0 → tax 0
2. Income within first bracket only (50,000 in 2024) → 10% flat
3. Income spanning multiple brackets (200,000 in 2024) → correct progressive sum
4. Income in highest bracket (1,000,000 in 2024) → correct total
5. Each supported year (2020–2025) returns a value (no missing table)

#### Credit Calculator
1. No wizard state → 2.25 base points
2. Wizard with "ילדים מתחת לגיל 18" → base + child credit
3. Wizard with "סיום תואר" → base + academic credit
4. Wizard with multiple selections → cumulative points

#### Refund Estimator
1. **Sample PDF data** (from memory): gross 622,809, tax 167,596 (2024) → should show a specific estimate, verify determinism
2. Low income, high deduction → HIGH tier
3. Income with correct deduction → NONE tier (no refund)
4. Edge case: zero income → NONE
5. Edge case: zero tax deducted → NONE (no over-payment possible)
6. Verify `estimateVersion` is populated
7. Verify `limitations` array is non-empty
8. Verify determinism: same input × 100 → same output

### Success Criteria

- All tests pass
- `npx tsc --noEmit` passes from `packages/core/`
- Pure functions only — no IO, no imports from `apps/` or `packages/ingestion/`
- Every output carries version string
- Deterministic: verified by repeat-test

---

## ITERATE

### Outcome
- [x] Success

### Verified Against Real Data
Ran estimator against sample PDF (031394828_T106-sample.pdf):
- Gross: 622,809 ₪, Tax deducted: 167,596 ₪, Year: 2024
- Bracket tax: 182,789.43 ₪, Credit (2.25 pts): 6,534 ₪
- Calculated tax: 176,255.43 ₪ → Refund: 0 ₪ (NONE)
- Employer under-deducted by ~8,659 ₪ vs. bare brackets, meaning deductions (pension, education fund, child credits) were already applied at source
- This is correct conservative behavior — the estimator is a floor, not a ceiling

### Validation
- TypeScript typecheck: passes (both core + domain)
- Tests: 78 new tests, 339 total — all passing, zero regressions
- Determinism: verified with 100-iteration repeat test

### Knowledge Updates
- Tax bracket data sourced from Kol-Zchut (כל-זכות), verified against Form 135 explanatory notes
- 2025 brackets confirmed frozen at 2024 levels per state budget
- Credit point values: 2020=2,628, 2021=2,616, 2022=2,676, 2023=2,820, 2024-2025=2,904

### Follow-ups
- TASK-UI-007 integrates the estimator into the verified result screen
- Future: add pension/mortgage deductions (requires additional 106 fields or user input)
- Future: add gender question to wizard for +0.5 credit point accuracy
- Future: per-child credit points (wizard currently asks yes/no, not count/ages)
- Future: multiple-employer bracket correction model
- Future: extract employer-applied deductions from 106 to improve accuracy
