# Decision Log

## 2026-02-03 – Core Stack
**Decision:** Use Next.js full-stack with TypeScript.  
**Reason:** Single deployment, strong DX, API + UI in one codebase.

## 2026-02-03 – Database
**Decision:** PostgreSQL with JSONB.  
**Reason:** Financial data requires ACID, auditability, and strong consistency.

## 2026-02-03 – ORM
**Decision:** Prisma.  
**Reason:** Schema-first, type-safe, predictable for AI-assisted development.

## 2026-02-03 – Validation
**Decision:** Zod at system boundaries.  
**Reason:** Runtime validation + type inference, prevents silent data corruption.

## 2026-02-03 – Managed DB Provider
**Decision:** Neon.
**Reason:** DB-only usage, serverless scaling, low operational overhead.

## 2026-02-08 – Service Tier as Secondary Revenue Path
**Decision:** Approve a partner-operated service tier alongside the self-serve SaaS product.
**Constraints:**
- The service tier is operated by an external partner, not in-house.
- No power of attorney granted by us.
- No in-house human handling, phone support, or case management.
- Labeled as "Coming soon" in the UI until a partner is confirmed.
- Must be visually and textually distinct from the self-serve path — users must understand these are different experiences.
- The self-serve SaaS remains the primary product and revenue model.
**Reason:** Captures users who prefer human assistance without building service operations internally. Revenue share with partner. Validated via lead capture before committing.
**Supersedes:** Partial amendment to "Service-First Model" rejection in `rejected-ideas.md`.

## 2026-02-05 – OCR Strategy for CID-Garbled PDFs
**Decision:** Tesseract OCR only (no cloud providers for v1).
**Reason:** Privacy-first approach keeps PII local, zero per-page cost, sufficient for MVP testing. Cloud alternatives (Google Vision, Azure) documented in `/docs/architecture/ocr-strategy.md` for future consideration if Tesseract accuracy proves insufficient.
**Eliminated:** AWS Textract (no Hebrew support).


## 2026-02-XX — Payment Flow: Option D (Refund-Likelihood Gate)

Decision:
- Use Refund-Likelihood Gate (Option D, revised).
- Users see eligibility + confidence before payment.
- No refund amount is shown pre-payment.

Reason:
- Exact refund amount cannot be guaranteed vs Tax Authority.
- Evidence-based eligibility increases trust for SEO traffic.
- Zero marginal compute cost allows free eligibility stage.
- Preserves SaaS-first model and avoids service drift.

Rejected:
- Option C (pay before documents): insufficient trust for new brand.
- Amount-based gating: misleading and legally risky.

Constraints:
- No monetary amounts or ranges pre-payment.
- Payment unlocks execution artifacts only (Form 135 + guide).

## 2026-02-12 – Mandatory 106 Before Payment + Frictionless Upload Model

Decision:

Form 106 upload is mandatory before payment.

No login required before upload.

Instant automated parsing with immediate on-screen results.

Email required only after successful parsing (before verified results are shown).

Account creation (magic link) occurs only at payment stage.

Flow Definition (Locked v1.1):

Questionnaire (Steps 1–5).

Soft eligibility result (no numbers, no estimates).

106 upload (no progress bar, no requirement to upload all years).

Instant parsing and structured recognition per year.

Email capture (required).

Verified eligibility shown instantly (per-year basis).

Payment unlocks filing package for eligible years only.

Behavioral Rules:

Missing years do not block progression.

Each tax year treated independently.

Users may upload additional 106 files later.

No refund amount displayed pre-payment.

Support Policy:

WhatsApp support available for paid users only.

Scope limited to product usage and generated documents.

No tax advisory or authority representation.

Response times depend on system load.

Reason:

Maximizes 106 acquisition.

Reduces early funnel friction.

Preserves SaaS-first architecture.

Prevents service drift.

Strengthens trust through document-based validation before payment.

## 2026-02-12 – Opt-in Email Capture at Soft Result (Remind Later)

Decision:
Users who cannot upload Form 106 immediately may opt-in to provide
their email on the soft-result screen to receive a reminder.

Constraints:
- Email capture is opt-in only (secondary path, not required).
- Users who upload immediately still do not provide email until after parsing.
- No marketing emails. Single reminder only.
- Email is PII — stored with @pii annotation (TASK-018).

Reason:
Users who complete the wizard but lack Form 106 at hand are the highest-intent
non-converters. Without a return mechanism, they are lost. Email capture
enables a single reminder with instructions on how to obtain Form 106.
