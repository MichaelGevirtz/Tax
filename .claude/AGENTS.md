# AGENTS.md — Operating Rules (Always-On)

This file defines how Claude should operate to minimize drift and token waste.

---

## Context Budget Rules (Critical)

### Always-On Context (keep small)
Claude should always rely on:
- `/.claude/CLAUDE.md`
- `/.claude/AGENTS.md`
- `/docs/product/INDEX.md`

### On-Demand Context (load only when needed)
Load additional context ONLY when the TASK requires it:
- Other `/docs/product/*` files
- ADRs and architecture docs under `/docs/architecture/*`
- The specific TASK file under `/docs/tasks/*`
- Code files relevant to the task

Default behavior: **DO NOT open large product documents.**

---

## When to Load Full Product Docs (Keyword Triggers)

Load only the relevant file when needed:

- Keyword: **"business rules"**
  - Load: `/docs/product/decision-log.md`

- Keyword: **"rejected"** or **"why not"**
  - Load: `/docs/product/rejected-ideas.md`

- Keyword: **"open question"** or **"unknown"**
  - Load: `/docs/product/open-questions.md`

- Keyword: **"competitors"**, **"pricing"**, **"positioning"**, **"UX"**
  - Load: `/docs/product/competitors_research.md`

If not triggered: stay with Always-On context only.

---

## PIV Loop Execution Rules (Per TASK)

When working on a TASK:

1) **PLAN**
- Read the TASK file
- Ensure PLAN is explicit (goal, inputs/outputs, constraints)
- If unclear: update PLAN before coding

2) **IMPLEMENT**
- Touch only files listed in “Files Touched”
- No scope expansion
- No updates to product knowledge files

3) **VALIDATE**
- Add/update tests as specified
- Run/ensure required validation artifacts exist
- Confirm determinism/versioning/auditability principles

4) **ITERATE**
- Only here: update product knowledge files if required
  - decision-log / rejected-ideas / open-questions
- Or create follow-up TASKs

---

## Database Change Workflow (Prisma)

Any DB change must follow this workflow exactly:

1) Update:
- `/prisma/schema.prisma`

2) Run migrations:
- `pnpm prisma migrate dev --name <descriptive_name>`

3) Generate client:
- `pnpm prisma generate`

4) Seed update (if needed):
- Update `/prisma/seed.ts` and `/fixtures/seed-data/*`

5) Commit together:
- `prisma/schema.prisma`
- `/prisma/migrations/*`
- any seed changes

Never commit schema changes without migrations.

---

## Output Expectations

When asked to implement a task:
- Prefer small diffs
- Keep changes localized
- Add tests with the change (not later)
- Do not add “helpful” extra refactors unless a TASK requires it
