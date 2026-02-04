export function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
