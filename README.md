
Built with Next.js, TypeScript, Prisma, Zod, and pdf-lib. Hebrew-first, RTL-native.

---

## Architecture

Monorepo with strict package boundaries. Each package has a single responsibility and communicates through typed contracts.

```
apps/
  web/                → Next.js frontend (React, App Router)

packages/
  domain/             → Zod schemas, validators, derived types (single source of truth)
  core/               → Pure business logic: rules, calculations, mappers, PDF generation (no IO)
  ingestion/          → PDF intake: text extraction, OCR, normalization, validation pipelines
  adapters/           → IO boundary: Prisma repositories, storage adapters
  utils/              → Cross-cutting utilities (redaction, helpers)

docs/
  tasks/              → TASK files (every change starts here)
  architecture/       → Technical architecture decisions
  product/            → Product context, decision log, rejected ideas
  ui/                 → UI skill documents (behavioral contracts)
  analytics/          → Analytics skill documents (event contracts)
```

### Design Principles

- **Schemas are the source of truth.** Zod schemas in `domain/` define every data contract. Types are derived via `z.infer`, never hand-written. Validation happens at system boundaries, not inside business logic.
- **Core is pure.** The `core/` package contains zero IO — no file reads, no network calls, no database access. Every function is deterministic: same input, same output, every time. This makes the tax calculation and document generation logic trivially testable and fully auditable.
- **IO lives at the edges.** All side effects — database, file system, external services — are isolated in `adapters/` and `ingestion/`. The boundary between pure logic and IO is explicit and enforced by package structure.
- **Every output is versioned.** Calculations, mappings, and generated documents carry version metadata. Any output can be traced back to the exact logic that produced it.

---

## Development Methodology: PIV Loop

All development follows **Plan → Implement → Validate → Iterate** — a structured loop designed for correctness in AI-assisted codebases.

### Why PIV

When AI generates code at speed, the failure mode is not "too slow" — it is **drift**: small, compounding deviations from intent that are invisible at the individual commit level but corrosive at scale. PIV eliminates drift by making intent explicit and verifiable at every stage.

### The Loop

```
 ┌──────────┐     ┌─────────────┐     ┌────────────┐     ┌───────────┐
 │   PLAN   │ ──→ │  IMPLEMENT  │ ──→ │  VALIDATE  │ ──→ │  ITERATE  │
 └──────────┘     └─────────────┘     └────────────┘     └───────────┘
       ↑                                                        │
       └────────────────────────────────────────────────────────┘
```

**PLAN** — Every change starts with a TASK file (`docs/tasks/TASK-XXX-description.md`). The plan defines goal, inputs, outputs, constraints, and open questions. No code is written until the plan exists. The plan is the contract.

**IMPLEMENT** — Code follows the plan exactly. Only the files listed in the plan are touched. If scope needs to change, the plan is updated first — not the code. This prevents the most common AI failure: "while I'm here, let me also..."

**VALIDATE** — Every change requires validation artifacts: unit tests (co-located), golden tests (end-to-end with real fixtures), schema validation, and determinism checks. Code is not considered complete until validation passes. The Definition of Done is explicit:

- TypeScript typecheck passes
- Lint passes
- Tests added/updated and passing
- Docs updated if contracts changed
- No new TODOs without a referenced follow-up TASK

**ITERATE** — The only phase where product knowledge files (`decision-log.md`, `rejected-ideas.md`, `open-questions.md`) may be updated. Learnings from implementation feed back into the project knowledge base, and follow-up TASKs are created if needed.

### TASK File Structure

Every TASK follows a [standard template](docs/tasks/_TASK_TEMPLATE.md) with four sections matching the loop stages:

```

## PLAN
  Goal, Inputs, Outputs, Constraints, Open Questions

## IMPLEMENT
  Files Touched (explicit allowlist)

## VALIDATE
  Validation Artifacts, Success Criteria

## ITERATE
  Outcome, Knowledge Updates, Follow-ups
```

The TASK file is both the specification and the audit trail. When a question arises about why code looks the way it does, the answer is in the TASK file — not in a commit message, not in a Slack thread, not in someone's memory.

---

## Skill Documents

Skills are **enforceable behavioral contracts** — not guidelines, not best practices, not suggestions. They define what the system must and must not do, with enough specificity that compliance is binary: a screen either conforms or it doesn't.

### Why Skills

Design systems describe what components look like. Skills describe **how the system behaves**. In a self-serve financial product, behavioral correctness matters more than visual polish — a misplaced word ("approved" instead of "generated") creates legal exposure. A skippable validation step undermines the entire trust model.

Skills encode these constraints as testable rules so they survive across developers, across AI sessions, and across time.

### Active Skills

| Skill | Scope | Governs |
|-------|-------|---------|
| [Layout Contract](docs/ui/skill-layout-contract.md) | Site-wide | Spatial frame: header/footer structure, max widths, spacing rhythm, responsive breakpoints, RTL layout rules, forbidden patterns |
| [UI System](docs/ui/skill-ui-system.md) | App flow | Behavioral contract: step progression logic, entry/exit conditions, component states, copy constraints (what language is allowed and forbidden) |
| [Visual Quality](docs/ui/skill-visual-quality.md) | All pages | Visual rules: typography hierarchy, spacing scale, surface treatment, semantic color usage, motion constraints, loading/error states, accessibility baseline |
| [Analytics UI](docs/analytics/skill-analytics-ui.md) | App flow | Event contract: naming conventions, required properties, per-step events, funnel definition, PII exclusion rules |

### Flow Documents

| Document | Scope | Defines |
|----------|-------|---------|
| [Flow 135](docs/ui/flow-135.md) | Form 135 generation | The v1 user flow: 4 screens, per-screen goals, entry/exit conditions, states, required actions, copy constraints, and a Definition of Done checklist |

### How Skills Are Used

1. **During planning** — TASK plans reference relevant skills as constraints. A task that touches the UI must cite which skills apply.
2. **During implementation** — Skills define what is allowed. If a skill says "max 1 primary button per screen", that is not a suggestion.
3. **During validation** — The Definition of Done includes skill compliance. A screen that violates a skill rule does not ship.
4. **During review** — Skills make code review objective. Instead of "I think this button placement feels wrong", the review says "this violates `skill-ui-system.md` section: PrimaryCTABar — max 1 primary button."

---

## Project Knowledge System

The project maintains a structured knowledge base that separates working memory (tasks) from long-term memory (decisions, constraints, rejected ideas).

```
docs/product/
  project-context.md      → What we're building and why
  decision-log.md         → Locked decisions (highest authority)
  rejected-ideas.md       → Explicitly rejected approaches (must not be re-proposed)
  open-questions.md       → Known unknowns awaiting resolution
  competitors_research.md → Market context
```

**Conflict resolution order**: `decision-log.md` > `rejected-ideas.md` > `project-context.md` > everything else.

Only the ITERATE phase of the PIV loop may update knowledge files. This prevents mid-implementation drift where "just updating the docs" becomes a vector for unplanned scope changes.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js (App Router), React | Full-stack in one deployment, strong DX |
| Language | TypeScript (strict) | Type safety across all packages |
| Validation | Zod | Runtime validation + type inference, single source of truth |
| Database | PostgreSQL (Neon) | ACID compliance for financial data, serverless scaling |
| ORM | Prisma | Schema-first, type-safe, predictable |
| PDF Generation | pdf-lib + fontkit | Client-side PDF manipulation, Hebrew font embedding |
| OCR | Tesseract (local) | Privacy-first — PII never leaves the pipeline |
| Testing | Vitest | Fast, TypeScript-native, co-located test files |

---

## Testing Strategy

```
packages/
  domain/src/validators/
    israeli-id.validator.test.ts    ← unit: co-located with source
  ingestion/src/extractors/
    box-extractor.test.ts           ← unit: co-located with source
  ingestion/__tests__/golden/
    *.golden.test.ts                ← golden: e2e with real PDF fixtures
```

- **Unit tests**: co-located `*.test.ts` files next to the implementation
- **Golden tests**: `packages/ingestion/__tests__/golden/` — end-to-end pipelines tested against real Form 106 PDFs with known expected outputs
- **Contract tests**: `packages/**/__tests__/contracts/` — API and schema boundary validation

Run all tests: `npx vitest run` from project root.

---

## Audit Commands

Reusable slash commands for quality assurance across pages. Defined in `.claude/commands/` and available in any Claude Code session.

| Command | Usage | Purpose |
|---------|-------|---------|
| `/ux-audit <page>` | `/ux-audit wizard` | UX, visual, and trust audit — psychological flow, visual gap analysis, component redesign specs |
| `/seo-audit <page>` | `/seo-audit landing` | Technical SEO, content structure, Core Web Vitals, Hebrew keyword optimization |

Pass the page or component name as the argument. The command will find relevant source files, read UI specs and competitor references, and produce a prioritized audit with concrete implementation recommendations.
