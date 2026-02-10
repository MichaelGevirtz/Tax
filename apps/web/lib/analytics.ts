/**
 * Analytics event dispatcher (v1: console.debug only).
 *
 * Conforms to docs/analytics/skill-analytics-ui.md.
 * Privacy: the type contract prevents PII fields from being accepted.
 */

/** Required properties on every event */
interface AnalyticsEventBase {
  flow_id: string;
  flow_name: string;
  step_id: string;
  timestamp: string;
}

/** Allowed optional properties — no PII fields permitted */
interface AnalyticsEventOptional {
  screen_id?: string;
  error_code?: string;
  locale?: string;
  is_rtl?: boolean;
  cta_id?: string;
  faq_id?: string;
  file_type?: string;
  file_size_kb?: number;
  fields_extracted_count?: number;
  warnings_count?: number;
  duration_ms?: number;
  field_name?: string;
  /** Wizard step identifier (e.g., "step_1") — TASK-UI-004 */
  step_number?: number;
  /** Count of selections in a wizard step — TASK-UI-004 */
  selections_count?: number;
  /** Total wizard steps completed — TASK-UI-004 */
  total_steps?: number;
  /** Count of tax years selected — TASK-UI-004 */
  years_count?: number;
  /** Total selections across all wizard steps — TASK-UI-004 */
  total_selections?: number;
  /** Last step reached before abandoning wizard — TASK-UI-004 */
  last_step_id?: string;
  /** Last step number before abandoning — TASK-UI-004 */
  last_step_number?: number;
  /** Step number navigated from (back action) — TASK-UI-004 */
  from_step_number?: number;
}

export type AnalyticsEvent = AnalyticsEventBase & AnalyticsEventOptional;

let sessionFlowId: string | null = null;

/** Generate a UUID v4 for flow_id */
function generateFlowId(): string {
  return crypto.randomUUID();
}

/** Get or create a flow_id for the current session */
export function getFlowId(): string {
  if (!sessionFlowId) {
    sessionFlowId = generateFlowId();
  }
  return sessionFlowId;
}

/** Reset the flow_id (e.g. when starting a new flow) */
export function resetFlowId(): void {
  sessionFlowId = null;
}

const FLOW_NAME = "tax_refund_funnel";

/**
 * Track an analytics event.
 * v1 implementation: logs to console.debug.
 */
export function trackEvent(
  eventName: string,
  properties: Omit<AnalyticsEvent, "flow_id" | "flow_name" | "timestamp">,
): void {
  const event: AnalyticsEvent = {
    flow_id: getFlowId(),
    flow_name: FLOW_NAME,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  if (typeof window !== "undefined") {
    console.debug(`[analytics] ${eventName}`, event);
  }
}
