const MIN_TAX_YEAR = 2010;
const MAX_TAX_YEAR = new Date().getFullYear() + 1;

export function isValidTaxYear(year: number): boolean {
  return (
    Number.isInteger(year) && year >= MIN_TAX_YEAR && year <= MAX_TAX_YEAR
  );
}

export { MIN_TAX_YEAR, MAX_TAX_YEAR };
