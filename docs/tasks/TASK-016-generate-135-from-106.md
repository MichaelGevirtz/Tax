# TASK-016: Generate Form 135 PDF from Form 106 Data

## Goal

Generate a pre-filled Form 135 (דין וחשבון שנתי מקוצר — Abbreviated Annual Tax Return) PDF from extracted Form 106 data. The output PDF should have the correct fields populated in the official Form 135 template, ready for the user to review, complete remaining fields, sign, and submit.

## Background

### What is Form 135?

Form 135 is the abbreviated annual tax return used by salaried employees in Israel who are **not required** to file a full tax return but wish to request a **tax refund** (החזר מס). It is filed via the Israel Tax Authority (רשות המסים) website or in person.

### Why generate it from Form 106?

Form 106 (טופס 106) is the employer-issued annual salary certificate. It contains the core income and withholding data needed to populate Form 135. By auto-filling Form 135 from Form 106, we save the user significant manual data entry and reduce errors.

### Form 135 Structure (2 pages)

**Page 1:**
- **א. פרטים כלליים** (General Details) — Name, ID, spouse, marital status
- **ב. פרטים אישיים** (Personal Details) — Address, phone, email, occupation
- **ג. הכנסות חייבות מיגיעה אישית** (Taxable Income from Personal Effort) — Salary boxes (150/170, 250/270, 194/196, 158/172, 069/068, 258/272), employer details, bank account (277/278)
- **ד. הכנסות חייבות שאינן מיגיעה אישית** (Non-Personal-Effort Taxable Income) — Boxes 313/213, 059, 167, 060, 067, 157, 141, 053/050, 078, 126, 142, 222, 227, 335

**Page 2:**
- **ה. הכנסות/רווחים פטורים ובלתי חייבים במס** (Tax-Exempt Income) — Boxes 109/309, 332, 209, 054, 256, 166
- **ו. רווח הון מניירות ערך סחירים** (Capital Gains from Securities)
- **ז. ניכויים אישיים** (Personal Deductions) — Boxes 113/112, 207/206, 180/135, 089/030, 117, 244, 249/248, 012/011
- **ח. נקודות זיכוי** (Tax Credit Points) — Children, residency, aliyah, etc. (boxes 020-182)
- **ט. זיכויים אישיים** (Personal Credits) — Boxes 081/036, 240/140, 086/045, 269/268, 232/132, 237/037, 144/143, 183/139
- **מ. מתואר למקדמות וניכויים במקור** (Withholdings Summary) — Boxes 294, 042, 043, 040

### Form 106 → Form 135 Field Mapping

| Extracted106 Field | Form 135 Location | Box # | Hebrew Label |
|---|---|---|---|
| `employeeId` | Section א, ת.ז. | — | מספר זהות |
| `employerId` | Section ג, employer area | — | מעסיק (שם/מספר) |
| `taxYear` | Header | — | שנת המס |
| `grossIncome` | Section ג, Row 3 | **158** | משכורת/שכר עבודה (employee share) |
| `taxDeducted` | Section מ | **042** | סכום מתוך טופסי 106 (ניכוי מס במקור) |
| `socialSecurityDeducted` | — | — | Informational (already deducted, shown in Form 106) |
| `healthInsuranceDeducted` | — | — | Informational (already deducted, shown in Form 106) |

**Fields NOT in Form 106 (user must supply):**
- Full name (שם פרטי, שם משפחה, שם האב)
- Address (ישוב, רחוב, בית, דירה, כניסה, מיקוד)
- Phone and email
- Marital status and spouse details
- Bank account details (boxes 277, 278) for refund
- Tax credit points (Section ח) — children, residency, etc.
- Additional income sources (Sections ד, ה, ו) if any
- Personal deductions (Section ז) if any
- Personal credits (Section ט) if any

## Dependencies

- TASK-006/007: Form 106 extraction and normalization (completed)
- TASK-012: Box-anchored field extraction (completed)
- `Extracted106` schema: `packages/domain/src/schemas/extracted-106.schema.ts`
- Form 135 blank PDF templates: `docs/product/135/` (2019–2024 versions available)

## Plan

### Phase 1: Form 135 Schema & Field Mapping

1. **Create Form 135 Zod schema** in `packages/domain/src/schemas/form-135.schema.ts`
   - Define all Form 135 fields organized by section (א through מ)
   - Mark fields as required vs optional (most are optional since user fills incrementally)
   - Include box number metadata for PDF coordinate mapping
   - Derive TypeScript type via `z.infer`

2. **Create mapping function** in `packages/core/src/mappers/form106-to-form135.mapper.ts`
   - Pure function: `mapExtracted106ToForm135(input: Extracted106): Partial<Form135>`
   - Maps the 7 extracted fields to their Form 135 counterparts
   - Deterministic, no IO

### Phase 2: PDF Template Preparation

3. **Select and prepare Form 135 template PDF**
   - Use the 2024 version: `docs/product/135/Service_Pages_Income_tax_annual-report-2024_135-2024.pdf`
   - Determine if the PDF has AcroForm fields (fillable) or is flat (image-based)
   - If flat: measure box coordinates (x, y, width, height) for each field
   - Store template in `fixtures/135/templates/` or reference from `docs/product/135/`

4. **Create box coordinate map** in `packages/core/src/templates/form135-coordinates.ts`
   - Map each Form 135 box number to its (x, y) position on the PDF page
   - Include page number (1 or 2) for each field
   - Coordinates measured from bottom-left in PDF points (1 point = 1/72 inch)

### Phase 3: PDF Generation

5. **Add `pdf-lib` dependency** to `packages/core/`
   - `pdf-lib` is a pure JS library for creating and modifying PDFs
   - No native dependencies, works on all platforms
   - Supports: loading existing PDFs, adding text, filling forms, embedding fonts

6. **Create PDF generator** in `packages/core/src/generators/form135-pdf.generator.ts`
   - Load blank Form 135 template PDF
   - Embed Hebrew font (for RTL text rendering)
   - Fill in field values at the mapped coordinates
   - Export as `Uint8Array` / `Buffer`
   - Interface: `generateForm135Pdf(data: Partial<Form135>): Promise<Buffer>`

7. **Create pipeline entry point** in `packages/ingestion/src/pipelines/generate-135.ts`
   - `generate135FromForm106(form106Path: string, options?: Generate135Options): Promise<Generate135Result>`
   - Stages: extract Form 106 → map to Form 135 → generate PDF
   - Returns: `{ success: true, pdfBuffer: Buffer }` or error

### Phase 4: Testing

8. **Unit tests** (co-located):
   - `form106-to-form135.mapper.test.ts` — mapping correctness
   - `form135-pdf.generator.test.ts` — PDF generation, font embedding, coordinate placement

9. **Golden test**: `packages/ingestion/__tests__/golden/generate-135.golden.test.ts`
   - Input: sample Form 106 PDF (`031394828_T106-sample.pdf`)
   - Output: generated Form 135 PDF
   - Verify: PDF is valid, contains expected text at expected positions
   - Optionally: visual regression via rendered image comparison

## Technical Considerations

### Hebrew / RTL Text
- Form 135 is an RTL (right-to-left) Hebrew form
- `pdf-lib` supports custom font embedding; need a Hebrew-compatible font (e.g., David, Arial Hebrew, or open-source Noto Sans Hebrew)
- Numbers are always LTR even in Hebrew documents
- Text alignment in boxes is typically right-aligned

### PDF Form Fields vs Coordinate Overlay
- **If AcroForm**: Use `pdf-lib`'s form-filling API (`form.getTextField('fieldName').setText(...)`)
- **If flat PDF**: Overlay text at precise coordinates using `page.drawText(...)`
- The official Form 135 PDFs from gov.il may or may not have form fields — must check

### Multi-Employer Support
- A user may have multiple Form 106s from different employers
- Form 135 Section ג has space for main employer + additional employers (מעסיקים נוספים)
- Phase 1 handles single employer; future enhancement for multi-employer

### Version Handling
- Form 135 layout changes slightly between years (2019 vs 2024 have different box positions)
- Template selection should be based on `taxYear` from Form 106
- Available templates: 2019, 2020, 2021, 2022, 2023, 2024

## Files to Create/Modify

| Action | File Path |
|--------|-----------|
| Create | `packages/domain/src/schemas/form-135.schema.ts` |
| Create | `packages/core/src/mappers/form106-to-form135.mapper.ts` |
| Create | `packages/core/src/mappers/form106-to-form135.mapper.test.ts` |
| Create | `packages/core/src/templates/form135-coordinates.ts` |
| Create | `packages/core/src/generators/form135-pdf.generator.ts` |
| Create | `packages/core/src/generators/form135-pdf.generator.test.ts` |
| Create | `packages/ingestion/src/pipelines/generate-135.ts` |
| Create | `packages/ingestion/__tests__/golden/generate-135.golden.test.ts` |
| Modify | `packages/domain/src/index.ts` (export Form135 schema/type) |
| Modify | `packages/core/package.json` (add pdf-lib dependency) |

## Acceptance Criteria

- [ ] Form 135 Zod schema created with all sections/boxes
- [ ] Mapping function correctly maps all 7 Extracted106 fields to Form 135 boxes
- [ ] PDF generator produces valid PDF from Form 135 data
- [ ] Hebrew text renders correctly in generated PDF
- [ ] Generated PDF visually matches official Form 135 layout
- [ ] Pipeline: Form 106 PDF in → Form 135 PDF out (end-to-end)
- [ ] Unit tests pass for mapper and generator
- [ ] Golden test validates full pipeline
- [ ] TypeScript typecheck passes
- [ ] All existing tests still pass

## Open Questions

1. **Font licensing**: Which Hebrew font to embed? Need an open-source option (Noto Sans Hebrew?)
2. **AcroForm vs flat**: Are the official Form 135 PDFs fillable or flat images?
3. **Multi-employer**: Should Phase 1 support multiple Form 106 inputs, or single only?
4. **User input fields**: How will the user provide data not in Form 106 (name, address, bank)?
   - Option A: Additional input form/JSON alongside Form 106
   - Option B: Generate partially-filled PDF, user completes manually
   - Option C: Interactive CLI wizard
5. **Year-specific templates**: Should we support all years (2019–2024) or just 2024?
