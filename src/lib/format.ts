/** Converts Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Western digits. */
export function toWesternDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

const IQD_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 25000 → "25,000 د.ع" (Western digits are the most readable choice for prices in Iraq). */
export function formatIQD(amount: number): string {
  return `${IQD_FORMATTER.format(Math.round(amount))} د.ع`;
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function discountPercent(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
