# TASK-002 – Ingestion Pipeline Skeleton (106) + Errors + Golden Harness

## PLAN

### Goal
Create a deterministic ingestion pipeline skeleton for Form 106 that:
- Produces a `Normalized106` object validated by Zod
- Separates stages clearly (extract → normalize → validate)
- Captures failures as structured errors
- Enables a golden-test harness (even if using placeholder fixtures initially)

### Inputs
- Domain schemas exist in `/packages/domain/src/schemas/*`
- `Normalized106Schema` exists and is stable enough to validate output

### Outputs
Create/modify only these files:

- `/packages/ingestion/src/pipelines/ingest-106.ts`
- `/packages/ingestion/src/extractors/pdf-text.ts` (stub ok)
- `/packages/ingestion/src/normalizers/normalize-106.ts` (stub ok but returns valid Normalized106)
- `/packages/ingestion/src/errors/ingestion-errors.ts`
- `/packages/ingestion/__tests__/golden/normalize-106.golden.test.ts`
- (Optional unit test) `/packages/ingestion/src/normalizers/normalize-106.test.ts`

### Constraints
- Deterministic output for same input
- No DB/Prisma access
- No external APIs
- No UI work
- Use Zod validation at the boundary: `Normalized106Schema.parse(...)`
- Golden test compares normalized output JSON to `/fixtures/106/normalized/*.expected.json`

### Open Questions
- If real PDF extraction is not ready, use a deterministic stub extractor returning fixed text for tests.

---

## IMPLEMENT

### Files Touched
Only the files listed in Outputs above.

---

## VALIDATE

### Validation Artifacts
- Golden test exists and runs
- Pipeline calls `Normalized106Schema.parse(...)`
- Errors are structured (stage + parserVersion + message)

### Success Criteria
- Pipeline compiles
- Golden test harness runs deterministically
- No DB introduced

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None

### Follow-ups
- TASK-003: Prisma models + migrations (after observed pipeline outputs)
