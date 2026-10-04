import { toWesternDigits } from "./format";

/**
 * Normalises an Iraqi mobile number to the local form 07XXXXXXXXX (11 digits).
 * Accepts: 07701234567, 7701234567, +9647701234567, 009647701234567, 964 770 123 4567,
 * Arabic-Indic digits, spaces and dashes. Returns null when invalid.
 */
export function normalizeIraqiPhone(raw: string): string | null {
  let digits = toWesternDigits(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("964")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  // Iraqi mobile numbers: 7[3-9]X XXX XXXX (10 digits without leading 0)
  if (!/^7[3-9]\d{8}$/.test(digits)) return null;
  return `0${digits}`;
}

/** 07701234567 → 9647701234567 (E.164 without "+", the form Meta expects before hashing). */
export function iraqiPhoneToE164Digits(localPhone: string): string {
  const normalized = normalizeIraqiPhone(localPhone);
  if (!normalized) return "";
  return `964${normalized.slice(1)}`;
}
