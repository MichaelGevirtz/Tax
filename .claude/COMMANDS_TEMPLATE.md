# COMMANDS_TEMPLATE.md — Template for Slash Commands

Use this template when creating new `.claude/commands/*.md` files.

---

## Required Structure

```markdown
# [Command Title]: $ARGUMENTS

## Your Role

[1 sentence: who Claude is acting as for this command. Be specific about expertise area.]

## Context

- **Product:** Self-serve SaaS for Israeli salaried employees to generate Form 135 tax refund filings
- **[Domain-specific context]:** [e.g., traffic model, user emotional state, technical stack]
- **Constraints:** [key constraints relevant to this command — reference CLAUDE.md rules]

## Instructions

1. **Find and read all source files** related to `$ARGUMENTS`. Search in:
   - `apps/web/app/$ARGUMENTS/` (page route)
   - `apps/web/components/$ARGUMENTS/` (component directory)
   - [add other relevant search paths]

2. **Always read these files** for context:
   - [list required reference files — see Context Files Reference below]

3. **Produce output** following the sections below.

## [Audit / Analysis / Output] Framework

### A. [Section Name]
- [specific questions, checks, or analysis points]

### B. [Section Name]
- [specific questions, checks, or analysis points]

[... more sections as needed ...]

## Constraints (Do NOT Violate)

- [list hard rules from CLAUDE.md and design system]
- Hebrew text — all user-facing copy stays in Hebrew
- Follow specs in `docs/ui/`
- Respect payment flow guardrails (AGENTS.md)
- [add command-specific constraints]

## Output Format

1. **Executive Summary** — [3-5 sentences: key finding]
2. **[Section]** — [what this section contains]
3. **Implementation Priority** — P0 (critical) / P1 (high impact) / P2 (polish)
4. **Quick Wins** — [changes with high impact and low effort]

[End with a north-star statement that anchors the audit's perspective]
```

---

## Context Files Reference

Include the relevant files based on command type:

### UI/UX Commands
```
- `.claude/design-system/ui-rules.md`
- `.claude/design-system/copy-rules.he.md`
- `docs/ui/skill-layout-contract.md`
- `docs/ui/skill-visual-quality.md`
- `docs/ui/skill-ui-system.md`
- `apps/web/app/globals.css` (design tokens)
```

### SEO/Content Commands
```
- `.claude/design-system/seo-geo.md`
- `.claude/design-system/copy-rules.he.md`
- `docs/product/competitors_research.md`
```

### Product/Business Commands
```
- `docs/product/project-context.md`
- `docs/product/decision-log.md`
- `docs/product/rejected-ideas.md`
- `docs/product/open-questions.md`
```

### All Commands (always verify)
```
- `.claude/CLAUDE.md` (project constitution)
- `.claude/AGENTS.md` (operating rules + payment guardrails)
```

---

## Naming Convention

- **Filename**: `kebab-case.md` (e.g., `ux-audit.md`, `seo-audit.md`, `copy-review.md`)
- **Title**: `[Action Noun] [Subject]: $ARGUMENTS` (e.g., "UX Audit: $ARGUMENTS")
- **Scope**: Single-purpose commands. Don't combine audit types into one command.

---

## Checklist Before Committing a New Command

- [ ] Uses `$ARGUMENTS` placeholder for user input
- [ ] Context section references correct product constraints
- [ ] Instructions include "find and read source files" step
- [ ] Required reference files listed explicitly
- [ ] Constraints section includes relevant CLAUDE.md + design-system rules
- [ ] Output format is specific and actionable (no vague advice)
- [ ] Every recommendation must include exact file/code/text changes
- [ ] North-star statement at the end grounds the audit perspective
