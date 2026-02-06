# TASK-012 – Extract Mandatory Fields from Hebrew Form 106 PDF

## PLAN

### Goal
Implement box-anchored extraction of mandatory fields from Form 106 PDFs, producing a validated `Extracted106` schema that will be used to populate Form 135.

This task covers:
- Box-anchored extraction logic for numeric fields
- New `Extracted106` Zod schema (replacing `Normalized106`)
- Error handling for ambiguous or missing mandatory fields
- Unit tests with real Form 106 fixtures

This task does NOT cover:
- OCR implementation (already done in TASK-009/010/011)
- Modifying existing OCR confidence scoring
- Form 135 population logic (future task)
- Non-mandatory field extraction

### Background

Form 106 is an annual employer statement in Israel containing employee income and deduction data. The current pipeline extracts text via pdftotext or Tesseract OCR, but does not parse specific fields. Hebrew text may be garbled, but **numeric values are always readable**.

The "numbers-first" approach:
1. Locate numeric patterns in extracted text
2. Use positional/contextual anchors (box numbers like "סה״כ הכנסה ממשכורת")
3. Map numbers to schema fields

### Prerequisites
- TASK-009 complete (Tesseract OCR implemented)
- TASK-010 complete (image-only PDF detection)
- TASK-011 complete (OCR confidence scoring)
- Test fixtures available at `/fixtures/106/raw/`

### Inputs
- OCR extractor: `/packages/ingestion/src/extractors/ocr-text.ts` (read-only, do not modify)
- Pipeline: `/packages/ingestion/src/pipelines/ingest-106.ts`
- Current schema: `/packages/domain/src/schemas/normalized-106.schema.ts`

### Outputs

**Files to Create:**
- `/packages/domain/src/schemas/extracted-106.schema.ts` — New Zod schema for extracted fields
- `/packages/ingestion/src/extractors/box-extractor.ts` — Box-anchored extraction logic
- `/packages/ingestion/src/extractors/box-extractor.test.ts` — Unit tests

**Files to Modify:**
- `/packages/domain/src/types/index.ts` — Export new `Extracted106` type
- `/packages/domain/src/index.ts` — Export new schema
- `/packages/ingestion/src/errors/ingestion-errors.ts` — Add `FIELD_AMBIGUOUS`, `MANDATORY_FIELD_MISSING`
- `/packages/ingestion/src/normalizers/normalize-106.ts` — Update to produce `Extracted106`
- `/packages/ingestion/src/pipelines/ingest-106.ts` — Use new schema

**Files to Remove/Replace:**
- `/packages/domain/src/schemas/normalized-106.schema.ts` — Replace with `extracted-106.schema.ts`

### Extracted106 Schema

```typescript
// /packages/domain/src/schemas/extracted-106.schema.ts
import { z } from "zod";
import { isValidIsraeliId } from "../validators/israeli-id.validator";
import { isValidTaxYear, MIN_TAX_YEAR, MAX_TAX_YEAR } from "../validators/tax-year.validator";
import { isValidMoney } from "../validators/money.validator";

const MoneySchema = z.number().refine(isValidMoney, {
  message: "Must be a non-negative finite number",
});

const TaxYearSchema = z.number().int().min(MIN_TAX_YEAR).max(MAX_TAX_YEAR).refine(isValidTaxYear, {
  message: `Tax year must be between ${MIN_TAX_YEAR} and ${MAX_TAX_YEAR}`,
});

const IsraeliIdSchema = z.string().refine(isValidIsraeliId, {
  message: "Invalid Israeli ID",
});

/**
 * Mandatory fields extracted from Form 106 for Form 135 population.
 * All fields required for tax return filing.
 */
export const Extracted106Schema = z.object({
  // Identification
  employeeId: IsraeliIdSchema,         // Box 1: מספר זהות עובד
  employerId: IsraeliIdSchema,         // Box 2: מספר מזהה מעסיק
  taxYear: TaxYearSchema,              // שנת מס

  // Income (boxes 42-49 area)
  grossIncome: MoneySchema,            // Box 42: סה"כ הכנסה ממשכורת
  taxableIncome: MoneySchema,          // Box 45: הכנסה חייבת במס

  // Deductions (boxes 36-41 area)
  taxDeducted: MoneySchema,            // Box 36: מס שנוכה
  socialSecurityDeducted: MoneySchema, // Box 38: ביטוח לאומי
  healthInsuranceDeducted: MoneySchema,// Box 39: ביטוח בריאות

  // Additional mandatory fields for Form 135
  pensionContribEmployee: MoneySchema, // Box 37: הפרשות עובד לפנסיה
  educationFundEmployee: MoneySchema,  // Box 40: קרן השתלמות עובד
});

export type Extracted106 = z.infer<typeof Extracted106Schema>;
```

### Error Codes to Add

```typescript
// Add to ingestion-errors.ts
export type NormalizationErrorCode =
  | "NORMALIZATION_FAILED"
  | "FIELD_NOT_FOUND"
  | "FIELD_INVALID"
  | "TEXT_GARBLED"
  | "FIELD_AMBIGUOUS"          // Multiple candidates for same field
  | "MANDATORY_FIELD_MISSING"; // Required field not found
```

### Box-Anchored Extraction Strategy

```typescript
// /packages/ingestion/src/extractors/box-extractor.ts

/**
 * Box anchor patterns for Form 106 fields.
 * Numbers-first approach: find numeric patterns, then anchor to box numbers.
 */
export const FIELD_ANCHORS = {
  employeeId: /מספר\s*זהות\s*עובד|ת\.ז\.\s*עובד/,
  employerId: /מספר\s*מזהה\s*מעסיק|ח\.פ\./,
  taxYear: /שנת\s*מס/,
  grossIncome: /סה"כ\s*הכנסה\s*ממשכורת|משבצת\s*42/,
  taxableIncome: /הכנסה\s*חייבת\s*במס|משבצת\s*45/,
  taxDeducted: /מס\s*שנוכה|משבצת\s*36/,
  socialSecurityDeducted: /ביטוח\s*לאומי|משבצת\s*38/,
  healthInsuranceDeducted: /ביטוח\s*בריאות|משבצת\s*39/,
  pensionContribEmployee: /הפרשות\s*עובד\s*לפנסיה|משבצת\s*37/,
  educationFundEmployee: /קרן\s*השתלמות\s*עובד|משבצת\s*40/,
} as const;

/**
 * Extract a field value using box anchors.
 * Returns the closest numeric value to the anchor pattern.
 */
export function extractFieldByAnchor(
  text: string,
  fieldName: keyof typeof FIELD_ANCHORS
): { value: number; confidence: number } | null;

/**
 * Extract all mandatory fields from Form 106 text.
 * Throws MANDATORY_FIELD_MISSING if required fields cannot be found.
 * Throws FIELD_AMBIGUOUS if multiple candidates with similar confidence.
 */
export function extractMandatoryFields(text: string): Extracted106;
```

### Extraction Flow

```
OCR/pdftotext output
        │
        ▼
extractMandatoryFields()
        │
        ├── For each field in FIELD_ANCHORS:
        │       │
        │       ▼
        │   extractFieldByAnchor()
        │       │
        │       ├── Find anchor pattern
        │       ├── Locate nearby numbers
        │       └── Score by proximity
        │
        ▼
Validate against Extracted106Schema
        │
        ├── Missing field → MANDATORY_FIELD_MISSING
        ├── Ambiguous field → FIELD_AMBIGUOUS
        └── Valid → Extracted106
```

### Test Fixtures

Use existing fixtures with forward slashes:
- `/fixtures/106/raw/sample-106-scanned.pdf`
- `/fixtures/106/raw/sample-106-text.pdf`

### Constraints
- No new npm dependencies
- Must not modify OCR extraction code (TASK-009/010/011)
- All numeric patterns must handle Hebrew comma separators (1,234.56 → 1234.56)
- Israeli ID validation via existing validator
- Extraction must handle RTL text positioning

### Edge Cases to Handle

1. **Multiple same-value numbers** — Use anchor proximity scoring
2. **Garbled Hebrew but clear numbers** — Numbers-first extraction still works
3. **Missing non-mandatory field** — Set to 0 with warning
4. **Swapped columns** — Anchor patterns help disambiguate
5. **Multi-page PDFs** — Aggregate across pages

---

## IMPLEMENT

### Files Touched
1. `/packages/domain/src/schemas/extracted-106.schema.ts` — new schema
2. `/packages/domain/src/types/index.ts` — export type
3. `/packages/domain/src/index.ts` — export schema
4. `/packages/ingestion/src/errors/ingestion-errors.ts` — new error codes
5. `/packages/ingestion/src/extractors/box-extractor.ts` — extraction logic
6. `/packages/ingestion/src/extractors/box-extractor.test.ts` — tests
7. `/packages/ingestion/src/normalizers/normalize-106.ts` — update
8. `/packages/ingestion/src/pipelines/ingest-106.ts` — use new schema

No other files may be modified without updating the PLAN.

---

## VALIDATE

### Success Criteria
- [ ] `Extracted106Schema` created with all mandatory fields
- [ ] Box-anchored extraction finds fields in test fixtures
- [ ] `FIELD_AMBIGUOUS` thrown for ambiguous extractions
- [ ] `MANDATORY_FIELD_MISSING` thrown for missing required fields
- [ ] Unit tests cover extraction logic
- [ ] TypeScript compiles without errors
- [ ] Existing OCR code unchanged

### Verification Steps
1. Run `npx tsc --noEmit` in packages/domain
2. Run `npx tsc --noEmit` in packages/ingestion
3. Run `npm test -- box-extractor` for unit tests
4. Test with real Form 106 PDF fixture

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Follow-ups
- TASK-013: Form 135 population from Extracted106
- Future: Non-mandatory field extraction
- Future: Field-level confidence tracking
