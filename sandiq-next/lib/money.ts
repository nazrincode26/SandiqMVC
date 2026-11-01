// Money is stored as numbers with 2 decimals (SQL decimal(18,2) in the original)
// and calculated in integer cents to avoid floating point drift.

export const PLATFORM_FEE_RATE = 0.3; // Order.PlatformFeeRate
const FEE_NUMERATOR = 3; // 0.30 = 3 / 10
const FEE_DENOMINATOR = 10;

export const MAX_IMAGES = 10; // Product.MaxImages

export const toCents = (amount: number) => Math.round(amount * 100);
export const fromCents = (cents: number) => cents / 100;

/**
 * Math.Round(lineTotal * 0.30m, 2) in C# uses banker's rounding (midpoint to even).
 * Returns the fee in cents.
 */
export function platformFeeCents(lineTotalCents: number): number {
  const numerator = lineTotalCents * FEE_NUMERATOR;
  let quotient = Math.floor(numerator / FEE_DENOMINATOR);
  const remainder = numerator - quotient * FEE_DENOMINATOR;
  const twice = remainder * 2;
  if (twice > FEE_DENOMINATOR || (twice === FEE_DENOMINATOR && quotient % 2 !== 0)) quotient += 1;
  return quotient;
}

/** Parses a decimal price as the original model binder would (invariant "." decimal separator). */
export function parsePrice(raw: string | null | undefined): number | null {
  const value = (raw ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  // decimal(18,2): SQL Server rounds extra decimals when saving.
  return Math.round(parsed * 100) / 100;
}
