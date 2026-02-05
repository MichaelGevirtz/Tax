# TASK-006 – Form 106 PDF Text Extraction (Poppler pdftotext)

## PLAN

### Goal
Implement a deterministic PDF text extractor for Form 106 using Poppler's `pdftotext` binary.

This task covers:
- Real PDF extraction (replacing the existing stub)
- Password-protected PDF support
- Structured error handling
- Golden tests for extraction output

This task does NOT cover:
- Normalization (PDF text → structured data)
- OCR for image-only PDFs
- Database persistence
- Any npm library additions

### Inputs
- Existing extractor stub: `/packages/ingestion/src/extractors/pdf-text.ts`
- Existing error types: `/packages/ingestion/src/errors/ingestion-errors.ts`
- Existing pipeline: `/packages/ingestion/src/pipelines/ingest-106.ts`

### Outputs

**Files to modify:**
- `/packages/ingestion/src/extractors/pdf-text.ts`
- `/packages/ingestion/src/pipelines/ingest-106.ts` (if signature changes require it)

**Files to create:**
- `/packages/ingestion/__tests__/golden/extract-106.golden.test.ts`
- `/fixtures/106/raw/<test-pdfs>` (not committed to git)
- `/fixtures/106/extracted/<expected-outputs>.txt` (not committed to git)

### Extractor Specification

**Function signature:**
```typescript
interface ExtractPdfOptions {
  password?: string;
  timeoutMs?: number; // default: 30000
}

interface ExtractedText {
  raw: string;
}

function extractPdfText(filePath: string, options?: ExtractPdfOptions): Promise<ExtractedText>
```

**Implementation requirements:**

1. **Binary execution:**
   - Must use `child_process.execFile` (NOT `exec`) to prevent command injection
   - Command: `pdftotext -layout <filePath> -` (outputs to stdout)
   - With password: `pdftotext -upw <password> -layout <filePath> -`
   - Must set timeout (default 30 seconds)
   - Must capture stdout as UTF-8

2. **Output normalization (determinism):**
   - Normalize all line endings to `\n`
   - Trim trailing whitespace from each line
   - Trim leading/trailing empty lines from full output
   - Output must be identical for identical input PDF + password

3. **Error handling:**
   Must throw `IngestionFailure` with appropriate codes:

   | Condition | Error Code | Stage |
   |-----------|------------|-------|
   | `pdftotext` binary not found | `PDF_TOOL_MISSING` | extract |
   | PDF requires password (none provided) | `PDF_PASSWORD_REQUIRED` | extract |
   | Password provided but incorrect | `PDF_PASSWORD_INVALID` | extract |
   | Extraction failed (other reasons) | `PDF_EXTRACTION_FAILED` | extract |
   | Timeout exceeded | `PDF_EXTRACTION_TIMEOUT` | extract |

4. **Security requirements (non-negotiable):**
   - Password must NOT appear in error messages
   - Password must NOT be logged
   - Password must NOT be stored (memory only, during call)
   - File path must be validated (exists, is file, reasonable size)
   - **Known limitation:** Password appears in process arguments (visible via `ps`). Document this. Poppler does not support stdin password input.

### Constraints
- Must use system-installed `pdftotext` (Poppler)
- Must NOT add npm dependencies
- Must NOT use `child_process.exec` (injection risk)
- Must NOT access database
- Must NOT implement OCR
- Must NOT store or log passwords
- Scanned/image-only PDFs must fail with `PDF_EXTRACTION_FAILED` (OCR is future work)

### Test Fixtures

**Required fixtures (local only, not committed):**

| Fixture | Purpose |
|---------|---------|
| `simple.pdf` | Basic single-page Form 106 with text layer |
| `multipage.pdf` | Multi-page Form 106 |
| `protected.pdf` (optional) | Password-protected PDF for auth tests |

**Expected output files:**
- `/fixtures/106/extracted/simple.expected.txt`
- `/fixtures/106/extracted/multipage.expected.txt`

### Open Questions
None. Scanned PDFs without text layer will fail; OCR is deferred to a future task.

---

## IMPLEMENT

### Files Touched
1. `/packages/ingestion/src/extractors/pdf-text.ts` — replace stub with real implementation
2. `/packages/ingestion/src/pipelines/ingest-106.ts` — update to pass password option if needed
3. `/packages/ingestion/__tests__/golden/extract-106.golden.test.ts` — new golden tests

No other files may be modified.

---

## VALIDATE

### Validation Artifacts

**Golden tests must verify:**
1. `simple.pdf` extraction matches `simple.expected.txt` exactly
2. `multipage.pdf` extraction matches `multipage.expected.txt` exactly
3. Same PDF extracted twice produces identical output (determinism)
4. Missing `pdftotext` binary throws `PDF_TOOL_MISSING`
5. (If protected.pdf exists) Missing password throws `PDF_PASSWORD_REQUIRED`
6. (If protected.pdf exists) Wrong password throws `PDF_PASSWORD_INVALID`
7. Error messages do NOT contain password string

**TypeScript:**
- `npx tsc --noEmit` passes for ingestion package

**Existing tests:**
- All existing ingestion tests must still pass

### Success Criteria
- [ ] Real PDFs extract successfully (no stubs)
- [ ] Output is deterministic (same input → same output)
- [ ] Golden tests fail if output format changes
- [ ] Password never appears in errors or logs
- [ ] No new npm dependencies added
- [ ] No database code introduced
- [ ] Existing tests unaffected

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- Document Poppler installation requirements in project README or CONTRIBUTING.md

### Follow-ups
- TASK-007: Normalization robustness (extracted text → Normalized106)
- Future: OCR strategy for scanned PDFs
