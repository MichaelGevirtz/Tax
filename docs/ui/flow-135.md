# Flow: Form 135 Generation (v1 — Source of Truth)

## Purpose

Single source of truth for the v1 user flow. Every screen's goal, conditions, states, and constraints are defined here. Implementation must conform to this document.

## Non-Goals

- Not a wireframe or visual mockup
- Not a visual spec (see `skill-visual-quality.md`)
- Not implementation instructions or code architecture
- Not a component spec (see `skill-ui-system.md`)

---

## Flow Overview

```
Step 1          Step 2          Step 3          Step 4
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Upload  │ →  │  Review  │ →  │ Generate │ →  │ Download │
│ Form 106 │    │   Data   │    │ Form 135 │    │ Guidance │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

4 steps. Linear. No skipping.

---

## Flow-Level Rules

1. **Linear progression only** — steps must be completed in order. No jumping ahead.
2. **Back navigation allowed** — user can return to any completed step by clicking it in the stepper.
3. **Session-scoped data** — extracted data persists within the browser session. No server-side session storage in v1.
4. **New upload = flow reset** — uploading a new file restarts the flow from Step 1. Previous extracted data is discarded.
5. **No auto-save** — data is not saved between sessions. If the user closes the browser, they start over.
6. **No partial completion** — all required fields must be resolved before moving to the next step.

---

## Step 1: Upload

### Goal

User provides their Form 106 PDF so the system can extract tax data from it.

### Entry Conditions

- None (this is the flow entry point)

### Inputs

- User-selected PDF file

### Required User Actions

- Select or drag-and-drop a PDF file
- Wait for extraction to complete

### Exit Conditions (what blocks progression)

- No file selected
- File is not PDF format
- File exceeds maximum size
- File is encrypted or corrupted
- Extraction fails (no data could be extracted)

### States

| State | Description |
|-------|-------------|
| Idle | Upload area shown. No file selected. |
| Uploading | File selected, upload in progress. File name visible. |
| Processing | Extraction in progress. Skeleton/spinner shown. |
| Success | Extraction complete. Summary preview shown. CTA enabled. |
| Error | Extraction failed. Error message + "Try again" shown. CTA disabled. |

### Output

- `Extracted106` data object (passed to Step 2)

### Copy Constraints

- Must show accepted format: "PDF"
- Must show max file size
- Must show privacy one-liner: file is processed securely, not stored beyond session
- Must include "Where do I get Form 106?" help link
- Must NOT say "upload to our servers" or imply permanent storage

---

## Step 2: Review

### Goal

User reviews the extracted data, corrects any errors, and confirms the data is accurate before proceeding.

### Entry Conditions

- Step 1 completed successfully
- `Extracted106` data is available

### Inputs

- `Extracted106` data object from Step 1

### Required User Actions

- Review all extracted fields
- Edit any fields that need correction (via InlineEditField)
- Resolve all fields marked "Needs Review"
- Check the confirmation checkbox: "I have reviewed the data and confirm it is correct"

### Exit Conditions (what blocks progression)

- Any required field is empty
- Any required field has an invalid value (fails Zod validation)
- Any field is still in "Needs Review" status without being reviewed
- Confirmation checkbox is not checked

### States

| State | Description |
|-------|-------------|
| Loaded | ReviewTable displayed with all fields. CTA disabled until conditions met. |
| Editing | User is editing a field. InlineEditField open. |
| Validation Error | A field failed validation. Error shown inline. CTA remains disabled. |
| Ready | All fields valid + checkbox checked. CTA enabled. |

### Output

- Confirmed `Extracted106` data (user-verified, passed to Step 3)

### Copy Constraints

- Field labels in Hebrew
- Source hints shown per field (e.g., "From Form 106, box 042")
- Confirmation checkbox text must say user reviewed and confirms — not that system verified
- Must NOT say "verified", "validated by system", or "guaranteed accurate"

---

## Step 3: Generate

### Goal

User triggers generation of Form 135 PDF from their confirmed data and downloads it.

### Entry Conditions

- Step 2 completed (all fields confirmed, checkbox checked)
- Confirmed data is available

### Inputs

- Confirmed `Extracted106` data from Step 2

### Required User Actions

- Click "Generate Form 135"
- (After generation) Click "Download PDF"

### Exit Conditions (what blocks progression)

- Generation has not been triggered
- Generation failed (user must retry or go back)

### States

| State | Description |
|-------|-------------|
| Ready | Read-only summary of confirmed data. "Generate Form 135" CTA visible. |
| Generating | Generation in progress. Spinner/skeleton. CTA disabled. |
| Success | PDF ready. "Download PDF" button appears. Summary remains visible. |
| Error | Generation failed. Error message + retry option. |

### Output

- Generated Form 135 PDF (available for download)

### Copy Constraints

- Read-only data summary (no editing on this screen)
- Disclaimer text must be always visible (not dismissible):
  > "This document was generated based on the data you provided and reviewed. You are responsible for verifying its accuracy and submitting it to the tax authority."
- Forbidden words: "verified", "approved", "certified", "official", "submitted", "filed"
- May say: "generated", "prepared", "ready for download"

---

## Step 4: Download / Guidance

### Goal

User downloads the Form 135 package and gets clear guidance on next steps (submitting to the tax authority themselves).

### Entry Conditions

- Step 3 completed (PDF generated successfully)
- PDF is available for download

### Inputs

- Generated Form 135 PDF from Step 3

### Required User Actions

- None required (this is the final informational step)
- Optional: download the PDF if not yet downloaded

### Exit Conditions

- None (this is the final step — no forward progression)

### States

| State | Description |
|-------|-------------|
| Loaded | Checklist + download button visible. |

### Output

- None (end of flow)

### Copy Constraints

- Checklist of next steps:
  1. Download the generated Form 135 PDF
  2. Review the document before submitting
  3. Submit to the Israel Tax Authority (with link to relevant info)
- "Download Package" as primary CTA
- Explicitly NO "Submit" or "File" button
- Must NOT say "Your filing is complete" or "We've submitted your return"
- May say: "Your Form 135 is ready", "Download and review before submitting"
- Optional: "Generate another" link to restart the flow

---

## Definition of Done (UI + Behavior)

The flow is "Done" only when all of the following are true:

- [ ] All 4 screens render correctly in RTL (`dir="rtl"`, `lang="he"`)
- [ ] Stepper reflects correct state (locked/current/completed) at every step
- [ ] All entry conditions enforced — user cannot reach a step without meeting prerequisites
- [ ] All exit conditions enforced — CTA disabled with reason when conditions not met
- [ ] All blocking validations prevent progression (no way to skip)
- [ ] Confirmation checkbox required on Review screen before proceeding
- [ ] Disclaimer text present and non-dismissible on Generate screen
- [ ] No "Submit" or "File" button anywhere in the flow
- [ ] No language implying the system files, submits, or approves on behalf of the user
- [ ] Error states show actionable guidance (what happened + what to do)
- [ ] Loading states use skeletons or spinners — no blank screens
- [ ] Back navigation works correctly (returning to a completed step)
- [ ] Uploading a new file resets the flow
- [ ] All interactive elements keyboard-accessible
- [ ] All text meets WCAG AA contrast requirements
