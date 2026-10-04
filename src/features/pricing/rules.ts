/**
 * Pure pricing rules shared by the cart quote API and order creation.
 * The browser never computes authoritative totals — it only displays what these return
 * (via /api/cart/quote) and order creation re-runs them inside the DB transaction.
 */

export type CouponRule = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minOrderAmount: number;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

export type CouponErrorCode =
  | "NOT_FOUND"
  | "INACTIVE"
  | "EXPIRED"
  | "USAGE_LIMIT_REACHED"
  | "MIN_ORDER_NOT_MET";

export type CouponEvaluation =
  | { ok: true; discount: number }
  | { ok: false; error: CouponErrorCode; minOrderAmount?: number };

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Discount is always a whole IQD amount and never exceeds the subtotal. */
export function evaluateCoupon(
  coupon: CouponRule | null,
  subtotal: number,
  now: Date = new Date(),
): CouponEvaluation {
  if (!coupon) return { ok: false, error: "NOT_FOUND" };
  if (!coupon.active) return { ok: false, error: "INACTIVE" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: "EXPIRED" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "USAGE_LIMIT_REACHED" };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { ok: false, error: "MIN_ORDER_NOT_MET", minOrderAmount: coupon.minOrderAmount };
  }

  let discount: number;
  if (coupon.type === "PERCENTAGE") {
    const pct = Math.min(Math.max(coupon.value, 0), 100);
    discount = Math.floor((subtotal * pct) / 100);
  } else {
    discount = Math.max(coupon.value, 0);
  }
  return { ok: true, discount: Math.min(discount, subtotal) };
}

export type ShippingRule = {
  fee: number;
  active: boolean;
};

/**
 * Shipping fee for a governorate. Free-shipping threshold applies to the
 * subtotal after discount. Returns null when the governorate is not deliverable.
 */
export function resolveShippingFee(
  rate: ShippingRule | null,
  subtotalAfterDiscount: number,
  freeShippingThreshold: number | null,
): number | null {
  if (!rate || !rate.active) return null;
  if (freeShippingThreshold !== null && freeShippingThreshold > 0 && subtotalAfterDiscount >= freeShippingThreshold) {
    return 0;
  }
  return Math.max(rate.fee, 0);
}

export type PricedLine = { unitPrice: number; quantity: number };

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

export function computeSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export function computeTotals(subtotal: number, discount: number, shipping: number): Totals {
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const safeShipping = Math.max(shipping, 0);
  return {
    subtotal,
    discount: safeDiscount,
    shipping: safeShipping,
    total: subtotal - safeDiscount + safeShipping,
  };
}
