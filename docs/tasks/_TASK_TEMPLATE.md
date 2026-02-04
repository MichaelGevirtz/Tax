# TASK-XXX – <Short Descriptive Title>

## PLAN

### Goal
Describe clearly what this task is meant to achieve.

### Inputs
List all inputs required (data, files, schemas, assumptions).

### Outputs
Define the expected outputs and their format.

### Constraints
List all applicable constraints:
- Business constraints
- Technical constraints
- Regulatory constraints
- References to locked decisions (by file/date)

### Open Questions
List unresolved questions, if any.
If empty, explicitly state: “None”.

---

## IMPLEMENT

### Files Touched
List all files that will be created or modified.

Example:
- packages/domain/src/schemas/normalized-106.schema.ts
- packages/domain/src/types/index.ts

No other files may be modified without updating the PLAN.

---

## VALIDATE

### Validation Artifacts
List all required validation steps.

Examples:
- Unit tests: `<file>.test.ts`
- Golden tests: `<file>.golden.test.ts`
- Schema validation (Zod)
- Determinism check

### Success Criteria
Define what must be true for this task to be considered complete.

Example:
- All tests pass
- Output matches expected fixtures
- No violation of existing decisions

---

## ITERATE

### Outcome
- [ ] Success
- [ ] Partial
- [ ] Failed

### Knowledge Updates
Specify which knowledge files were updated:
- decision-log.md
- rejected-ideas.md
- open-questions.md
- None

### Follow-ups
- New TASKs created (if any)
- Notes for future iterations
