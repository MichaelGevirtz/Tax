/**
 * PII redaction utility.
 * All logs that may contain PII MUST pass through redact().
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const ISRAELI_ID_PATTERN = /\b\d{7,9}\b/g;

/**
 * Redact PII from a string for safe logging.
 * Replaces emails and Israeli ID numbers with [REDACTED].
 */
export function redact(input: string): string {
  return input
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(ISRAELI_ID_PATTERN, "[REDACTED_ID]");
}
