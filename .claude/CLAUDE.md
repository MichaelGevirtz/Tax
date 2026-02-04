# CLAUDE.md — Project Constitution (Always-On)

You are Claude Code working inside this repository.

Your job is to implement tasks with high correctness and low drift.
This project is **financial/tax** related: correctness, determinism, and auditability are non-negotiable.

---

## Non-Negotiable Principles (Tax Refund Principle)

Every calculation and eligibility result must be:
1. **Deterministic** — same input ⇒ same output
2. **Versioned** — logic/rules versions are recorded
3. **Auditable** — we can explain and reproduce how a result was produced

If a change violates any of these, it does not ship.

---

## No Code Without a TASK File

- DO NOT write or modify code unless there is an explicit TASK file under `/docs/tasks/`.
- Always read the TASK file first.
- Implement only what the TASK PLAN specifies.
- If scope changes are needed, STOP and update the TASK PLAN first.

---

## PIV Loop Enforcement

All development follows: **Plan → Implement → Validate → Iterate**

Rules:
- PLAN must exist before code.
- IMPLEMENT must follow PLAN exactly.
- VALIDATE is required before merge.
- ITERATE is the only stage allowed to update product knowledge files.

---

## Definition of Done (DoD)

A change is “Done” only if all of the following are true:
- ✅ TypeScript typecheck passes
- ✅ Lint passes
- ✅ Tests added/updated and passing
- ✅ Docs updated if behavior/contracts changed
- ✅ No new TODOs without a referenced follow-up TASK

---

## Test Placement Rules (Strict)

1) **Unit tests**: co-located with source  
   - `*.test.ts` next to the implementation file

2) **Golden tests**: dedicated folder  
   - `/packages/ingestion/__tests__/golden/*.golden.test.ts`

3) **Contract tests** (API/schema): dedicated folder  
   - `/packages/**/__tests__/contracts/*.contract.test.ts`

Do not create ad-hoc test folders.

---

## Schema & Types Rules (Prevent Drift)

- Zod schemas are the single source of truth under:
  - `/packages/domain/src/schemas/`

- Types must be derived ONLY from Zod:
  - `/packages/domain/src/types/index.ts` exports `z.infer<...>` only
  - NO manual type definitions in `/types/` (no “shadow types”)

- Validation helpers belong in:
  - `/packages/domain/src/validators/`

---

## PII Handling Rules (Strict)

This is sensitive financial/tax data.

1) Prisma schema:
- All PII fields must be marked with comment `// @pii`
- Examples: Israeli ID number, email, full name, address, phone, salary details

2) Logging:
- Never log raw Form 106 content (raw PDF text, extracted tables, full payloads)
- All logs that may contain PII MUST pass through `redact()` from:
  - `/packages/utils/src/redaction.ts`

3) Storage:
- Raw documents go under controlled storage and must not leak into logs, errors, or analytics.

If unsure whether something is PII: treat it as PII.

---

## Scope Control

- Do not introduce new libraries/tools unless a TASK explicitly requires it.
- Do not change architecture or folder structure unless a TASK explicitly requires it.
- Prefer small, reviewable diffs.

---

## Communication Style (Inside Code Changes)

- Keep code explicit, typed, and predictable.
- Prefer pure functions in `/packages/core/` (no IO).
- Keep boundaries strict: schemas/validators at edges, pure logic inside core.
