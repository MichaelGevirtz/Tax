# Skill: UI Analytics Contract

## Purpose

Define what UI events are tracked, how they're named, and what properties they carry. This enables funnel measurement, drop-off detection, and trust-relevant event tracking.

## Non-Goals

- Not a backend analytics architecture
- Not a dashboard or BI spec
- Not a data warehouse schema
- Not marketing analytics or attribution

---

## Principles

1. **Measure the funnel** — track completion of each step to understand conversion
2. **Detect drop-offs** — know where users abandon the flow and why
3. **Track trust signals** — monitor events that indicate user confidence (or lack of it)
4. **Privacy first** — never compromise user privacy for analytics convenience

---

## Privacy Rule (Non-Negotiable)

Analytics must NEVER log:

- Raw tax amounts (gross income, tax deducted, etc.)
- Israeli ID numbers (employee or employer)
- File contents or extracted text
- Any field values from Form 106 or Form 135
- Any personally identifiable information (PII)

What IS allowed:

- Counts (fields extracted, warnings count)
- Statuses (success, failure, needs-review)
- Step and screen identifiers
- Error codes (structural, not containing user data)
- File metadata (type, size in KB — not name or content)
- Durations (time spent on step)

---

## Global Event Schema

### Naming Convention

- All event names: `snake_case`
- Format: `{action}_{object}` (e.g., `upload_started`, `field_edited`)

### Required Properties (on every event)

| Property | Type | Description |
|----------|------|-------------|
| `flow_id` | string (UUID) | Unique ID for this flow session. Generated when user starts Step 1. |
| `step_id` | string | Step identifier: `upload`, `review`, `generate`, `download` |
| `timestamp` | string (ISO 8601) | When the event occurred |

### Optional Properties (when applicable)

| Property | Type | When Used |
|----------|------|-----------|
| `error_code` | string | On failure events |
| `field_name` | string | On field-level events (edit, validation) |
| `file_type` | string | On upload events |
| `file_size_kb` | number | On upload events |
| `fields_extracted_count` | number | On extraction success |
| `warnings_count` | number | On extraction success |
| `duration_ms` | number | On timed events (processing, generation) |

---

## Events Per Step

### Step 1: Upload

| Event | Trigger | Extra Properties |
|-------|---------|-----------------|
| `upload_started` | User selects or drops a file | `file_type`, `file_size_kb` |
| `upload_failed` | File rejected (wrong format, too large, etc.) | `error_code` |
| `upload_succeeded` | File accepted, ready for extraction | `file_type`, `file_size_kb` |
| `extraction_started` | System begins extracting data from PDF | — |
| `extraction_failed` | Extraction could not complete | `error_code`, `duration_ms` |
| `extraction_succeeded` | Extraction complete, data available | `fields_extracted_count`, `warnings_count`, `duration_ms` |

### Step 2: Review

| Event | Trigger | Extra Properties |
|-------|---------|-----------------|
| `review_opened` | User enters the Review screen | `fields_extracted_count`, `warnings_count` |
| `field_edited` | User modifies an extracted field value | `field_name` |
| `validation_failed` | A field edit fails validation | `field_name`, `error_code` |
| `review_confirmed` | User checks the confirmation checkbox and proceeds | — |

### Step 3: Generate

| Event | Trigger | Extra Properties |
|-------|---------|-----------------|
| `generate_started` | User clicks "Generate Form 135" | — |
| `generate_failed` | PDF generation fails | `error_code`, `duration_ms` |
| `generate_succeeded` | PDF generation completes | `duration_ms` |
| `pdf_downloaded` | User clicks "Download PDF" | — |

### Step 4: Download / Guidance

| Event | Trigger | Extra Properties |
|-------|---------|-----------------|
| `guidance_viewed` | User reaches the Download/Guidance screen | — |
| `package_downloaded` | User clicks "Download Package" | — |

---

## Funnel Definition

The conversion funnel is defined by these step-completion events, in order:

1. `extraction_succeeded` — Step 1 complete
2. `review_confirmed` — Step 2 complete
3. `generate_succeeded` — Step 3 complete
4. `package_downloaded` — Step 4 complete (full conversion)

A user who triggers event N but not event N+1 is a drop-off at step N.

---

## Drop-Off Detection

| Drop-off Point | Signal |
|----------------|--------|
| Upload abandoned | `upload_started` without `upload_succeeded` or `extraction_succeeded` |
| Upload failed | `upload_failed` without subsequent `upload_started` (user gave up) |
| Extraction failed | `extraction_failed` without subsequent `upload_started` (no retry) |
| Review abandoned | `review_opened` without `review_confirmed` |
| Generation failed | `generate_failed` without subsequent `generate_started` (no retry) |
| Download skipped | `generate_succeeded` without `pdf_downloaded` or `package_downloaded` |

---

## QA Checklist

Before release, verify:

- [ ] Every event in the table above fires in the correct state
- [ ] Required properties (`flow_id`, `step_id`, `timestamp`) present on every event
- [ ] No PII in any event payload (spot-check: search payloads for ID patterns, monetary values)
- [ ] `flow_id` is consistent across all events in a single user flow session
- [ ] Funnel events fire in the correct order (no step-completion event without its predecessor)
- [ ] Error events include a meaningful `error_code`
- [ ] `duration_ms` values are reasonable (not negative, not absurdly large)
- [ ] Events fire correctly when user navigates back and repeats a step
- [ ] No duplicate events on re-renders or component remounts
