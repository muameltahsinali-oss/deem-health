import { toWesternDigits } from "./format";

/**
 * URL slug. Keeps Latin letters, digits and Arabic letters so admins can use either script.
 * "Vitamin D3 5000 IU" → "vitamin-d3-5000-iu"
 */
export function slugify(input: string): string {
  return toWesternDigits(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\u064b-\u065f\u0670]/g, "") // Arabic diacritics
    .replace(/[^a-z0-9\u0621-\u064a]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9\u0621-\u064a]+(?:-[a-z0-9\u0621-\u064a]+)*$/;
