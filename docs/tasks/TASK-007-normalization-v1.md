# TASK-007 – Form 106 Normalization v1 (Extracted Text → Normalized106)

## PLAN

### Goal
Implement a deterministic normalizer that converts extracted text from Form 106 PDFs into a validated `Normalized106` object.

This task covers:
- Real normalization (replacing regex stub)
- Parsing of 7 required fields from extracted text
- Structured error handling for unparseable text
- Golden tests comparing normalized output to expected fixtures

This task does NOT cover:
- OCR for image-only or CID-garbled PDFs
- Schema modifications (all 7 fields remain required)
- Database persistence
- New npm dependencies

### Inputs
- Extracted text from TASK-006: `/packages/ingestion/src/extractors/pdf-text.ts`
- Existing normalizer stub: `/packages/ingestion/src/normalizers/normalize-106.ts`
- Domain schema: `/packages/domain/src/schemas/normalized-106.schema.ts`
- Existing errors: `/packages/ingestion/src/errors/ingestion-errors.ts`

### Outputs

**Files to modify:**
- `/packages/ingestion/src/normalizers/normalize-106.ts` — real implementation
- `/packages/ingestion/src/errors/ingestion-errors.ts` — add NormalizationErrorCode

**Files to create/update:**
- `/packages/ingestion/__tests__/golden/normalize-106.golden.test.ts` — enhanced tests
- `/fixtures/106/normalized/<sample>.expected.json` — expected outputs

**Fixture Creation Process:**
1. Claude creates JSON template with all 7 field names and placeholder values
2. User fills in actual values by reading the source PDF
3. This ensures human verification of tax data accuracy

### Required Fields (from Normalized106Schema)

All 7 fields are **required** — normalization MUST extract all or fail:

| Field | Type | Source in Form 106 |
|-------|------|-------------------|
| `employeeId` | Israeli ID (9 digits, checksum) | תעודת זהות העובד |
| `employerId` | Israeli ID (9 digits, checksum) | מספר מעסיק |
| `taxYear` | Integer (2010 to current+1) | שנת מס |
| `grossIncome` | Non-negative number | סה"כ הכנסה ברוטו |
| `taxDeducted` | Non-negative number | מס הכנסה שנוכה |
| `socialSecurityDeducted` | Non-negative number | ביטוח לאומי |
| `healthInsuranceDeducted` | Non-negative number | ביטוח בריאות |

### Normalization Strategy (v1)

**For PDFs with working text layers:**
1. Parse text looking for field patterns (position-based or label-based)
2. Extract and validate Israeli IDs (must pass checksum)
3. Extract tax year (4-digit year)
4. Extract monetary amounts (handle thousands separators)
5. Validate all 7 fields are present
6. Return `Normalized106` object

**For PDFs with CID-garbled or missing text:**
- Fail immediately with `NORMALIZATION_FAILED`
- Do NOT guess or use placeholder values
- Defer to future OCR task

### Error Handling

Add to `/packages/ingestion/src/errors/ingestion-errors.ts`:

```typescript
export type NormalizationErrorCode =
  | "NORMALIZATION_FAILED"      // Generic normalization failure
  | "FIELD_NOT_FOUND"           // Required field missing
  | "FIELD_INVALID"             // Field found but invalid format
  | "TEXT_GARBLED";             // CID/font mapping issues detected
```

Error rules:
- Stage: `"normalize"`
- MUST NOT include raw extracted text in error payload
- MAY include: field name, expected format, character count, hash

### Determinism Rules
- Same extracted text → identical normalized JSON
- No random IDs or timestamps
- Consistent number parsing (strip separators, convert to number)
- If arrays exist, sort deterministically

### Constraints
- No database/Prisma
- No external APIs
- No OCR
- No schema modifications
- No new npm dependencies
- Must pass `Normalized106Schema.parse()` or throw

### Open Questions
None. Garbled PDFs fail; OCR is deferred.

---

## IMPLEMENT

### Files Touched
1. `/packages/ingestion/src/errors/ingestion-errors.ts` — add NormalizationErrorCode
2. `/packages/ingestion/src/normalizers/normalize-106.ts` — replace stub
3. `/packages/ingestion/__tests__/golden/normalize-106.golden.test.ts` — enhance tests
4. `/fixtures/106/normalized/*.expected.json` — add/update fixtures

No other files may be modified without updating the PLAN.

---

## VALIDATE

### Validation Artifacts

**Golden tests must verify:**
1. Sample PDF with working text layer normalizes correctly
2. Normalized output matches expected JSON fixture exactly
3. Same text normalized twice produces identical output
4. Missing required field throws `NORMALIZATION_FAILED` with `FIELD_NOT_FOUND`
5. Invalid field format throws with `FIELD_INVALID`
6. Error messages do NOT contain raw extracted text

**TypeScript:**
- `npx tsc --noEmit` passes

**Schema validation:**
- `Normalized106Schema.parse(result)` succeeds for valid PDFs

### Success Criteria
- [ ] Normalizer produces valid Normalized106 for PDFs with working text
- [ ] Deterministic output (same input → same output)
- [ ] Golden tests fail if output format changes
- [ ] Garbled PDFs fail gracefully with clear error
- [ ] No raw text in error payloads
- [ ] No schema changes
- [ ] No new dependencies

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- Document which Form 106 formats/years are supported

### Follow-ups
- TASK-008: OCR strategy for CID-garbled / image-only PDFs
- TASK-009: Multi-employer Form 106 support (if needed)
