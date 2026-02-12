# TASK-019 — Ingestion API: File Upload + Real Pipeline

## PLAN

### Goal

Rewrite `POST /api/ingestion` to:
1. Accept a real PDF file via `multipart/form-data` (currently accepts `{ documentId }` JSON and calls a stub)
2. Run the real `ingest106FromPdf()` pipeline (currently calls `ingest106Stub()`)
3. Run the TASK-017 refund estimator on successful extraction
4. Return the full `Extracted106` data + confidence tier to the frontend
5. Persist Document + Extraction/ParsingFailure records

This is backend-only. No UI changes. The frontend (TASK-UI-007) will call this API.

### Current State

**API route:** `apps/web/app/api/ingestion/route.ts`
- Accepts JSON: `{ documentId: string }`
- Calls `ingest106AndPersist()` which calls `ingest106Stub()` (deterministic test data)
- Returns `{ ok: true }` or `{ ok: false, error }` — does NOT return extracted data

**Server logic:** `apps/web/src/server/ingestion/ingest106-and-persist.ts`
- Receives `documentId`, calls `ingest106Stub()`, creates Extraction or ParsingFailure rows
- Does NOT accept a file, does NOT call the real pipeline

**Working pipeline:** `packages/ingestion/src/pipelines/ingest-106.ts`
- `ingest106FromPdf(filePath, options)` → fully working (pdftotext → OCR fallback → normalize → validate)
- Returns `IngestionResult` with `data: Extracted106` on success

**Estimator:** `packages/core/src/calc/refund-estimator.ts`
- `estimateRefund({ extracted106, wizardState? })` → `RefundEstimate | null`
- Pure function, fully tested (TASK-017 done)

**DB models (Prisma):**
- `Document` — already has: `userId`, `type`, `status`, `taxYear`, `originalFileName`, `storageKey`
- `Extraction` — already has: `documentId`, `parserVersion`, `stage`, `payload`, `checksum`
- `ParsingFailure` — already has: `documentId`, `parserVersion`, `stage`, `error`
- `User` — required FK for Document. **Problem:** we don't have auth yet. See Open Questions.

**Adapters:** `packages/adapters/src/db/`
- `createDocument(data)`, `updateDocumentStatus(id, status)`, `setDocumentTaxYear(id, year)`
- `createExtraction(data)`, `createParsingFailure(data)`

**Storage:** `packages/adapters/src/storage/storage.ts` — exists but is empty (no implementation).

### Inputs

- HTTP request: `multipart/form-data` with a PDF file field
- Optional: `wizardState` JSON (for estimator enrichment)

### Outputs

New API contract:

```typescript
// ── Success ──
{
  success: true;
  data: {
    employeeId: string;
    employerId: string;
    taxYear: number;
    grossIncome: number;
    taxDeducted: number;
    socialSecurityDeducted: number;
    healthInsuranceDeducted: number;
  };
  extractionMethod: "pdftotext" | "ocr_tesseract";
  parserVersion: string;
  estimate: {
    confidenceTier: "HIGH" | "MODERATE" | "LOW" | "NONE";
    estimateVersion: string;
  } | null;  // null if estimator returns null (unsupported year)
  documentId: string;  // For future reference (payment, download)
}

// ── Error ──
{
  success: false;
  error: {
    code: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "PARSE_FAILED" | "NOT_FORM_106" | "OCR_QUALITY_LOW" | "INTERNAL_ERROR";
    message: string;       // Hebrew user-facing message
    stage?: string;        // Pipeline stage that failed
  };
}
```

### Constraints

- **PII handling:** raw PDF content, file names, and extracted data are PII. Never log raw payloads. Use `redact()` for any logging. (`CLAUDE.md §PII`)
- **File size limit:** 10MB max per file. Reject larger files before processing.
- **File type:** Accept only `application/pdf`. Validate MIME type + extension.
- **Temp file cleanup:** Uploaded PDFs are saved to a temp directory for pipeline processing, then deleted after ingestion (success or failure).
- **No auth required:** Per decision log v1.1 — "No login required before upload." See Open Questions for User/Document FK handling.
- **OCR fallback enabled:** Always pass `enableOcrFallback: true` to the pipeline (most Form 106 PDFs are CID-garbled).
- **Deterministic:** Same file → same extraction result (pipeline is already deterministic).
- **Do not modify `packages/ingestion/`** — the pipeline works. This task wraps it.

### Open Questions

1. **User FK for Document model:** Document requires `userId` (FK to User). But we don't have auth yet — users are anonymous at upload time.
   - **Recommendation:** Create an "anonymous session" approach: generate a session ID (stored in cookie or returned to client), create a lightweight anonymous User record or make `userId` optional on Document. The simplest v1 approach: make `Document.userId` optional in Prisma (nullable FK) and link it to a real User later at payment/account creation.

2. **File storage:** `storage.ts` is empty. Where do uploaded PDFs go?
   - **Recommendation for v1:** Save to a temp directory (`os.tmpdir()`), process, then delete. No persistent file storage needed yet — the extracted data is persisted in the Extraction row. Persistent storage (S3/local) can come later when we need to re-process or serve the original document.

3. **Document `storageKey`:** Required field in Prisma. What value?
   - **Recommendation:** Use `temp://{filename}` for temp-only storage. Or make `storageKey` optional. The field exists for future S3/cloud storage.

---

## IMPLEMENT

### Architecture

```
apps/web/
├── app/api/ingestion/route.ts          ← Rewrite (multipart handler)
└── src/server/ingestion/
    ├── ingest106-and-persist.ts        ← Rewrite (accept file, call real pipeline)
    └── parse-upload.ts                 ← Create (multipart parsing helper)
```

### Step-by-Step

#### 1. Multipart Form Parsing (`apps/web/src/server/ingestion/parse-upload.ts`)

Next.js App Router supports `request.formData()` natively. Create a helper:

```typescript
export interface ParsedUpload {
  file: Buffer;
  fileName: string;
  mimeType: string;
  wizardState?: WizardCreditsInput;
}

export async function parseUpload(request: NextRequest): Promise<ParsedUpload>
```

- Extract file from `formData.get("file")`
- Extract optional `wizardState` from `formData.get("wizardState")` (JSON string)
- Validate: file exists, MIME type is `application/pdf`, size ≤ 10MB
- Return buffer + metadata, or throw typed error

#### 2. Rewrite `ingest106AndPersist` (`apps/web/src/server/ingestion/ingest106-and-persist.ts`)

New signature:

```typescript
export interface Ingest106Input {
  file: Buffer;
  fileName: string;
  wizardState?: WizardCreditsInput;
}

export interface Ingest106Success {
  success: true;
  data: Extracted106;
  extractionMethod: ExtractionMethod;
  parserVersion: string;
  estimate: { confidenceTier: ConfidenceTier; estimateVersion: string } | null;
  documentId: string;
}

export interface Ingest106Error {
  success: false;
  error: {
    code: string;
    message: string;
    stage?: string;
  };
}

export type Ingest106Result = Ingest106Success | Ingest106Error;

export async function ingest106AndPersist(input: Ingest106Input): Promise<Ingest106Result>
```

Logic:
1. Write `file` buffer to a temp file (`os.tmpdir()` + random name)
2. Create Document record (userId = null, status = UPLOADED, storageKey = temp path, originalFileName = fileName)
3. Call `ingest106FromPdf(tempPath, { enableOcrFallback: true })`
4. **On success:**
   - Create Extraction record (payload = extracted data)
   - Update Document status → PROCESSED, set taxYear
   - Run `estimateRefund({ extracted106: data, wizardState })`
   - Delete temp file
   - Return success with data + estimate
5. **On failure:**
   - Create ParsingFailure record
   - Update Document status → FAILED
   - Delete temp file
   - Map error code to Hebrew user-facing message
   - Return error

#### 3. Rewrite API Route (`apps/web/app/api/ingestion/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  // 1. Parse multipart upload (validates file type + size)
  // 2. Call ingest106AndPersist()
  // 3. Return JSON response
}
```

HTTP status codes:
- `200` — success
- `400` — invalid file type, file too large, missing file
- `422` — parse failed, not Form 106, OCR quality low
- `500` — internal error

#### 4. Hebrew Error Messages

Map error codes to user-facing messages:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_TYPE: "יש להעלות קובץ PDF בלבד",
  FILE_TOO_LARGE: "הקובץ גדול מדי. הגודל המרבי הוא 10MB",
  PARSE_FAILED: "לא הצלחנו לקרוא את הקובץ. נסו לסרוק מחדש באיכות גבוהה יותר",
  NOT_FORM_106: "הקובץ לא נראה כטופס 106. ודאו שהעלתם את הטופס הנכון",
  OCR_QUALITY_LOW: "איכות הסריקה נמוכה מדי. נסו לסרוק מחדש באיכות גבוהה יותר",
  INTERNAL_ERROR: "שגיאה פנימית. נסו שנית מאוחר יותר",
};
```

#### 5. Prisma Schema Change

Make `userId` optional on Document to support anonymous uploads:

```prisma
model Document {
  id               String         @id @default(cuid())
  userId           String?        // ← nullable until auth/payment
  type             DocumentType
  status           DocumentStatus
  taxYear          Int?
  originalFileName String?        // @pii
  storageKey       String
  uploadedAt       DateTime       @default(now())
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  user            User?            @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ...
}
```

Run `npx prisma migrate dev --name make-document-user-optional` after change.

### Files Touched

| File | Action |
|---|---|
| `apps/web/app/api/ingestion/route.ts` | Rewrite |
| `apps/web/src/server/ingestion/ingest106-and-persist.ts` | Rewrite |
| `apps/web/src/server/ingestion/parse-upload.ts` | Create |
| `prisma/schema.prisma` | Modify (userId nullable on Document) |
| `packages/adapters/src/db/document.repo.ts` | May need minor update for nullable userId |

**Do NOT touch:**
- `packages/ingestion/` — pipeline works, we only call it
- `packages/core/` — estimator works, we only call it
- `packages/domain/` — schemas are fine
- Any UI files
- `SoftResult.tsx`, wizard, or other frontend components

### Error Code Mapping

Map pipeline `IngestionErrorCode` to API error codes:

| Pipeline Code | API Code | HTTP |
|---|---|---|
| `PDF_INVALID_FORMAT` | `INVALID_FILE_TYPE` | 400 |
| `PDF_TOO_LARGE` | `FILE_TOO_LARGE` | 400 |
| `PDF_SECURITY_RISK` | `PARSE_FAILED` | 422 |
| `PDF_PASSWORD_REQUIRED` | `PARSE_FAILED` | 422 |
| `PDF_EXTRACTION_FAILED` | `PARSE_FAILED` | 422 |
| `TEXT_GARBLED` (after OCR fail) | `PARSE_FAILED` | 422 |
| `MANDATORY_FIELD_MISSING` | `NOT_FORM_106` | 422 |
| `OCR_QUALITY_CRITICAL` | `OCR_QUALITY_LOW` | 422 |
| (any other) | `INTERNAL_ERROR` | 500 |

---

## VALIDATE

### Validation Artifacts

- Integration test: `apps/web/src/server/ingestion/ingest106-and-persist.test.ts`
  - Mock `ingest106FromPdf` to return success → verify Document + Extraction created, response shape correct
  - Mock to return failure → verify ParsingFailure created, error response shape
  - Mock `estimateRefund` → verify estimate included in response

- API route test (if feasible): send multipart request, verify response format

- Manual test: `curl` or Postman POST with sample PDF → verify full flow

### Test with Sample PDF

Use `031394828_T106-sample.pdf` (from project memory):
- Expected: success, employeeId=031394828, employerId=921513545, taxYear=2024, gross=622809, tax=167596
- Expected estimate: should be a valid confidence tier (likely HIGH given the numbers)

### Success Criteria

1. `POST /api/ingestion` accepts `multipart/form-data` with a PDF file
2. Returns full `Extracted106` data on success (not just `{ ok: true }`)
3. Returns refund estimate confidence tier on success
4. Returns structured Hebrew error messages on failure
5. Creates Document + Extraction records on success
6. Creates Document + ParsingFailure records on failure
7. Temp files are always cleaned up (success and failure paths)
8. No PII in logs (file content, extracted data, file names)
9. `userId` nullable on Document (Prisma migration applied)
10. TypeScript typechecks: `cd apps/web && npx tsc --noEmit`
11. Existing tests still pass: `npx vitest run`

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None expected

### Follow-ups
- **TASK-UI-007:** Frontend upload page (calls this API)
- **TASK-015:** PDF security validation hardening
- Future: persistent file storage (S3/local) instead of temp-only
- Future: link anonymous Documents to User at payment/account creation
