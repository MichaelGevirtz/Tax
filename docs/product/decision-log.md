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

## 2026-02-05 – OCR Strategy for CID-Garbled PDFs
**Decision:** Tesseract OCR only (no cloud providers for v1).
**Reason:** Privacy-first approach keeps PII local, zero per-page cost, sufficient for MVP testing. Cloud alternatives (Google Vision, Azure) documented in `/docs/architecture/ocr-strategy.md` for future consideration if Tesseract accuracy proves insufficient.
**Eliminated:** AWS Textract (no Hebrew support).
