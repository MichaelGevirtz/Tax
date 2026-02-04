# TASK-005 – Persist Ingestion Outputs (Extraction + ParsingFailure) via Orchestrator (No DB in ingestion)

## PLAN

### Goal
Persist ingestion results to the database WITHOUT introducing Prisma/DB dependencies into `/packages/ingestion`.

Implement an orchestration function that:
- Calls the existing ingestion pipeline (TASK-002) to produce a normalized payload
- On success:
  - Writes an `Extraction` row (documentId, parserVersion, stage, payload, optional checksum)
  - Updates `Document.status` to `PROCESSED`
- On failure:
  - Writes a `ParsingFailure` row (documentId, parserVersion, stage, error JSON)
  - Updates `Document.status` to `FAILED`

### Inputs
- Ingestion pipeline exists:
  - `/packages/ingestion/src/pipelines/ingest-106.ts`
- Structured errors exist:
  - `/packages/ingestion/src/errors/ingestion-errors.ts`
- DB repos exist:
  - `/packages/adapters/src/db/document.repo.ts`
  - `/packages/adapters/src/db/extraction.repo.ts`
  - `/packages/adapters/src/db/parsing-failure.repo.ts`

### Outputs
Create a thin orchestrator in the app layer (Next.js) that coordinates ingestion + DB writes.

Files to create/modify:

**Orchestrator**
- `/apps/web/src/server/ingestion/ingest106-and-persist.ts`

**API Route wiring (minimal)**
- `/apps/web/app/api/ingestion/route.ts`  
  Implement POST handler that:
  - accepts `{ documentId: string, parserVersion?: string }`
  - calls orchestrator
  - returns JSON `{ ok: true }` or `{ ok: false, error: ... }`

**Server folder structure**
- `/apps/web/src/server/ingestion/` (create if missing)

### Constraints
- Do NOT import Prisma client directly outside repos
- Do NOT add DB code inside `/packages/ingestion`
- Keep orchestrator deterministic:
  - same input document + same parserVersion should result in same payload and same extraction stage
- Do NOT store raw PDF/OCR text in DB
- Use existing error types; store structured error JSON only
- Use `ExtractionStage.NORMALIZED_106` and `DocumentType.FORM_106` semantics where applicable
- No authentication in this task (assume internal call / later)

### Persistence Rules (Exact)
Success path:
1) `updateDocumentStatus(documentId, "PROCESSED")` should happen AFTER extraction insert succeeds
2) Create `Extraction` with:
   - documentId
   - parserVersion (default "v1" if not provided)
   - stage: NORMALIZED_106
   - payload: normalized object
   - checksum: optional (can be omitted)

Failure path:
1) Create `ParsingFailure` with:
   - documentId
   - parserVersion
   - stage: map from error.stage or default "validation"
   - error: JSON safe payload (no raw pdf text)
2) Set document status to FAILED

### Open Questions
None.

---

## IMPLEMENT

### Files Touched
Only the files listed in Outputs.

---

## VALIDATE

### Validation Artifacts
- Typecheck passes
- Existing ingestion tests still pass (including golden tests)
- Add a minimal unit test (optional) for orchestrator error mapping if easy
- API route compiles and returns structured JSON

### Success Criteria
- Ingestion can be triggered via POST `/api/ingestion`
- On success: Extraction row written and Document status becomes PROCESSED
- On failure: ParsingFailure row written and Document status becomes FAILED
- No Prisma imports outside adapters repos
- No DB access code in packages/ingestion
