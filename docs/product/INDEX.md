# Product Knowledge Index

This file is the **only always-on product context** for the project.

All other product documents are **long-term memory** and must be loaded **only when explicitly required** by a task.

---

## Authoritative Product Files

- `project-context.md`  
  Defines what we are building, for whom, and explicit constraints.

- `decision-log.md`  
  Records decisions that are **locked**.  
  If something is written here, it must not be re-discussed.

- `rejected-ideas.md`  
  Records approaches that were explicitly rejected.  
  These must not be re-proposed unless reopened via a new decision.

- `open-questions.md`  
  Tracks known uncertainties.  
  Questions move out of this file only via a PIV Iterate step.

- `competitors_research.md`  
  Market reality and positioning constraints.  
  Used only when working on UX, pricing, or positioning tasks.

---

## Conflict Resolution Order

If any documents conflict, follow this order:

1. `decision-log.md` (highest priority)
2. `rejected-ideas.md`
3. `project-context.md`
4. All other documents

---

## PIV Loop Integration Rules

- **PLAN**
  - May reference specific decisions or rejections by name/date
  - Must NOT copy full documents into the task

- **IMPLEMENT**
  - Must NOT open or modify product knowledge files

- **VALIDATE**
  - May verify alignment with locked decisions
  - Must NOT update product knowledge files

- **ITERATE**
  - The ONLY phase allowed to update:
    - `decision-log.md`
    - `rejected-ideas.md`
    - `open-questions.md`
    - `competitors_research.md` (if relevant)

---

## Context Loading Rules (Critical)

Default behavior:
- DO NOT load full product documents

Load a product document only when:
- A task PLAN explicitly references it
- A decision or rejection must be recorded
- The task is explicitly marked as market / UX / pricing related

---

## Core Principle

> TASK files are **working memory**.  
> Product documents are **long-term memory**.  
> Mixing them breaks determinism and causes drift.

If a task requires broad product context, the PLAN is insufficient and must be rewritten.
