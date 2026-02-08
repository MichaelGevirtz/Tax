import type { Extracted106, Form135Data } from "@tax/domain";

/**
 * Version of the mapper logic. Bump when mapping rules change.
 * Used for auditability: we can trace which mapper version produced a given Form 135.
 */
export const MAPPER_VERSION = "1.0.0";

/**
 * Map extracted Form 106 data to Form 135 fields.
 *
 * Pure function: deterministic, no IO, no side effects.
 * Same Extracted106 input always produces same Form135Data output.
 *
 * Phase 1 mapping (single employer):
 *   employeeId         -> employeeId
 *   employerId         -> employerId
 *   taxYear            -> taxYear
 *   grossIncome        -> box158_grossIncome
 *   taxDeducted        -> box042_taxDeducted
 *   socialSecurityDeducted -> (not mapped — informational only)
 *   healthInsuranceDeducted -> (not mapped — informational only)
 */
export function mapExtracted106ToForm135(input: Extracted106): Form135Data {
  return {
    employeeId: input.employeeId,
    taxYear: input.taxYear,
    employerId: input.employerId,
    box158_grossIncome: input.grossIncome,
    box042_taxDeducted: input.taxDeducted,
  };
}
