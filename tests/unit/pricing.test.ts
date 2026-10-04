import { describe, expect, it } from "vitest";
import {
  computeSubtotal,
  computeTotals,
  evaluateCoupon,
  normalizeCouponCode,
  resolveShippingFee,
  type CouponRule,
} from "@/features/pricing/rules";

const NOW = new Date("2026-09-27T12:00:00Z");
const base: CouponRule = {
  code: "WELCOME10",
  type: "PERCENTAGE",
  value: 10,
  minOrderAmount: 0,
  expiresAt: null,
  usageLimit: null,
  usedCount: 0,
  active: true,
};

describe("coupons", () => {
  it("normalises codes", () => {
    expect(normalizeCouponCode("  welcome 10 ")).toBe("WELCOME10");
  });

  it("applies a percentage discount rounded down to whole dinars", () => {
    expect(evaluateCoupon(base, 33_333, NOW)).toEqual({ ok: true, discount: 3333 });
  });

  it("applies a fixed discount but never more than the subtotal", () => {
    const fixed = { ...base, type: "FIXED" as const, value: 5000 };
    expect(evaluateCoupon(fixed, 40_000, NOW)).toEqual({ ok: true, discount: 5000 });
    expect(evaluateCoupon(fixed, 3000, NOW)).toEqual({ ok: true, discount: 3000 });
  });

  it("caps percentages at 100%", () => {
    expect(evaluateCoupon({ ...base, value: 250 }, 10_000, NOW)).toEqual({ ok: true, discount: 10_000 });
  });

  it("rejects missing, inactive, expired and exhausted coupons", () => {
    expect(evaluateCoupon(null, 10_000, NOW)).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(evaluateCoupon({ ...base, active: false }, 10_000, NOW)).toMatchObject({ ok: false, error: "INACTIVE" });
    expect(evaluateCoupon({ ...base, expiresAt: new Date("2026-09-27T11:59:59Z") }, 10_000, NOW)).toMatchObject({
      ok: false,
      error: "EXPIRED",
    });
    expect(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 10_000, NOW)).toMatchObject({
      ok: false,
      error: "USAGE_LIMIT_REACHED",
    });
  });

  it("enforces the minimum order amount and reports it", () => {
    expect(evaluateCoupon({ ...base, minOrderAmount: 20_000 }, 19_999, NOW)).toEqual({
      ok: false,
      error: "MIN_ORDER_NOT_MET",
      minOrderAmount: 20_000,
    });
    expect(evaluateCoupon({ ...base, minOrderAmount: 20_000 }, 20_000, NOW)).toEqual({ ok: true, discount: 2000 });
  });
});

describe("shipping", () => {
  it("returns the governorate fee", () => {
    expect(resolveShippingFee({ fee: 5000, active: true }, 10_000, null)).toBe(5000);
  });
  it("is null for inactive or unknown governorates", () => {
    expect(resolveShippingFee({ fee: 5000, active: false }, 10_000, null)).toBeNull();
    expect(resolveShippingFee(null, 10_000, null)).toBeNull();
  });
  it("is free at or above the threshold (after discount)", () => {
    expect(resolveShippingFee({ fee: 7000, active: true }, 75_000, 75_000)).toBe(0);
    expect(resolveShippingFee({ fee: 7000, active: true }, 74_999, 75_000)).toBe(7000);
  });
});

describe("totals", () => {
  it("sums lines and computes the final total", () => {
    const subtotal = computeSubtotal([
      { unitPrice: 18_000, quantity: 2 },
      { unitPrice: 15_000, quantity: 1 },
    ]);
    expect(subtotal).toBe(51_000);
    expect(computeTotals(subtotal, 5100, 5000)).toEqual({ subtotal: 51_000, discount: 5100, shipping: 5000, total: 50_900 });
  });
  it("clamps nonsense discount/shipping values", () => {
    expect(computeTotals(10_000, 99_999, -5)).toEqual({ subtotal: 10_000, discount: 10_000, shipping: 0, total: 0 });
  });
});
