import { toWesternDigits } from "./format";

/**
 * Folds Arabic spelling variants so "اوميغا" finds "أوميغا 3", "فيتامين سى" finds "فيتامين سي", etc.
 * Applied both to the stored Product.searchText and to the user's query.
 */
export function normalizeSearchText(input: string): string {
  return toWesternDigits(input)
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "") // tashkeel + tatweel
    .replace(/[\u0623\u0625\u0622\u0671]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0629/g, "ه")
    .replace(/\u0624/g, "و")
    .replace(/\u0626/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildProductSearchText(parts: Array<string | null | undefined>): string {
  return normalizeSearchText(parts.filter(Boolean).join(" ")).slice(0, 2000);
}
