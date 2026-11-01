// Formatting that matches the original server, which ran with the az-Latn-AZ
// culture: "N0" -> 1.234.568, "N2" -> 1.234,50 (midpoints rounded away from zero).

export function formatNumber(value: number, decimals: number): string {
  const factor = 10 ** decimals;
  const scaled = Math.round(Math.abs(value) * factor + 1e-9);
  const sign = value < 0 && scaled !== 0 ? "-" : "";
  const intPart = Math.floor(scaled / factor).toString();
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decimals === 0) return sign + grouped;
  const frac = (scaled % factor).toString().padStart(decimals, "0");
  return `${sign}${grouped},${frac}`;
}

/** C# Price.ToString("N0") + " ₼" */
export const formatPriceN0 = (value: number) => `${formatNumber(value, 0)} ₼`;
/** C# Amount.ToString("N2") + " ₼" */
export const formatPriceN2 = (value: number) => `${formatNumber(value, 2)} ₼`;

const pad = (n: number) => n.toString().padStart(2, "0");

/** UTC timestamp shown in Baku time (UTC+4), like `.AddHours(4)` in the original views. */
export function formatBakuDate(ms: number, withTime: boolean): string {
  const d = new Date(ms + 4 * 60 * 60 * 1000);
  const date = `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
  return withTime ? `${date} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : date;
}

/** C# decimal.ToString("0.##") */
export function formatPlain(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

/** C# double.ToString("0.0") under az-Latn-AZ (values here are ratings 1–5, so no grouping). */
export function formatOneDecimal(value: number): string {
  return formatNumber(value, 1);
}
