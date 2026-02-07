# TASK-014: End-to-End Pipeline Golden Test

## Goal

Add a golden test that validates the **full** `ingest106FromPdf` pipeline against a hand-verified expected JSON, ensuring the complete flow (PDF → pdftotext → garbled detection → OCR fallback → box extraction → Zod validation) produces correct results.

## Motivation

- TASK-009 (OCR pipeline) and TASK-013 (7-field schema) are complete
- Individual stages have golden tests, but no test covers the full pipeline end-to-end
- Need a human-verified ground truth to catch regressions
- 5 of 7 FIELD_ANCHORS don't match actual OCR output from Tesseract — must be fixed

## Anchor Fixes Required

The current anchors were written for idealized labels. Real OCR from Form 106 uses different wording:

| Field | Current Anchor | OCR Text | Fix |
|-------|---------------|----------|-----|
| employeeId | `מספר זהות עובד` | "מספר זהות" (no עובד after) | Add `מספר\s*זהות` as alternative |
| employerId | `מספר מזהה מעסיק` | "תיק ניכויים" | Add `תיק\s*ניכויים` as alternative |
| grossIncome | `סה"כ הכנסה ממשכורת` | "סהייכ" (OCR misread), "משכורת" | Add `משכורת` and `סה.{0,3}כ` alternatives |
| taxDeducted | `מס שנוכה` | "מס הכנסה" | Add `מס\s*הכנסה` as alternative |
| healthInsurance | `ביטוח בריאות` | "דמי בריאות" | Add `דמי\s*בריאות` as alternative |

## Plan

### 1. Fix FIELD_ANCHORS in `box-extractor.ts`
- Update 5 anchor regexes to also match OCR output patterns
- Keep existing patterns (backward compat), add alternatives with `|`

### 2. Update box-extractor tests
- Add test cases for OCR-style text patterns

### 3. Create expected fixture
- `fixtures/106/normalized/031394828_T106-sample.expected.json`
- User fills in 7 field values from the PDF

### 4. Create full-pipeline golden test
- `packages/ingestion/__tests__/golden/ingest-106.golden.test.ts`
- Calls `ingest106FromPdf(samplePdf, { enableOcrFallback: true })`
- Compares `result.data` against expected JSON

## Acceptance Criteria

- [ ] 5 FIELD_ANCHORS updated to match real OCR output
- [ ] Expected JSON filled with correct values from PDF
- [ ] Golden test passes with OCR fallback
- [ ] Determinism verified
- [ ] All existing tests still pass
- [ ] Typecheck passes
