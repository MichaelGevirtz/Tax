/**
 * Israeli ID (Teudat Zehut) checksum validation
 * Uses the Luhn-like algorithm for Israeli IDs
 */
export function isValidIsraeliId(id: string): boolean {
  // Pad to 9 digits
  const padded = id.padStart(9, "0");

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(padded)) {
    return false;
  }

  const digits = padded.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = digits[i] * ((i % 2) + 1);
    if (digit > 9) {
      digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}
