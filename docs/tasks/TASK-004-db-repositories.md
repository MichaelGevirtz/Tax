# TASK-004 – DB Repositories (Prisma Adapters Layer)

## PLAN

### Goal
Create a clean DB access layer (repositories) under `/packages/adapters/src/db/` that:
- Encapsulates Prisma usage behind explicit methods
- Provides minimal CRUD for core models
- Prevents Prisma usage from leaking into ingestion/core layers
- Keeps code deterministic and testable (DB access isolated)

This task DOES NOT wire ingestion to DB and does not add business logic.

### Inputs
- Prisma schema and migrations exist (TASK-003 completed)
- Prisma client generation works
- Folder structure exists:
  - `/packages/adapters/src/db/`

### Outputs
Create/modify only these files:

**Prisma client wrapper**
- `/packages/adapters/src/db/prisma.ts`

**Repositories**
- `/packages/adapters/src/db/user.repo.ts`
- `/packages/adapters/src/db/document.repo.ts`
- `/packages/adapters/src/db/extraction.repo.ts`
- `/packages/adapters/src/db/calculation.repo.ts`
- `/packages/adapters/src/db/parsing-failure.repo.ts`

**Exports**
- `/packages/adapters/src/index.ts`
- `/packages/adapters/src/db/index.ts` (if missing; optional but preferred)

### Repository API (Minimum Methods)

#### user.repo.ts
- `createUser(data)` (email required)
- `getUserById(id)`
- `getUserByEmail(email)`
- `updateUser(id, data)`

#### document.repo.ts
- `createDocument(data)`
- `getDocumentById(id)`
- `listDocumentsByUser(userId)`
- `updateDocumentStatus(id, status)`
- `setDocumentTaxYear(id, taxYear)`

#### extraction.repo.ts
- `createExtraction(data)`
- `listExtractionsByDocument(documentId)`
- `getExtractionByUnique(documentId, parserVersion, stage)` (if unique exists)
- `getLatestExtraction(documentId, stage)` (order by createdAt desc)

#### calculation.repo.ts
- `createCalculation(data)`
- `listCalculationsByUser(userId)`
- `getCalculationById(id)`
- `listCalculationsByUserAndYear(userId, taxYear)`

#### parsing-failure.repo.ts
- `createParsingFailure(data)`
- `listFailuresByDocument(documentId)`

### Constraints
- Do NOT add new libraries/tools
- Do NOT change Prisma schema or migrations
- Do NOT implement orchestration/business logic (no ingestion pipeline changes)
- Repos must be thin and explicit (no “smart” behavior)
- No PII logging (repos should not log; callers handle logging with redaction)
- Keep method signatures typed using Prisma types where appropriate

### Open Questions
None.

---

## IMPLEMENT

### Files Touched
Only the files listed in Outputs.

---

## VALIDATE

### Validation Artifacts
- TypeScript compiles (typecheck)
- Imports/exports are correct
- Repository methods map to Prisma operations cleanly
- No changes to Prisma schema/migrations

### Success Criteria
- Prisma usage exists only inside `/packages/adapters/src/db/*`
- Repos provide minimal, usable APIs for next tasks
- No additional dependencies introduced
