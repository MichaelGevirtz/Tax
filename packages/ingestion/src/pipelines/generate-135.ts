import * as fs from "fs/promises";
import * as path from "path";
import type { Form135Data, Form135GenerationMeta } from "@tax/domain";
import {
  mapExtracted106ToForm135,
  generateForm135Pdf,
  MAPPER_VERSION,
  GENERATOR_VERSION,
  COORDINATE_VERSION,
  type GenerateForm135Outcome,
} from "@tax/core";
import { ingest106FromPdf, type Ingest106Options } from "./ingest-106";
import { PARSER_VERSION } from "../errors/ingestion-errors";

/**
 * Composite pipeline version: tracks all component versions.
 * Change any component → version string changes → audit trail updated.
 */
export const PIPELINE_VERSION = `pipeline:1.0.0|parser:${PARSER_VERSION}|mapper:${MAPPER_VERSION}|generator:${GENERATOR_VERSION}|coords:${COORDINATE_VERSION}`;

export type Generate135Stage = "extract" | "map" | "generate";

export interface Generate135Result {
  success: true;
  pdfBuffer: Buffer;
  form135Data: Form135Data;
  meta: Form135GenerationMeta;
  pipelineVersion: string;
}

export interface Generate135Error {
  success: false;
  error: {
    stage: Generate135Stage;
    code: string;
    message: string;
    pipelineVersion: string;
  };
}

export type Generate135Outcome = Generate135Result | Generate135Error;

export interface Generate135Options {
  /** Absolute path to project root (for resolving template and font paths) */
  projectRoot: string;
  /** Override font path (absolute) */
  fontPath?: string;
  /** Override template path (absolute) */
  templatePath?: string;
  /** Options forwarded to the Form 106 ingestion stage */
  ingestOptions?: Ingest106Options;
  /** ISO 8601 timestamp for deterministic output; defaults to current time */
  generatedAt?: string;
  /** Absolute path to write the output PDF (optional — if omitted, only returns the buffer) */
  outputPath?: string;
}

/**
 * End-to-end pipeline: Form 106 PDF → Form 135 pre-filled PDF.
 *
 * Stages:
 * 1. **Extract**: Ingest Form 106 PDF (pdftotext → OCR fallback → normalize → validate)
 * 2. **Map**: Transform Extracted106 → Form135Data (pure, deterministic)
 * 3. **Generate**: Overlay mapped data onto blank Form 135 template (pdf-lib)
 *
 * @param form106Path - Absolute path to the source Form 106 PDF
 * @param options - Pipeline options (project root, output path, OCR settings, etc.)
 */
export async function generate135FromForm106(
  form106Path: string,
  options: Generate135Options,
): Promise<Generate135Outcome> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  // Stage 1: Extract Form 106
  const ingestResult = await ingest106FromPdf(form106Path, {
    enableOcrFallback: true,
    ...options.ingestOptions,
  });

  if (!ingestResult.success) {
    return {
      success: false,
      error: {
        stage: "extract",
        code: ingestResult.error.code ?? "EXTRACTION_FAILED",
        message: ingestResult.error.message,
        pipelineVersion: PIPELINE_VERSION,
      },
    };
  }

  // Stage 2: Map Form 106 → Form 135
  let form135Data: Form135Data;
  try {
    form135Data = mapExtracted106ToForm135(ingestResult.data);
  } catch (err) {
    return {
      success: false,
      error: {
        stage: "map",
        code: "MAPPING_FAILED",
        message: `Form 106 → 135 mapping failed: ${err instanceof Error ? err.message : String(err)}`,
        pipelineVersion: PIPELINE_VERSION,
      },
    };
  }

  // Stage 3: Generate Form 135 PDF
  const genResult: GenerateForm135Outcome = await generateForm135Pdf(
    form135Data,
    {
      sourceParserVersion: ingestResult.parserVersion,
      generatedAt,
    },
    {
      projectRoot: options.projectRoot,
      fontPath: options.fontPath,
      templatePath: options.templatePath,
    },
  );

  if (!genResult.success) {
    return {
      success: false,
      error: {
        stage: "generate",
        code: genResult.error.code,
        message: genResult.error.message,
        pipelineVersion: PIPELINE_VERSION,
      },
    };
  }

  // Optional: write output PDF to disk
  if (options.outputPath) {
    const outputDir = path.dirname(options.outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(options.outputPath, genResult.pdfBuffer);
  }

  return {
    success: true,
    pdfBuffer: genResult.pdfBuffer,
    form135Data,
    meta: genResult.meta,
    pipelineVersion: PIPELINE_VERSION,
  };
}
