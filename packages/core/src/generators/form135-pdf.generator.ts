import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs/promises";
import * as path from "path";
import type { Form135Data, Form135GenerationMeta } from "@tax/domain";
import { Form135Schema, Form135GenerationMetaSchema } from "@tax/domain";
import {
  FORM_135_2024_COORDINATES,
  TEMPLATE_PATHS,
  formatFieldValue,
  type FieldCoordinate,
} from "../templates/form135-coordinates";

/**
 * Version of the PDF generator. Bump when generation logic changes.
 */
export const GENERATOR_VERSION = "1.0.0";

const DEFAULT_FONT_RELATIVE_PATH = "assets/fonts/NotoSansHebrew-Regular.ttf";

export interface GenerateForm135Options {
  /** Absolute path to project root (for resolving template and font paths) */
  projectRoot: string;
  /** Override font path (absolute) */
  fontPath?: string;
  /** Override template path (absolute) */
  templatePath?: string;
}

export interface GenerateForm135Result {
  success: true;
  pdfBuffer: Buffer;
  meta: Form135GenerationMeta;
}

export interface GenerateForm135Error {
  success: false;
  error: {
    code:
      | "TEMPLATE_NOT_FOUND"
      | "FONT_NOT_FOUND"
      | "INVALID_DATA"
      | "GENERATION_FAILED"
      | "UNSUPPORTED_YEAR";
    message: string;
    generatorVersion: string;
  };
}

export type GenerateForm135Outcome = GenerateForm135Result | GenerateForm135Error;

/**
 * Generate a Form 135 PDF from validated Form135Data.
 *
 * Steps:
 * 1. Validate input data against Form135Schema
 * 2. Load the year-appropriate blank Form 135 template
 * 3. Embed Hebrew font (via fontkit)
 * 4. Draw each field value at its mapped coordinate
 * 5. Return the filled PDF as a Buffer
 *
 * Deterministic: same data + same generatedAt = same PDF bytes.
 */
export async function generateForm135Pdf(
  data: Form135Data,
  meta: { sourceParserVersion: string; generatedAt: string },
  options: GenerateForm135Options,
): Promise<GenerateForm135Outcome> {
  // Step 1: Validate input
  const parseResult = Form135Schema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: {
        code: "INVALID_DATA",
        message: `Form 135 data validation failed: ${parseResult.error.message}`,
        generatorVersion: GENERATOR_VERSION,
      },
    };
  }

  // Step 2: Resolve template path
  const templateRelPath = TEMPLATE_PATHS[data.taxYear];
  if (!templateRelPath) {
    return {
      success: false,
      error: {
        code: "UNSUPPORTED_YEAR",
        message: `No Form 135 template for tax year ${data.taxYear}`,
        generatorVersion: GENERATOR_VERSION,
      },
    };
  }

  const templateAbsPath =
    options.templatePath ?? path.resolve(options.projectRoot, templateRelPath);
  const fontAbsPath =
    options.fontPath ?? path.resolve(options.projectRoot, DEFAULT_FONT_RELATIVE_PATH);

  // Step 3: Load template and font
  let templateBytes: Uint8Array;
  try {
    templateBytes = await fs.readFile(templateAbsPath);
  } catch {
    return {
      success: false,
      error: {
        code: "TEMPLATE_NOT_FOUND",
        message: `Form 135 template not found: ${templateAbsPath}`,
        generatorVersion: GENERATOR_VERSION,
      },
    };
  }

  let fontBytes: Uint8Array;
  try {
    fontBytes = await fs.readFile(fontAbsPath);
  } catch {
    return {
      success: false,
      error: {
        code: "FONT_NOT_FOUND",
        message: `Hebrew font not found: ${fontAbsPath}`,
        generatorVersion: GENERATOR_VERSION,
      },
    };
  }

  try {
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // Set deterministic metadata dates
    const metaDate = new Date(meta.generatedAt);
    pdfDoc.setCreationDate(metaDate);
    pdfDoc.setModificationDate(metaDate);

    const hebrewFont = await pdfDoc.embedFont(fontBytes);
    const pages = pdfDoc.getPages();

    // Step 4: Draw each field at its coordinate
    const coordinates = FORM_135_2024_COORDINATES;
    const fieldValues: Record<string, string | number> = {
      employeeId: data.employeeId,
      employerId: data.employerId,
      box158_grossIncome: data.box158_grossIncome,
      box042_taxDeducted: data.box042_taxDeducted,
    };

    for (const [fieldName, rawValue] of Object.entries(fieldValues)) {
      const coord = coordinates[fieldName];
      if (!coord) continue;

      const page = pages[coord.page - 1];
      if (!page) continue;

      const displayValue = formatFieldValue(rawValue, coord.format);
      drawTextField(page, displayValue, coord, hebrewFont);
    }

    // Step 5: Serialize
    const pdfBytes = await pdfDoc.save();

    const generationMeta: Form135GenerationMeta = {
      generatorVersion: GENERATOR_VERSION,
      sourceForm106ParserVersion: meta.sourceParserVersion,
      templateYear: data.taxYear,
      generatedAt: meta.generatedAt,
    };
    Form135GenerationMetaSchema.parse(generationMeta);

    return {
      success: true,
      pdfBuffer: Buffer.from(pdfBytes),
      meta: generationMeta,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: "GENERATION_FAILED",
        message: `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`,
        generatorVersion: GENERATOR_VERSION,
      },
    };
  }
}

/**
 * Draw text on a PDF page at the specified coordinate with alignment.
 */
function drawTextField(
  page: PDFPage,
  text: string,
  coord: FieldCoordinate,
  font: PDFFont,
): void {
  const textWidth = font.widthOfTextAtSize(text, coord.fontSize);

  let drawX: number;
  switch (coord.align) {
    case "right":
      drawX = coord.x - textWidth;
      break;
    case "center":
      drawX = coord.x - textWidth / 2;
      break;
    case "left":
    default:
      drawX = coord.x;
      break;
  }

  page.drawText(text, {
    x: drawX,
    y: coord.y,
    size: coord.fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}
