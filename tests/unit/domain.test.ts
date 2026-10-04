import { describe, expect, it } from "vitest";
import { iraqiPhoneToE164Digits, normalizeIraqiPhone } from "@/lib/phone";
import { formatOrderNumber, ORDER_NUMBER_PATTERN } from "@/features/orders/order-number";
import { allowedNextStatuses, canTransition, isRevenueStatus } from "@/features/orders/status";
import { baghdadCompactDate, baghdadDayKey, startOfBaghdadDay } from "@/lib/dates";
import { discountPercent, formatIQD, toWesternDigits } from "@/lib/format";
import { normalizeSearchText } from "@/lib/search";
import { slugify, SLUG_PATTERN } from "@/lib/slug";

describe("Iraqi phone numbers", () => {
  it.each([
    ["07701234567", "07701234567"],
    ["7701234567", "07701234567"],
    ["+964 770 123 4567", "07701234567"],
    ["00964-770-123-4567", "07701234567"],
    ["٠٧٧٠١٢٣٤٥٦٧", "07701234567"],
    ["07501234567", "07501234567"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeIraqiPhone(input)).toBe(expected);
  });

  it.each(["0770123456", "07201234567", "01234567890", "abc", ""])("rejects %s", (input) => {
    expect(normalizeIraqiPhone(input)).toBeNull();
  });

  it("formats E.164 digits for Meta", () => {
    expect(iraqiPhoneToE164Digits("07701234567")).toBe("9647701234567");
  });
});

describe("order numbers", () => {
  it("formats DH-YYYYMMDD-NNNN", () => {
    expect(formatOrderNumber("20260927", 1)).toBe("DH-20260927-0001");
    expect(formatOrderNumber("20260927", 12345)).toBe("DH-20260927-12345");
    expect(ORDER_NUMBER_PATTERN.test("DH-20260927-0001")).toBe(true);
  });
  it("rejects invalid input", () => {
    expect(() => formatOrderNumber("2026-09-27", 1)).toThrow();
    expect(() => formatOrderNumber("20260927", 0)).toThrow();
  });
  it("uses the Baghdad calendar day (UTC+3)", () => {
    // 22:30 UTC on the 26th is already the 27th in Baghdad
    expect(baghdadCompactDate(new Date("2026-09-26T22:30:00Z"))).toBe("20260927");
    expect(baghdadDayKey(new Date("2026-09-26T20:59:59Z"))).toBe("2026-09-26");
    expect(startOfBaghdadDay(new Date("2026-09-27T10:00:00Z")).toISOString()).toBe("2026-09-26T21:00:00.000Z");
  });
});

describe("order status lifecycle", () => {
  it("allows the normal COD flow", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });
  it("treats delivered and cancelled as final", () => {
    expect(allowedNextStatuses("DELIVERED")).toEqual([]);
    expect(allowedNextStatuses("CANCELLED")).toEqual([]);
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
  });
  it("excludes cancelled orders from revenue", () => {
    expect(isRevenueStatus("CANCELLED")).toBe(false);
    expect(isRevenueStatus("PENDING")).toBe(true);
  });
});

describe("formatting & text helpers", () => {
  it("formats dinars with Western digits", () => {
    expect(formatIQD(25000)).toBe("25,000 د.ع");
    expect(toWesternDigits("٢٥٠٠٠")).toBe("25000");
  });
  it("computes discount percentages", () => {
    expect(discountPercent(18_000, 22_000)).toBe(18);
    expect(discountPercent(18_000, 18_000)).toBeNull();
    expect(discountPercent(18_000, null)).toBeNull();
  });
  it("folds Arabic spelling variants for search", () => {
    expect(normalizeSearchText("أوميغا 3")).toBe(normalizeSearchText("اوميغا ٣"));
    expect(normalizeSearchText("فيتامين سى")).toBe("فيتامين سي");
    expect(normalizeSearchText("علكة")).toBe("علكه");
  });
  it("builds valid slugs", () => {
    expect(slugify("Vitamin D3 5000 IU")).toBe("vitamin-d3-5000-iu");
    expect(SLUG_PATTERN.test(slugify("فيتامين سي 1000"))).toBe(true);
    expect(SLUG_PATTERN.test("bad slug")).toBe(false);
  });
});
