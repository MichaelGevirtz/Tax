// Mappers
export { mapExtracted106ToForm135, MAPPER_VERSION } from "./mappers/form106-to-form135.mapper";

// Generators
export { generateForm135Pdf, GENERATOR_VERSION } from "./generators/form135-pdf.generator";
export type {
  GenerateForm135Options,
  GenerateForm135Result,
  GenerateForm135Error,
  GenerateForm135Outcome,
} from "./generators/form135-pdf.generator";

// Templates
export {
  FORM_135_2024_COORDINATES,
  TEMPLATE_PATHS,
  COORDINATE_VERSION,
  formatMoney,
  formatIsraeliId,
  formatFieldValue,
} from "./templates/form135-coordinates";
export type { FieldCoordinate } from "./templates/form135-coordinates";
