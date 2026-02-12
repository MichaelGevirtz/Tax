// Prisma client
export { prisma } from "./prisma";

// User repository
export {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
} from "./user.repo";

// Document repository
export {
  createDocument,
  getDocumentById,
  listDocumentsByUser,
  updateDocumentStatus,
  setDocumentTaxYear,
} from "./document.repo";

// Extraction repository
export {
  createExtraction,
  listExtractionsByDocument,
  getExtractionByUnique,
  getLatestExtraction,
} from "./extraction.repo";

// Calculation repository
export {
  createCalculation,
  listCalculationsByUser,
  getCalculationById,
  listCalculationsByUserAndYear,
} from "./calculation.repo";

// Parsing failure repository
export {
  createParsingFailure,
  listFailuresByDocument,
} from "./parsing-failure.repo";

// Reminder repository
export {
  findRecentReminderByEmail,
  createReminder,
  findReminderByToken,
  setReminderSentAt,
  setReminderReturnedAt,
  isTokenExpired,
} from "./reminder.repo";
