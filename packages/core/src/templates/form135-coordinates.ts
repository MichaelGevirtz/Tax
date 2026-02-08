/**
 * Coordinate definition for a single field on the Form 135 PDF.
 *
 * Coordinates are in PDF points (1 pt = 1/72 inch).
 * Origin is bottom-left corner of the page (PDF standard).
 * A4 page dimensions: 595.28 x 841.89 points.
 *
 * Form 135 is RTL Hebrew, but numeric values (IDs, amounts)
 * are always rendered LTR. Alignment refers to position within
 * the fill-in box area.
 */
export interface FieldCoordinate {
  /** Page number (1-indexed) */
  page: 1 | 2;
  /** X position in points from left edge */
  x: number;
  /** Y position in points from bottom edge */
  y: number;
  /** Font size in points */
  fontSize: number;
  /** Maximum width of the field in points */
  maxWidth: number;
  /** Text alignment within the field area */
  align: "left" | "right" | "center";
  /** Display format type */
  format?: "israeliId" | "money" | "year" | "raw";
}

/**
 * Version of the coordinate map. Bump when coordinates change.
 */
export const COORDINATE_VERSION = "1.0.0";

/**
 * Form 135 (2024) field coordinate map.
 *
 * Template: Service_Pages_Income_tax_annual-report-2024_135-2024.pdf
 * Page size: 595.28 x 841.89 pts (A4)
 *
 * IMPORTANT: These coordinates are initial estimates measured from
 * the PDF layout. They MUST be refined via visual testing:
 * 1. Generate a test PDF with sample data
 * 2. Open alongside the blank template
 * 3. Adjust (x, y) until text lands in the correct boxes
 * 4. Re-run tests to verify
 */
export const FORM_135_2024_COORDINATES: Record<string, FieldCoordinate> = {
  // Section א: Employee ID (מספר זהות)
  // 9-digit box in the header area, right side of form
  employeeId: {
    page: 1,
    x: 500,
    y: 789,
    fontSize: 10,
    maxWidth: 90,
    align: "left",
    format: "israeliId",
  },

  // Section ג: Employer ID (מספר מעסיק)
  // In the employer details row below the income boxes
  employerId: {
    page: 1,
    x: 480,
    y: 468,
    fontSize: 9,
    maxWidth: 85,
    align: "left",
    format: "israeliId",
  },

  // Box 158: Gross income — Section ג row 4 (משכורת/שכר עבודה)
  // Main filer value column (right column of the pair 158/172)
  box158_grossIncome: {
    page: 1,
    x: 155,
    y: 338,
    fontSize: 9,
    maxWidth: 70,
    align: "right",
    format: "money",
  },

  // Box 042: Tax deducted — Section מ (מתואר למקדמות וניכויים במקור)
  // Withholdings summary on page 2
  box042_taxDeducted: {
    page: 2,
    x: 155,
    y: 320,
    fontSize: 9,
    maxWidth: 70,
    align: "right",
    format: "money",
  },
};

/**
 * Template path by tax year (relative to project root).
 */
export const TEMPLATE_PATHS: Record<number, string> = {
  2024: "docs/product/135/Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
  2023: "docs/product/135/Service_Pages_Income_tax_annual-report-2023_135-2023.pdf",
  2022: "docs/product/135/Service_Pages_Income_tax_annual-report-2022_annual-singular-report-2022_135-2022.pdf",
  2021: "docs/product/135/Service_Pages_Income_tax_annual-report-2021_135 - 2021.pdf",
  2020: "docs/product/135/Service_Pages_Income_tax_annual-report-2020_135 - 2020.pdf",
  2019: "docs/product/135/Service_Pages_Income_tax_itc135-19.pdf",
};

/**
 * Format a number as Israeli Shekel display amount.
 * Uses manual regex-based thousands separator for determinism
 * (no locale dependency).
 *
 * 622809 -> "622,809"
 * 0      -> "0"
 */
export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Pad an Israeli ID to 9 digits with leading zeros.
 *
 * "31394828" -> "031394828"
 */
export function formatIsraeliId(id: string): string {
  return id.padStart(9, "0");
}

/**
 * Apply formatting based on the field's format type.
 */
export function formatFieldValue(
  value: string | number,
  format?: FieldCoordinate["format"],
): string {
  switch (format) {
    case "israeliId":
      return formatIsraeliId(String(value));
    case "money":
      return formatMoney(Number(value));
    case "year":
      return String(value);
    case "raw":
    default:
      return String(value);
  }
}
