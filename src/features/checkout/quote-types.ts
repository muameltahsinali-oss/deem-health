import type { CouponErrorCode } from "@/features/pricing/rules";

/** Shape returned by POST /api/cart/quote (see src/server/checkout/quote.ts). */
export type ClientQuoteLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  categoryId: string;
  unitPrice: number;
  compareAtPrice: number | null;
  requestedQuantity: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  issue: "UNAVAILABLE" | "QTY_ADJUSTED" | null;
};

export type ClientQuote = {
  lines: ClientQuoteLine[];
  subtotal: number;
  discount: number;
  shipping: number | null;
  total: number;
  coupon:
    | { code: string; applied: true; discount: number }
    | { code: string; applied: false; error: CouponErrorCode; minOrderAmount?: number }
    | null;
  governorate: { code: string; name: string; deliverable: boolean } | null;
  freeShippingThreshold: number | null;
  maxQuantityPerItem: number;
  hasIssues: boolean;
};
