# TASK-001 – Domain Schemas (Zod) + Derived Types

## PLAN

### Goal
Establish the domain boundary contracts using Zod:
- Canonical schemas for tax inputs/results
- Canonical schema for Normalized 106 output
- API request/response contract schemas
- Derived TypeScript types from schemas only (no shadow types)

This task creates the foundation for safe ingestion, calculations, and API boundaries.

### Inputs
- Project structure already scaffolded
- PIV rules enforced
- Product knowledge index available at `/docs/product/INDEX.md`

### Outputs
Create the following files with minimal but correct structures:

**Schemas (source of truth):**
- `/packages/domain/src/schemas/normalized-106.schema.ts`
- `/packages/domain/src/schemas/tax-input.schema.ts`
- `/packages/domain/src/schemas/tax-result.schema.ts`
- `/packages/domain/src/schemas/api-contracts.schema.ts`

**Validators (domain-specific):**
- `/packages/domain/src/validators/israeli-id.validator.ts`
- `/packages/domain/src/validators/tax-year.validator.ts`
- `/packages/domain/src/validators/money.validator.ts`

**Types (derived only):**
- `/packages/domain/src/types/index.ts` (ONLY `z.infer` exports)

**Public exports:**
- `/packages/domain/src/index.ts`

### Constraints
- Zod schemas are the single source of truth
- Types must be derived from schemas only (`z.infer`)
- No manual type definitions in `/types/`
- Keep schemas minimal and conservative (avoid guessing many fields)
- Do not implement ingestion logic or parsing in this task
- Do not touch DB/Prisma in this task
- Do not change folder structure

### Open Questions
None.

---

## IMPLEMENT

### Files Touched
Only the files listed in Outputs above.

No other files may be created/modified without updating the PLAN.

---

## VALIDATE

### Validation Artifacts
- Add unit tests **only if needed** (optional for this task)
- At minimum ensure:
  - Code compiles (TypeScript)
  - Exports are consistent
  - No shadow types exist

### Success Criteria
- Schemas exist and are syntactically correct Zod schemas
- Types file contains ONLY `z.infer` exports
- Validators exist and are used where relevant (at least referenced by schemas or ready-to-use)
- Public exports are clean and predictable

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
- None

### Follow-ups
- TASK-002: Ingestion pipeline skeleton (extract → normalize → validate)
