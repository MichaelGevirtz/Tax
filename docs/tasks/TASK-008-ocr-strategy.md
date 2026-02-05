# TASK-008 – OCR Strategy for CID-Garbled / Image-Only 106 PDFs

## PLAN

### Goal
Define an OCR strategy using Tesseract for handling problematic Form 106 PDFs:

A) **CID-garbled Hebrew text layer**
- `pdftotext` extracts numbers but Hebrew labels are garbled due to broken ToUnicode CMap.

B) **Image-only / scanned PDFs**
- No usable text layer; extraction must rely on OCR.

This task produces a **decision + strategy doc** that is:
- Privacy-first (no cloud OCR)
- Zero cost (Tesseract is free)
- Compatible with current architecture (extraction → normalization → validation)

This task DOES NOT implement OCR yet.

### Inputs
- Current extraction uses `pdftotext` (Poppler)
- TASK-006: extraction v1 exists
- TASK-007: normalization v1 with `isTextGarbled()` exists
- Product constraints: Privacy-first, low ops, no cloud dependencies

### Outputs (Docs only)
Create/modify only:

1) `/docs/architecture/ocr-strategy.md` (NEW)
2) `/docs/product/open-questions.md` (UPDATE - if new unknowns)
3) `/docs/product/decision-log.md` (UPDATE - record decision)

### Problem Classification Rules
System classifies PDFs using existing `isTextGarbled()` function in `normalize-106.ts`:

| Classification | Detection | Action |
|----------------|-----------|--------|
| **TEXT_OK** | Normalization succeeds | No OCR needed |
| **TEXT_GARBLED** | `isTextGarbled()` returns true, throws `TEXT_GARBLED` error | Needs OCR |
| **IMAGE_ONLY** | Extraction yields near-empty text | Needs OCR |

Reference: `/packages/ingestion/src/normalizers/normalize-106.ts`

### Vendor Research Summary

| Provider | Hebrew Support | Pricing | Accuracy | Decision |
|----------|---------------|---------|----------|----------|
| **Tesseract** | Yes (trained models) | Free | 80-85% | **Selected** |
| Google Cloud Vision | Yes (80+ languages) | $1.50/1000 pages | 98%+ | Future option |
| AWS Textract | **NO** | N/A | N/A | **Eliminated** |
| Azure | Partial/Preview | ~$1.50/1000 | Hebrew issues | Not recommended |

#### Key Findings

**Tesseract**
- Hebrew trained models available: `Hebrew.traineddata`
- Users report variable results with Hebrew - may need preprocessing
- Can improve 10-20% with deskewing and image preprocessing
- Trainable for custom fonts if needed

**Google Cloud Vision**
- Supports 80+ languages including Hebrew
- $1.50/1000 pages after first 1000 free/month
- Up to 98.7% accuracy on clean documents
- Documented for future if Tesseract proves insufficient

**AWS Textract**
- Does NOT support Hebrew - only EN/ES/DE/IT/FR/PT
- Eliminated from consideration

**Azure Computer Vision**
- Hebrew support is partial/preview
- Users report Hebrew text appearing as "gibberish"
- Not recommended for Hebrew forms

### Decision

**GO: Tesseract OCR only (for now)**

Rationale:
1. **Privacy-first** - No PII sent to cloud, full data control
2. **Zero cost** - No per-page fees
3. **Sufficient for MVP** - Test Hebrew quality with real PDFs first
4. **Future option** - Cloud alternatives documented if needed later

### Tesseract Implementation Requirements (for TASK-009)

**Preprocessing steps:**
- Deskew images (can improve accuracy 10%)
- Convert to grayscale
- Apply thresholding for clean black/white
- Scale to optimal DPI (300 recommended)

**Configuration:**
- Language: `heb` (Hebrew)
- Page segmentation mode: Appropriate for form layouts
- Deterministic: Same config must produce same output

**Integration point:**
```
pdftotext fails → isTextGarbled() → Tesseract OCR → normalize106()
```

### Success Criteria for OCR (MVP Target)

On pilot PDF(s):
- Extract taxYear correctly
- Extract employee ID (if readable)
- Extract key amounts for Normalized106 schema
- Processing time <= 30 seconds per page
- Zero password persistence, zero PII leakage in logs

### Privacy / Security Rules (non-negotiable)
- Never store raw OCR text as-is in logs
- Never store PDF passwords
- No cloud OCR in v1 (Tesseract only)
- Persist only the normalized structured payload and safe metadata

### Determinism & Versioning Requirements
- OCR pipeline must have:
  - `parserVersion` (e.g., `v1_ocr_tesseract`)
  - Reproducible configuration (dpi, language, preprocessing steps)
- Outputs must be stable given same input + same configuration
- Separate golden test fixtures for OCR-derived outputs

### Open Questions
- What Tesseract preprocessing steps yield best Hebrew quality?
- What page segmentation mode works best for Form 106 layout?

---

## IMPLEMENT

### Files Touched
Docs only:
- `/docs/architecture/ocr-strategy.md` (NEW)
- `/docs/product/decision-log.md` (UPDATE)
- `/docs/product/open-questions.md` (UPDATE if needed)

No code changes.

---

## VALIDATE

### Validation Artifacts
- `ocr-strategy.md` includes:
  - Classification rules (reference to existing code)
  - Vendor research with decision rationale
  - Privacy rules
  - Success criteria
  - Tesseract implementation requirements
- Decision recorded in `decision-log.md` with date + reason

### Success Criteria
- OCR strategy is Tesseract-first, privacy-focused
- Cloud OCR documented as future option only
- TASK-009 can be scoped cleanly from this doc

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- Document Tesseract Hebrew quality findings after pilot

### Follow-ups
- TASK-009: Implement Tesseract OCR MVP
- Future: Cloud OCR option (if Tesseract quality insufficient)
