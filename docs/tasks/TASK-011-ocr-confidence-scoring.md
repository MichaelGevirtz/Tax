# TASK-011 – OCR Confidence Scoring and Quality Gates

## PLAN

### Goal
Implement OCR confidence scoring from Tesseract and quality gates to detect when OCR output is unreliable, providing actionable feedback to users.

This task covers:
- Extracting confidence scores from Tesseract output
- Implementing quality gate thresholds
- Adding new error/warning codes for low-confidence OCR
- Providing actionable error messages when quality is poor

This task does NOT cover:
- OCR accuracy improvement/training
- Alternative OCR engines
- Manual review workflows
- Cloud OCR fallback

### Background

Currently, our OCR pipeline (TASK-009) extracts text via Tesseract but does not evaluate quality. The `OcrResult.confidence` field exists but is not populated. Poor-quality scans, low-resolution images, or unusual fonts can produce low-confidence OCR that leads to incorrect field extraction.

Quality gates will:
1. Warn users when OCR confidence is below acceptable threshold
2. Fail extraction when confidence is critically low
3. Provide specific guidance on how to improve scan quality

### Prerequisites
- TASK-009 complete (Tesseract OCR implemented)
- TASK-010 complete (image-only PDF detection)
- Tesseract installed with Hebrew language data

### Inputs
- OCR extractor: `/packages/ingestion/src/extractors/ocr-text.ts`
- Pipeline: `/packages/ingestion/src/pipelines/ingest-106.ts`
- Error types: `/packages/ingestion/src/errors/ingestion-errors.ts`

### Outputs

**Files to modify:**
- `/packages/ingestion/src/extractors/ocr-text.ts` — extract confidence from Tesseract
- `/packages/ingestion/src/pipelines/ingest-106.ts` — implement quality gates
- `/packages/ingestion/src/errors/ingestion-errors.ts` — add quality error codes

**Files to create:**
- `/packages/ingestion/src/extractors/ocr-text.test.ts` — add confidence tests

### Confidence Extraction

Tesseract can output confidence scores via:
1. **TSV output** (`-c tessedit_create_tsv=1`) — per-word confidence
2. **HOCR output** (`hocr`) — per-word confidence in XML format
3. **Mean confidence** — aggregate page confidence

Recommended approach: Use TSV output to get per-word confidence, then calculate:
- `meanConfidence`: Average confidence across all words
- `minConfidence`: Lowest word confidence (flags problematic areas)
- `lowConfidenceRatio`: Percentage of words below threshold

### Enhanced OcrResult Interface

```typescript
export interface OcrConfidence {
  mean: number;           // 0-100, average word confidence
  min: number;            // 0-100, lowest word confidence
  lowConfidenceRatio: number;  // 0-1, ratio of words below threshold
  wordCount: number;      // Total words analyzed
}

export interface OcrResult {
  text: string;
  confidence?: OcrConfidence;
  warnings?: string[];    // Quality warnings if applicable
}
```

### Quality Gate Thresholds

```typescript
export const OCR_QUALITY_THRESHOLDS = {
  // Below this mean confidence, extraction fails
  CRITICAL_MEAN: 40,

  // Below this mean confidence, warning is added
  WARNING_MEAN: 60,

  // If more than this ratio of words are low-confidence, warn
  LOW_CONFIDENCE_WORD_THRESHOLD: 50,  // Per-word threshold
  LOW_CONFIDENCE_RATIO_WARNING: 0.3,  // 30% of words

  // Minimum words required for confidence to be meaningful
  MIN_WORDS_FOR_CONFIDENCE: 10,
} as const;
```

### Error/Warning Codes to Add

```typescript
export type OcrQualityCode =
  | "OCR_QUALITY_CRITICAL"   // Confidence too low, extraction rejected
  | "OCR_QUALITY_WARNING";   // Confidence marginal, proceed with caution

// Add to OcrErrorCode union
export type OcrErrorCode =
  | "OCR_TOOL_MISSING"
  | "OCR_LANGUAGE_MISSING"
  | "OCR_EXTRACTION_FAILED"
  | "OCR_EXTRACTION_TIMEOUT"
  | "OCR_QUALITY_CRITICAL";  // New: quality gate failure
```

### Quality Gate Flow

```
Tesseract OCR
    │
    ▼
Parse TSV output ─────────────────────────────┐
    │                                          │
    ▼                                          ▼
Calculate confidence metrics           Extract text
    │                                          │
    ▼                                          │
Quality gate check                             │
    │                                          │
    ├── mean < CRITICAL_MEAN ──────► OCR_QUALITY_CRITICAL error
    │
    ├── mean < WARNING_MEAN ───────► Add warning, continue
    │                                          │
    └── OK ────────────────────────────────────┤
                                               │
                                               ▼
                                        OcrResult with
                                        confidence + text
```

### User-Friendly Error Messages

```typescript
const QUALITY_MESSAGES = {
  OCR_QUALITY_CRITICAL:
    "OCR quality too low to extract reliably. " +
    "Please provide a higher resolution scan (300+ DPI) " +
    "with good lighting and no shadows.",

  OCR_QUALITY_WARNING:
    "OCR quality is marginal. Results may contain errors. " +
    "Consider re-scanning at higher resolution if issues occur.",
};
```

### Pipeline Options Update

```typescript
export interface Ingest106Options {
  // ... existing options

  /** OCR quality gate settings */
  ocrQualityGate?: {
    /** Fail if mean confidence below this (default: 40) */
    criticalThreshold?: number;
    /** Warn if mean confidence below this (default: 60) */
    warningThreshold?: number;
    /** Disable quality gates entirely */
    disabled?: boolean;
  };
}
```

### Constraints
- No new npm dependencies
- Must not significantly slow down OCR (TSV parsing is fast)
- Confidence metrics must be deterministic
- Quality warnings must be actionable (tell user how to fix)
- Must handle edge case of very few words

### Edge Cases to Handle

1. **Empty OCR output** — No words to calculate confidence → extraction already fails
2. **Very few words** (< 10) — Confidence may be unreliable → skip quality gate
3. **High mean but low min** — One bad word shouldn't fail entire doc
4. **Non-text elements** — Logos, signatures may have low confidence → expected
5. **Hebrew vs English** — Confidence may vary by language → use combined metric

### Open Questions
- Should we expose confidence in the final `Ingest106Result`?
- Should quality warnings block validation or just log?
- What's the optimal threshold based on real Form 106 data?

---

## IMPLEMENT

### Files Touched
1. `/packages/ingestion/src/errors/ingestion-errors.ts` — added `OCR_QUALITY_CRITICAL` to `OcrErrorCode`
2. `/packages/ingestion/src/extractors/ocr-text.ts` — implemented confidence extraction and quality gates
3. `/packages/ingestion/src/pipelines/ingest-106.ts` — added `ocrQualityGate` option
4. `/packages/ingestion/src/extractors/ocr-text.test.ts` — added 7 new tests for confidence/quality gates

No other files modified.

### Implementation Summary

**1. Error Codes (`ingestion-errors.ts`)**
- Added `OCR_QUALITY_CRITICAL` to `OcrErrorCode` union type

**2. OCR Extractor (`ocr-text.ts`)**

New exports:
- `OcrQualityGateOptions` — interface for quality gate configuration
- `OcrConfidence` — interface with mean, min, lowConfidenceRatio, wordCount
- `OCR_QUALITY_THRESHOLDS` — constant with default thresholds
- `parseTsvConfidence()` — parses Tesseract TSV output for per-word confidence

Key changes:
- `runTesseractOnImage()` now runs with `-c tessedit_create_tsv=1` to get TSV output
- Parses TSV to extract word-level confidence (level=5 rows)
- `aggregateConfidence()` combines confidence across multi-page PDFs using weighted average
- `applyQualityGates()` throws `OCR_QUALITY_CRITICAL` or adds warnings based on thresholds
- Quality gate skipped if wordCount < 10 (unreliable metric)

**3. Pipeline (`ingest-106.ts`)**
- Added `ocrQualityGate?: OcrQualityGateOptions` to `Ingest106Options`
- Passes quality gate options through to OCR extraction

---

## VALIDATE

### Validation Artifacts

**Unit tests (21 tests, all passing):**

`parseTsvConfidence` tests:
1. ✅ Parses TSV output and calculates confidence metrics
2. ✅ Calculates low confidence ratio correctly
3. ✅ Ignores non-word level entries (level != 5)
4. ✅ Handles empty TSV content
5. ✅ Skips words with confidence -1 (unprocessable)
6. ✅ Skips empty text entries

Quality gates tests:
7. ✅ Includes confidence in OCR result when Tesseract is available
8. ✅ Throws OCR_QUALITY_CRITICAL for very low confidence
9. ✅ Adds warning for marginal confidence
10. ✅ Skips quality gate when disabled

Threshold constants test:
11. ✅ OCR_QUALITY_THRESHOLDS has expected default values

**TypeScript:**
- ✅ `npx tsc --noEmit` passes in packages/ingestion

### Success Criteria
- [x] Confidence extracted from Tesseract output
- [x] Quality gates implemented with configurable thresholds
- [x] OCR_QUALITY_CRITICAL error for very low confidence
- [x] Warnings for marginal confidence
- [x] Actionable error messages
- [x] Unit tests cover confidence calculation
- [x] No new npm dependencies
- [x] TypeScript compiles without errors

---

## ITERATE

### Outcome
- [x] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- TSV output adds minimal overhead to OCR (same Tesseract run produces both .txt and .tsv)
- Quality gate uses weighted average for multi-page confidence aggregation
- Skipping quality gate for <10 words prevents false positives on sparse documents
- Integration tests skip gracefully when Tesseract isn't properly configured

### Follow-ups
- TASK-012: Multi-page Form 106 support
- Future: Per-field confidence tracking
- Future: Confidence-based field fallback strategies
- Future: User feedback loop for threshold tuning
- Future: Expose confidence metrics in final `Ingest106Result`
