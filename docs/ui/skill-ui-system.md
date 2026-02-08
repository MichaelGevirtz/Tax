# Skill: UI System — Tax Flow Behavioral Contract

## Purpose

Define how the Form 135 generation flow behaves. This is the behavioral contract for the 4-step app flow screens. Every screen must conform to these rules.

## Non-Goals

- Not a component library or implementation guide
- Not visual specs (see `skill-visual-quality.md`)
- Not analytics (see `skill-analytics-ui.md`)
- Not a wireframe or mockup

---

## Non-Negotiable Principles

### 1. Responsibility Clarity

The system generates documents. The user reviews, downloads, and submits. Every screen must make this division unambiguous.

- Never imply the system files, submits, or approves on behalf of the user
- Never use: "we'll submit", "your filing is complete", "approved", "certified", "official"
- Always use: "generated", "prepared", "ready for your review", "download"

### 2. Deterministic Step Progression

Each step has explicit entry conditions. A user reaches a step only when all prior conditions are met.

- No skipping steps
- No conditional step visibility (all 4 steps are always shown in the stepper)
- Back navigation is allowed (user can return to any completed step)

### 3. Hard Stops

Missing or invalid required data blocks progression. No exceptions.

- Primary CTA is disabled when exit conditions are not met
- Disabled CTA must show a reason (tooltip or inline message)
- No "skip for now" or "complete later" patterns

### 4. Trust-First Copy

All user-facing text must build trust through clarity and honesty. No marketing language in the flow.

- State facts, not promises
- Show what the system did, not what it guarantees
- Errors must explain what happened and what the user can do

---

## Default Screen Layout Pattern

Every app flow screen follows this vertical structure:

```
┌─────────────────────────┐
│  Stepper (progress)     │
├─────────────────────────┤
│  Screen Title           │
│  Short Explainer (1-2   │
│  lines, optional)       │
├─────────────────────────┤
│                         │
│  Primary Content Panel  │
│  (main interaction)     │
│                         │
├─────────────────────────┤
│  Secondary Panel        │
│  (optional: warnings,   │
│   info, tips)           │
├─────────────────────────┤
│  Primary CTA Bar        │
│  (sticky on mobile)     │
└─────────────────────────┘
```

Rules:

- Screen title is mandatory on every step
- Explainer text is optional but recommended. Max 2 lines.
- Only one primary content panel per screen
- CTA bar always anchored at the bottom of the screen content (sticky on mobile)

---

## Core Components (v1)

### Stepper

4 steps: **Upload** → **Review** → **Generate** → **Download**

States per step:

| State | Visual | Behavior |
|-------|--------|----------|
| Locked | Grayed out, no interaction | User has not reached this step |
| Current | Highlighted, active | User is on this step |
| Completed | Check mark, clickable | User can navigate back |

Rules:

- Always visible on app flow screens
- Always shows all 4 steps regardless of current position
- Clicking a completed step navigates back to it

### FileUploadCard

States:

| State | Display |
|-------|---------|
| Idle | Drop zone + "Select file" button. Shows accepted formats and max size. |
| Uploading | Progress indicator. File name shown. Cancel option. |
| Processing | "Extracting data..." message with skeleton/spinner. Not cancellable. |
| Success | File name, extracted summary preview, "Continue" enabled. |
| Error | Error message + what went wrong + "Try again" action. |

Rules:

- Accepted formats: PDF only
- Max file size: displayed clearly (e.g., "up to 10 MB")
- Privacy one-liner always visible in idle state: "Your file is processed locally and not stored beyond this session."
- Drag-and-drop supported on desktop; file picker on mobile
- Only 1 file at a time

### ExtractionSummary

Displayed after successful extraction. Shows:

- Tax year extracted
- Fields extracted: X / Y (e.g., "7 / 7 fields extracted")
- Warnings count (if any fields need review)
- "Review required" badge if any field has low confidence or is missing

Rules:

- Read-only (no editing on this component; editing happens in ReviewTable)
- If any field needs review, the CTA text should reflect it (e.g., "Review Data" not "Continue")

### ReviewTable

Displays all extracted fields for user review.

Columns:

| Column | Description |
|--------|-------------|
| Field label | Hebrew label for the field (e.g., "הכנסה ברוטו") |
| Extracted value | The value extracted from Form 106 |
| Status | Confirmed / Needs Review |
| Edit | Edit button (opens InlineEditField) |
| Source hint | Where this value came from (e.g., "Form 106, box 042") |

Rules:

- Required fields are shown first, sorted by importance
- Fields with "Needs Review" status are visually distinct (warning color)
- All required fields must have a value before proceeding
- Edit action opens InlineEditField inline (no modal)

### InlineEditField

Inline editor for a single field value within the ReviewTable.

Rules:

- Shows original extracted value while editing (for reference)
- Validates on save (type, format, range as defined by Zod schema)
- Save and Cancel buttons
- Invalid input shows validation error inline
- Saving updates the ReviewTable row immediately

### Alert

Variants: `info`, `warning`, `error`

Rules:

| Variant | Behavior |
|---------|----------|
| Info | Informational, does not block progression |
| Warning | Draws attention, does not block progression |
| Error | Blocks progression when `blocking: true`. CTA disabled until resolved. |

- Alerts appear within the screen content (not as toast/popup)
- Max 1 blocking error visible at a time (most critical first)
- Error alerts must include actionable guidance (what to do)

### PrimaryCTABar

Rules:

- Max 1 primary button + 1 secondary button
- Primary button: the main forward action ("Continue", "Generate", "Download")
- Secondary button: optional ("Back", "Start Over")
- Sticky on mobile (fixed to bottom of viewport)
- Static on desktop (at the bottom of the content)
- Disabled state: primary button grayed out with reason visible (tooltip or text below)

---

## Screen Constraints (v1)

### Step 1: Upload

- File requirements shown: "PDF format, up to 10 MB"
- Privacy one-liner visible
- Hard error on: wrong format, file too large, corrupted PDF, encrypted PDF
- Help link: "Where do I get Form 106?" (links to content page)
- CTA: "Extract Data" (disabled until file selected and validated)

### Step 2: Review

- Required fields shown first with visual priority
- Fields needing review marked with warning status
- User can edit any field via InlineEditField
- Confirmation checkbox required: "I have reviewed the data and confirm it is correct"
- CTA: "Continue to Generate" (disabled until all required fields valid + checkbox checked)
- Blocking validation: empty required fields, invalid formats, values outside expected ranges

### Step 3: Generate

- Read-only summary of all confirmed data
- CTA: "Generate Form 135" (triggers generation)
- After generation: "Download PDF" button appears
- Disclaimer text (always visible, not dismissible):
  > "This document was generated based on the data you provided and reviewed. You are responsible for verifying its accuracy and submitting it to the tax authority."
- Forbidden words: "verified", "approved", "certified", "official", "submitted", "filed"

### Step 4: Download / Guidance

- Checklist of next steps:
  1. Download the generated Form 135 PDF
  2. Review the document
  3. Submit to the Israel Tax Authority (with link to relevant info)
- "Download Package" button (primary CTA)
- Explicitly NO "Submit" or "File" button
- No language implying the process is complete from a tax perspective
- Optional: "Generate another" link to restart the flow
