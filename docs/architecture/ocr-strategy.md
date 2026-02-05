# OCR Strategy for Form 106 PDFs

## Overview

This document defines the OCR strategy for handling Form 106 PDFs where standard text extraction fails.

**Decision: Tesseract OCR only (v1)**

## Problem Classes

### 1. TEXT_OK
- Standard `pdftotext` extraction works
- `normalize106()` succeeds
- **No OCR needed**

### 2. TEXT_GARBLED (CID-garbled Hebrew)
- `pdftotext` extracts text but Hebrew is garbled
- Detected by `isTextGarbled()` in `/packages/ingestion/src/normalizers/normalize-106.ts`
- Common patterns: `Z061+ 047\`, `477+///`, `/9  /9`
- **Needs OCR**

### 3. IMAGE_ONLY (Scanned PDFs)
- No text layer or near-empty extraction
- **Needs OCR**

## Vendor Research

### Tesseract (SELECTED)

| Aspect | Details |
|--------|---------|
| Hebrew Support | Yes - `Hebrew.traineddata` available |
| Cost | Free |
| Accuracy | 80-85% general, variable for Hebrew |
| Privacy | Full - local processing, no cloud |
| Deployment | System binary (like pdftotext) |

**Pros:**
- Zero cost
- Full privacy (no PII sent to cloud)
- Can be trained for custom fonts
- Preprocessing can improve accuracy 10-20%

**Cons:**
- Lower accuracy than cloud OCR
- Hebrew results reported as variable
- Requires image preprocessing

**Sources:**
- [Tesseract Hebrew trained data](https://github.com/tesseract-ocr/tessdata/blob/main/script/Hebrew.traineddata)
- [Tesseract OCR 2026 Overview](https://www.klippa.com/en/blog/information/tesseract-ocr/)

### Google Cloud Vision (DOCUMENTED FOR FUTURE)

| Aspect | Details |
|--------|---------|
| Hebrew Support | Yes - 80+ languages |
| Cost | $1.50/1000 pages (first 1000 free/month) |
| Accuracy | Up to 98.7% on clean docs |
| Privacy | PII sent to Google |

**Not selected for v1** due to privacy concerns and cost.
May be considered later if Tesseract quality proves insufficient.

**Sources:**
- [Google Cloud Vision Pricing](https://cloud.google.com/vision/pricing)
- [Google Vision OCR Overview](https://nanonets.com/blog/google-cloud-vision/)

### AWS Textract (ELIMINATED)

| Aspect | Details |
|--------|---------|
| Hebrew Support | **NO** |
| Languages | EN, ES, DE, IT, FR, PT only |

**Eliminated** - does not support Hebrew.

**Sources:**
- [AWS Textract FAQs](https://aws.amazon.com/textract/faqs/)

### Azure Computer Vision (NOT RECOMMENDED)

| Aspect | Details |
|--------|---------|
| Hebrew Support | Partial/Preview |
| Issues | Hebrew text appears as "gibberish" |

**Not recommended** due to Hebrew quality issues.

**Sources:**
- [Azure OCR Language Support](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/language-support)
- [Azure Hebrew issues](https://learn.microsoft.com/en-us/answers/questions/1233524/ocr-language-support-for-greek-hebrew-thai-vietnam)

## Implementation Strategy

### Pipeline Flow

```
PDF Input
    │
    ▼
pdftotext -layout
    │
    ▼
normalize106()
    │
    ├─── SUCCESS ──► Normalized106 (no OCR needed)
    │
    └─── TEXT_GARBLED / FIELD_NOT_FOUND
              │
              ▼
         Tesseract OCR
              │
              ▼
         normalize106()
              │
              ▼
         Normalized106
```

### Tesseract Configuration (for TASK-009)

**Preprocessing:**
1. Convert PDF page to image (300 DPI recommended)
2. Convert to grayscale
3. Apply deskewing (can improve accuracy 10%)
4. Apply thresholding for clean black/white

**Tesseract options:**
- Language: `heb` (Hebrew)
- Output: UTF-8 text
- Page segmentation mode: TBD based on Form 106 layout testing

### Versioning

| Parser Version | Method |
|----------------|--------|
| `v1_text` | Standard pdftotext extraction |
| `v1_ocr_tesseract` | Tesseract OCR fallback |

## Privacy & Security Rules

1. **No cloud OCR** in v1
2. **No raw text logging** - only structured data
3. **No password storage** - memory only during processing
4. **Local processing only** - Tesseract runs on server

## Success Criteria

For MVP acceptance:
- [ ] Extract taxYear from garbled/scanned PDFs
- [ ] Extract employee ID (when readable)
- [ ] Extract key monetary amounts
- [ ] Processing time <= 30 seconds/page
- [ ] Zero PII in logs

## Open Questions

1. What Tesseract preprocessing yields best Hebrew quality?
2. What page segmentation mode works best for Form 106?
3. Should we implement confidence scoring?

## Future Considerations

If Tesseract quality proves insufficient:
- Google Cloud Vision is documented as fallback
- Would require user consent for cloud processing
- Would require privacy disclosure in UX

## Related

- TASK-006: PDF extraction (pdftotext)
- TASK-007: Normalization (isTextGarbled detection)
- TASK-009: Tesseract OCR implementation (next)
