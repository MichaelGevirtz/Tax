# TASK-010 – Image-Only PDF Detection

## PLAN

### Goal
Implement detection of image-only (scanned) PDFs that have no extractable text layer, so we can route them directly to OCR without attempting pdftotext first.

This task covers:
- Detection logic for image-only PDFs
- Integration with extraction pipeline (skip pdftotext for image-only)
- Distinguishing between "empty extraction" and "image-only PDF"

This task does NOT cover:
- OCR implementation (done in TASK-009)
- Hebrew parsing from OCR output (future task)
- Mixed PDFs (some pages text, some scanned)

### Background

Currently, our pipeline:
1. Runs `pdftotext` on all PDFs
2. If extraction is empty → throws `PDF_EXTRACTION_FAILED`
3. If text is garbled → falls back to OCR (TASK-009)

Problem: For image-only PDFs, `pdftotext` produces empty output and we throw an error instead of trying OCR. We need to detect image-only PDFs early and route them to OCR.

### Detection Strategies

**Option A: Check extraction output length**
- If `pdftotext` returns < N characters (e.g., < 50), assume image-only
- Pros: Simple, no new dependencies
- Cons: May misclassify very short text PDFs

**Option B: Use `pdfinfo` to check page content**
- `pdfinfo -meta` can show if pages contain images vs text
- Pros: More accurate
- Cons: Additional subprocess call

**Option C: Use `pdfimages` to detect embedded images**
- If PDF has images but no text, likely scanned
- Pros: Direct detection
- Cons: More complex, may have false positives

**Recommended: Option A + heuristics**
- Check if extraction output is below threshold
- Verify PDF has pages (not corrupted)
- If both true, classify as IMAGE_ONLY and route to OCR

### Prerequisites
- TASK-009 complete (OCR extraction working)
- pdftotext available (Poppler)

### Inputs
- Existing extractor: `/packages/ingestion/src/extractors/pdf-text.ts`
- OCR extractor: `/packages/ingestion/src/extractors/ocr-text.ts`
- Pipeline: `/packages/ingestion/src/pipelines/ingest-106.ts`

### Outputs

**Files to modify:**
- `/packages/ingestion/src/extractors/pdf-text.ts` — add `isImageOnlyPdf()` detection
- `/packages/ingestion/src/pipelines/ingest-106.ts` — route image-only to OCR
- `/packages/ingestion/src/errors/ingestion-errors.ts` — add `PDF_IMAGE_ONLY` code (informational)

**Files to create:**
- `/packages/ingestion/src/extractors/pdf-text.test.ts` — unit tests for detection
- `/fixtures/106/raw/scanned-sample.pdf` — test fixture (if available)

### Detection Interface

```typescript
export interface PdfAnalysis {
  hasTextLayer: boolean;
  extractedLength: number;
  pageCount?: number;
}

/**
 * Analyze a PDF to determine if it's image-only.
 * Returns analysis without throwing errors.
 */
export async function analyzePdf(filePath: string): Promise<PdfAnalysis>;

/**
 * Check if a PDF appears to be image-only (scanned).
 * Uses heuristics based on extraction output length.
 */
export function isImageOnlyPdf(extracted: ExtractedText, threshold?: number): boolean;
```

### Detection Heuristics

```typescript
const IMAGE_ONLY_THRESHOLD = 50; // characters

function isImageOnlyPdf(extracted: ExtractedText): boolean {
  const text = extracted.raw.trim();

  // If very short output, likely image-only
  if (text.length < IMAGE_ONLY_THRESHOLD) {
    return true;
  }

  // If only whitespace/control characters, likely image-only
  const meaningfulChars = text.replace(/[\s\x00-\x1f]/g, '');
  if (meaningfulChars.length < 20) {
    return true;
  }

  return false;
}
```

### Updated Pipeline Flow

```
PDF Input
    │
    ▼
pdftotext extraction
    │
    ▼
isImageOnlyPdf() check ─────────────────┐
    │                                    │
    │ false                              │ true
    ▼                                    ▼
isTextGarbled() check              Tesseract OCR
    │                                    │
    ├── false                            │
    │      │                             │
    │      ▼                             │
    │   normalize106()                   │
    │      │                             │
    │      ▼                             │
    │   Normalized106                    │
    │                                    │
    └── true ────────────────────────────┤
                                         │
                                         ▼
                                    normalize106()
                                         │
                                         ▼
                                    Normalized106
```

### Error Code to Add

```typescript
// Informational code (not an error - triggers OCR path)
export type ExtractionInfoCode =
  | "PDF_IMAGE_ONLY";  // PDF appears to be scanned/image-only
```

### Constraints
- No new npm dependencies
- Detection must be fast (< 100ms overhead)
- Must not break existing text extraction
- Threshold should be configurable
- Must handle edge cases (empty files, corrupted PDFs)

### Edge Cases to Handle

1. **Empty PDF** (0 pages) → `PDF_EXTRACTION_FAILED`
2. **PDF with only whitespace** → `PDF_IMAGE_ONLY` → OCR
3. **PDF with minimal text** (headers only) → threshold-dependent
4. **Mixed PDF** (text + scanned pages) → currently out of scope
5. **Corrupted PDF** → `PDF_EXTRACTION_FAILED`

### Open Questions
- What's the optimal character threshold for image-only detection?
- Should we use `pdfinfo` for more accurate detection?
- How to handle mixed PDFs (some pages scanned)?
- Should we log/track detection metrics for tuning?

---

## IMPLEMENT

### Files Touched
1. `/packages/ingestion/src/extractors/pdf-text.ts` — add detection
2. `/packages/ingestion/src/pipelines/ingest-106.ts` — update routing
3. `/packages/ingestion/src/errors/ingestion-errors.ts` — add info code
4. `/packages/ingestion/src/extractors/pdf-text.test.ts` — tests

No other files may be modified without updating the PLAN.

### Implementation Details

#### 1. ingestion-errors.ts
- Added `PDF_IMAGE_ONLY` to `ExtractionErrorCode` union type
- This is an informational code that triggers OCR path rather than a hard error

#### 2. pdf-text.ts
- Added `IMAGE_ONLY_THRESHOLD = 50` (exported constant)
- Added `MEANINGFUL_CHARS_THRESHOLD = 20` (internal constant)
- Added `isImageOnlyPdf(extracted: ExtractedText, threshold?: number): boolean`
  - Returns true if text length < threshold (default 50)
  - Returns true if meaningful chars (non-whitespace/control) < 20
- Modified `extractPdfText()` to return empty result instead of throwing
  - Allows caller to check `isImageOnlyPdf()` and route accordingly

#### 3. ingest-106.ts
- Imported `isImageOnlyPdf` from pdf-text.ts
- After extraction, checks `isImageOnlyPdf(extracted)`
- If true AND `enableOcrFallback: true` → routes to OCR
- If true AND `enableOcrFallback: false` → returns `PDF_IMAGE_ONLY` error

#### 4. pdf-text.test.ts
- Unit tests for `isImageOnlyPdf()` function
- Tests for: empty, whitespace-only, below threshold, control chars
- Tests for: valid text, typical Form 106 content
- Tests for: custom threshold, edge cases (Hebrew, numeric)

---

## VALIDATE

### Validation Artifacts

**Unit tests must verify:**
1. `isImageOnlyPdf()` returns true for empty/near-empty extraction
2. `isImageOnlyPdf()` returns false for valid text extraction
3. Threshold is respected
4. Edge cases (whitespace-only, minimal text)

**Integration tests must verify:**
1. Image-only PDF routes to OCR automatically
2. Text PDFs still use pdftotext path
3. Garbled PDFs still trigger OCR fallback
4. Error messages are appropriate

**TypeScript:**
- `npx tsc --noEmit` passes

### Success Criteria
- [x] Image-only detection implemented with configurable threshold
- [x] Pipeline routes image-only PDFs to OCR
- [x] Existing text extraction unaffected
- [x] Unit tests cover detection logic
- [x] No new npm dependencies
- [x] TypeScript compiles without errors

---

## ITERATE

### Outcome
- [x] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- Default threshold of 50 characters works well for Form 106 PDFs
- Hebrew text is counted correctly as meaningful characters
- Meaningful character threshold of 20 catches whitespace-only extraction

### Follow-ups
- TASK-011: OCR confidence scoring and quality gates
- TASK-012: Multi-page Form 106 support
- Future: Mixed PDF handling (text + scanned pages)
- Future: Use `pdfinfo` for more accurate detection
