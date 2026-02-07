# TASK-013 – Reduce Mandatory Fields to Match Actual Form 106

## PLAN

### Goal
Correct the `Extracted106` schema and extraction pipeline to reflect the 7 fields that actually appear on Form 106, removing 3 fields that are either computed or absent from the form.

This task covers:
- Removing `taxableIncome`, `pensionContribEmployee`, `educationFundEmployee` from mandatory extraction
- Updating Zod schema, box extractor, stub extractor, tests, and fixtures

This task does NOT cover:
- Adding these fields back as optional/computed fields (future task)
- Any changes to OCR, pipeline orchestration, or normalization logic
- Form 135 population

### Background

Visual inspection of the real Form 106 PDF (`031394828_T106-sample.pdf`, tax year 2024) revealed that only 7 of the 10 "mandatory" fields exist as actual printed boxes on the form:

| Field | Status | Reason |
|-------|--------|--------|
| `taxableIncome` | **Remove** | Not a printed box on Form 106. Taxable income is a computed value, not reported directly. |
| `pensionContribEmployee` | **Remove** | No explicit employee pension contribution box. Box [086,045] is "קופת גמל 35% זיכוי" (provident fund tax credit), a different concept. |
| `educationFundEmployee` | **Remove** | No employee education fund (קרן השתלמות עובד) deduction line on the form. Only employer-side value appears. |

The 7 fields that remain mandatory (confirmed present on real PDF):
1. `employeeId` — מספר זהות (031394828)
2. `employerId` — תיק ניכויים (921513545)
3. `taxYear` — שנת מס (2024)
4. `grossIncome` — סה"כ תשלומים (622,809)
5. `taxDeducted` — מס הכנסה [042] (167,596)
6. `socialSecurityDeducted` — ביטוח לאומי (35,220)
7. `healthInsuranceDeducted` — דמי בריאות (27,708)

### Prerequisites
- TASK-012 complete (box-anchored extraction implemented)
- Real PDF visually verified

### Outputs

**Files to Modify:**

1. `packages/domain/src/schemas/extracted-106.schema.ts`
   - Remove `taxableIncome`, `pensionContribEmployee`, `educationFundEmployee` from Zod schema
   - Type `Extracted106` auto-updates via `z.infer`

2. `packages/ingestion/src/extractors/box-extractor.ts`
   - Remove 3 entries from `FIELD_ANCHORS`
   - Remove 3 entries from `MANDATORY_FIELDS` (10 → 7)
   - Update `tryParseStubFormat()`: remove parsing/return of the 3 fields

3. `packages/ingestion/src/extractors/pdf-text.ts`
   - Remove 3 lines from `extractPdfTextStub()` raw text template

4. `packages/ingestion/src/extractors/box-extractor.test.ts`
   - Remove assertions for the 3 fields
   - Remove tests specific to defaults (taxableIncome→grossIncome, pension/education→0)
   - Update stub text fixtures in tests

5. `packages/ingestion/src/normalizers/normalize-106.test.ts`
   - Remove 3 assertions for the dropped fields

6. `fixtures/106/normalized/stub.expected.json`
   - Remove the 3 field keys

**Files NOT Modified (no changes needed):**
- `normalize-106.ts` — delegates to box-extractor
- `ingest-106.ts` — pipeline orchestration, no direct field refs
- `packages/domain/src/types/index.ts` — uses `z.infer`, auto-updates
- Golden test files — don't reference these fields directly
- `fixtures/106/normalized/031394828_T106-sample.template.json` — already has only 7 fields

### Constraints
- No new dependencies
- No changes to OCR or pipeline orchestration code
- Schema remains the single source of truth (Zod-first)

---

## IMPLEMENT

### Files Touched
1. `packages/domain/src/schemas/extracted-106.schema.ts` — remove 3 fields
2. `packages/ingestion/src/extractors/box-extractor.ts` — remove anchors, mandatory list, stub parser
3. `packages/ingestion/src/extractors/pdf-text.ts` — remove stub lines
4. `packages/ingestion/src/extractors/box-extractor.test.ts` — update tests
5. `packages/ingestion/src/normalizers/normalize-106.test.ts` — update assertions
6. `fixtures/106/normalized/stub.expected.json` — remove 3 keys

No other files may be modified without updating the PLAN.

---

## VALIDATE

### Success Criteria
- [ ] `Extracted106Schema` has exactly 7 fields
- [ ] `MANDATORY_FIELDS.length === 7`
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` — all tests pass
- [ ] No references to removed fields in production code
- [ ] Existing OCR/pipeline code unchanged

### Verification Steps
1. Run `npx tsc --noEmit` across workspace
2. Run `npx vitest run` for full test suite
3. Grep for removed field names to confirm no stale references

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Follow-ups
- Future: Re-add `taxableIncome`, `pensionContribEmployee`, `educationFundEmployee` as optional fields
- Future: Computed field derivation (e.g., taxableIncome = grossIncome - exemptions)
- TASK for end-to-end pipeline validation with Tesseract on real PDF
