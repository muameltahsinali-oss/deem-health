import { siteConfig } from "@/config/site";

const OFFSET_MS = siteConfig.utcOffsetMinutes * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns a Date whose UTC fields equal the wall-clock time in Baghdad. */
function shiftToBaghdad(date: Date): Date {
  return new Date(date.getTime() + OFFSET_MS);
}

/** "2026-09-27" — calendar day in Baghdad for the given instant. */
export function baghdadDayKey(date: Date): string {
  return shiftToBaghdad(date).toISOString().slice(0, 10);
}

/** "20260927" — compact form used in order numbers. */
export function baghdadCompactDate(date: Date): string {
  return baghdadDayKey(date).replace(/-/g, "");
}

/** UTC instant of 00:00 Baghdad time for the day containing `date`. */
export function startOfBaghdadDay(date: Date): Date {
  const key = baghdadDayKey(date);
  return new Date(Date.parse(`${key}T00:00:00.000Z`) - OFFSET_MS);
}

/** UTC instant of 00:00 Baghdad time for a "YYYY-MM-DD" key. Returns null for invalid input. */
export function parseBaghdadDayKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const ms = Date.parse(`${key}T00:00:00.000Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms - OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Every Baghdad day key from `from` (inclusive) to `to` (exclusive). */
export function eachBaghdadDay(from: Date, to: Date): string[] {
  const keys: string[] = [];
  for (let t = startOfBaghdadDay(from); t < to; t = addDays(t, 1)) {
    keys.push(baghdadDayKey(t));
    if (keys.length > 800) break; // safety guard
  }
  return keys;
}

const dateTimeFormatter = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Current instant. Wrapped so render code doesn't call impure globals directly. */
export function currentDate(): Date {
  return new Date();
}
