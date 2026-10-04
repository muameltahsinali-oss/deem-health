import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  computeSubtotal,
  computeTotals,
  evaluateCoupon,
  normalizeCouponCode,
  resolveShippingFee,
  type CouponErrorCode,
} from "@/features/pricing/rules";
import { DEFAULT_SETTINGS } from "@/server/settings";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type QuoteLineIssue = "UNAVAILABLE" | "QTY_ADJUSTED";

export type QuoteLine = {
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
  issue: QuoteLineIssue | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  /** null until a (deliverable) governorate is chosen */
  shipping: number | null;
  total: number;
  coupon:
    | { code: string; applied: true; id: string; discount: number }
    | { code: string; applied: false; error: CouponErrorCode; minOrderAmount?: number }
    | null;
  governorate: { code: string; name: string; deliverable: boolean } | null;
  freeShippingThreshold: number | null;
  maxQuantityPerItem: number;
  hasIssues: boolean;
};

export type QuoteInput = {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string | null;
  governorateCode?: string | null;
};

/** Merge duplicate product lines coming from the client. */
function mergeItems(items: QuoteInput["items"]) {
  const map = new Map<string, number>();
  for (const item of items) map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Authoritative pricing. Used by the cart/checkout UI (read-only quote) and re-run inside the
 * order transaction. Never trusts client prices — only product ids, quantities and a coupon code.
 */
export async function buildQuote(client: DbClient, input: QuoteInput, now: Date = new Date()): Promise<Quote> {
  const requested = mergeItems(input.items);
  const settings = (await client.storeSettings.findUnique({ where: { id: 1 } })) ?? DEFAULT_SETTINGS;
  const maxQty = Math.max(1, settings.maxQuantityPerItem);

  const products = requested.length
    ? await client.product.findMany({
        where: { id: { in: requested.map((r) => r.productId) } },
        select: {
          id: true,
          slug: true,
          name: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          status: true,
          categoryId: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      })
    : [];

  const lines: QuoteLine[] = [];
  for (const req of requested) {
    const p = products.find((x) => x.id === req.productId);
    if (!p || p.status !== "ACTIVE") {
      lines.push({
        productId: req.productId,
        slug: p?.slug ?? "",
        name: p?.name ?? "",
        sku: p?.sku ?? "",
        image: p?.images[0]?.url ?? null,
        categoryId: p?.categoryId ?? "",
        unitPrice: p?.price ?? 0,
        compareAtPrice: p?.compareAtPrice ?? null,
        requestedQuantity: req.quantity,
        quantity: 0,
        lineTotal: 0,
        stock: 0,
        issue: "UNAVAILABLE",
      });
      continue;
    }
    const cap = Math.min(p.stock, maxQty);
    const quantity = Math.min(req.quantity, Math.max(cap, 0));
    const issue: QuoteLineIssue | null = cap <= 0 ? "UNAVAILABLE" : quantity < req.quantity ? "QTY_ADJUSTED" : null;
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      image: p.images[0]?.url ?? null,
      categoryId: p.categoryId,
      unitPrice: p.price,
      compareAtPrice: p.compareAtPrice,
      requestedQuantity: req.quantity,
      quantity: issue === "UNAVAILABLE" ? 0 : quantity,
      lineTotal: issue === "UNAVAILABLE" ? 0 : quantity * p.price,
      stock: Math.max(p.stock, 0),
      issue,
    });
  }

  const subtotal = computeSubtotal(lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })));

  // Coupon
  let coupon: Quote["coupon"] = null;
  let discount = 0;
  const code = input.couponCode ? normalizeCouponCode(input.couponCode) : "";
  if (code) {
    const row = await client.coupon.findUnique({ where: { code } });
    const evaluation = evaluateCoupon(row, subtotal, now);
    if (evaluation.ok && row) {
      discount = evaluation.discount;
      coupon = { code, applied: true, id: row.id, discount };
    } else if (!evaluation.ok) {
      coupon = { code, applied: false, error: evaluation.error, minOrderAmount: evaluation.minOrderAmount };
    }
  }

  // Shipping
  let shipping: number | null = null;
  let governorate: Quote["governorate"] = null;
  const govCode = input.governorateCode?.trim().toUpperCase();
  if (govCode) {
    const rate = await client.shippingRate.findUnique({ where: { governorateCode: govCode } });
    const fee = resolveShippingFee(rate, subtotal - discount, settings.freeShippingThreshold);
    governorate = rate ? { code: rate.governorateCode, name: rate.name, deliverable: fee !== null } : null;
    shipping = fee;
  }

  const totals = computeTotals(subtotal, discount, shipping ?? 0);

  return {
    lines,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping,
    total: totals.total,
    coupon,
    governorate,
    freeShippingThreshold: settings.freeShippingThreshold,
    maxQuantityPerItem: maxQty,
    hasIssues: lines.some((l) => l.issue !== null),
  };
}
