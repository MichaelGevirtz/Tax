# TASK-015: PDF Security Validation

## Goal

Add a pre-processing security validation layer that rejects malicious PDFs before they reach pdftotext or Tesseract. Protect against file masquerading, embedded JavaScript, launch actions, and resource exhaustion attacks.

## Threat Model

| Threat | Vector | Impact | Mitigation |
|--------|--------|--------|------------|
| File masquerading | Non-PDF file uploaded with .pdf extension | Tool crash, potential exploit | Magic bytes validation |
| Embedded JavaScript | `/JS`, `/JavaScript` objects in PDF | Code execution via PDF reader exploits | Object scan + reject |
| Launch actions | `/Launch`, `/OpenAction`, `/AA` (auto-actions) | Command execution | Object scan + reject |
| Embedded executables | `/EmbeddedFile` objects | Malware delivery | Object scan + reject |
| Form data exfiltration | `/SubmitForm`, `/URI` actions | Data theft | Object scan + reject |
| Resource exhaustion | Very large PDFs, deeply nested streams | DoS | File size limit |
| PDF bomb | Malformed objects / excessive xref entries | Parser crash | Object count limit |

## Plan

### 1. Add security error codes to `ingestion-errors.ts`
- `PDF_INVALID_FORMAT` — not a valid PDF (magic bytes mismatch)
- `PDF_SECURITY_RISK` — contains dangerous objects (JS, Launch, etc.)
- `PDF_TOO_LARGE` — exceeds size limit

### 2. Create `pdf-validator.ts` in `packages/ingestion/src/validators/`
Pure functions, no I/O beyond reading file header bytes:
- `validatePdfSecurity(filePath): Promise<void>` — runs all checks, throws on failure
- `validateMagicBytes(buffer)` — checks `%PDF-` header (first 5 bytes)
- `scanForDangerousObjects(buffer)` — scans raw bytes for `/JS`, `/JavaScript`, `/Launch`, `/AA`, `/OpenAction`, `/EmbeddedFile`, `/SubmitForm`, `/RichMedia`
- `validateFileSize(filePath, maxBytes)` — checks file size (default 50MB)

### 3. Integrate into pipeline (`ingest-106.ts`)
- Call `validatePdfSecurity(filePath)` as Stage 0 (before extraction)
- Runs before pdftotext or Tesseract touch the file

### 4. Add unit tests (`pdf-validator.test.ts`)
- Magic bytes: valid PDF, JPEG, EXE, empty file
- Dangerous objects: synthetic PDFs with /JS, /Launch, /AA, /EmbeddedFile
- File size: within limit, over limit
- Clean PDF: passes all checks

## Acceptance Criteria

- [ ] Non-PDF files rejected before processing
- [ ] PDFs with embedded JavaScript rejected
- [ ] PDFs with launch/auto-actions rejected
- [ ] PDFs with embedded files rejected
- [ ] Oversized files rejected
- [ ] Clean Form 106 PDFs pass validation
- [ ] All existing tests still pass
- [ ] Typecheck passes
