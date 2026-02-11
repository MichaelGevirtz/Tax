# Page Spec Template

Use this template when speccing any new UI screen. Fill in **every** section before implementation.

---

## Screen: [Name]

**Route**: `/[path]`
**Type**: [ ] App flow | [ ] Marketing/content | [ ] Utility

---

### 1. User Context

- **Who arrives here**: [user segment, traffic source (SEO cold visitor / returning user / mid-flow)]
- **Emotional state**: [anxious / neutral / motivated / confused / skeptical]
- **Prior knowledge**: [what they know about tax refunds at this point]
- **What they need**: [the outcome they seek from this screen]

### 2. Screen Goal

- **Primary**: [single sentence — what this screen must accomplish]
- **Secondary**: [optional — what else is valuable but not critical]

### 3. Primary CTA

- **Label (Hebrew)**: [exact text, must follow copy-rules.he.md]
- **Action**: [what happens on click]
- **Disabled condition**: [when CTA is disabled]
- **Disabled reason (Hebrew)**: [text shown below disabled CTA]

### 4. Trust Proof

- **What builds confidence**: [specific trust element on this screen]
- **What could erode trust**: [specific user concern + how we address it]

### 5. Content Hierarchy (top → bottom)

1. [element — e.g., "H1: page title"]
2. [element — e.g., "Subheading: one-line explainer"]
3. [element — e.g., "Main content area"]
4. [element — e.g., "Secondary info panel"]
5. [element — e.g., "Sticky CTA bar"]

### 6. Error States

| Error | Message (Hebrew) | Recovery Action |
|-------|-------------------|-----------------|
| [condition] | [מה קרה] + [מה לעשות] | [user action] |
| [condition] | ... | ... |

### 7. Edge Cases

| Case | Behavior |
|------|----------|
| Empty state (no data) | [what's shown + suggested action] |
| Loading | [skeleton / inline spinner / message] |
| Slow connection (>3s) | [timeout behavior or message] |
| Unsupported file type | [error message + accepted formats] |
| Return visit (data exists) | [restore state or start fresh?] |

### 8. Hard Stops

| Condition | Behavior | Reason Text (Hebrew) |
|-----------|----------|----------------------|
| [what blocks progress] | [disabled CTA / alert / redirect] | [text shown to user] |

### 9. Analytics Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `page_view` | On mount | `{ page: '[name]' }` |
| `cta_click` | Primary CTA clicked | `{ cta: '[label]', step: N }` |
| `error_shown` | Error displayed | `{ error_type: '[type]' }` |
| `drop_off` | User navigates away | `{ step: N, time_on_page: Nms }` |

### 10. Hebrew Copy Draft

```
H1: [text]
Subheading: [text]
Primary CTA: [text]
Secondary CTA: [text]
Helper text: [text]
Disclaimer: [text]
Error 1: [text]
Error 2: [text]
Disabled reason: [text]
```

### 11. Accessibility Notes

- [keyboard behavior: tab order, focus trapping in modals]
- [ARIA requirements: live regions, roles, labels]
- [focus management: where focus goes on entry / after action]

### 12. Mobile Considerations

- [sticky CTA behavior]
- [content reflow at 320px]
- [touch target adjustments]
- [any content that changes layout on mobile]

---

### References (always verify against these)

- Design system: `.claude/design-system/ui-rules.md`
- Copy rules: `.claude/design-system/copy-rules.he.md`
- Layout spec: `docs/ui/skill-layout-contract.md`
- Visual spec: `docs/ui/skill-visual-quality.md`
- Behavioral spec: `docs/ui/skill-ui-system.md`
- Payment guardrails: `.claude/AGENTS.md` (Payment Flow Guardrails section)
