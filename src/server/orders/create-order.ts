import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { randomToken } from "@/server/crypto";
import { baghdadCompactDate } from "@/lib/dates";
import { formatOrderNumber } from "@/features/orders/order-number";
import { normalizeCheckout, type OrderRequest } from "@/features/checkout/schemas";
import { getPaymentMethod } from "@/features/checkout/payment-methods";
import type { Attribution } from "@/features/attribution/shared";
import type { CouponErrorCode } from "@/features/pricing/rules";
import { newEventId } from "@/features/tracking/events";
import { buildQuote, type Quote } from "@/server/checkout/quote";

export type OrderErrorCode =
  | "EMPTY_CART"
  | "STOCK"
  | "NOT_DELIVERABLE"
  | "COUPON"
  | "PAYMENT_METHOD"
  | "MIN_ORDER";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    public details: { quote?: Quote; couponError?: CouponErrorCode; minOrderAmount?: number } = {},
  ) {
    super(code);
    this.name = "OrderError";
  }
}

export type CreateOrderContext = {
  ip: string | null;
  userAgent: string | null;
  attribution: Attribution | null;
  now?: Date;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  accessToken: string;
  purchaseEventId: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  currency: string;
  customerId: string;
  customer: { name: string; phone: string; governorateName: string; district: string };
  lines: Array<{ productId: string; slug: string; name: string; quantity: number; unitPrice: number; categoryId: string }>;
};

/**
 * Creates a Cash-on-Delivery order atomically:
 *  – re-prices everything server-side (products, coupon, shipping) — client totals are ignored
 *  – reserves stock with conditional decrements (never negative, no overselling under concurrency)
 *  – consumes the coupon with a guarded increment (usage limit safe under concurrency)
 *  – upserts the guest customer by phone, generates DH-YYYYMMDD-NNNN
 * Tracking (CAPI Purchase) is dispatched by the caller after the transaction commits.
 */
export async function createOrder(input: OrderRequest, ctx: CreateOrderContext): Promise<CreatedOrder> {
  const now = ctx.now ?? new Date();
  const customer = normalizeCheckout(input.customer);
  const payment = getPaymentMethod(input.paymentMethod);
  if (!payment) throw new OrderError("PAYMENT_METHOD");
  if (input.items.length === 0) throw new OrderError("EMPTY_CART");

  return db.$transaction(
    async (tx) => {
      const quote = await buildQuote(
        tx,
        { items: input.items, couponCode: input.couponCode ?? null, governorateCode: customer.governorateCode },
        now,
      );

      const lines = quote.lines.filter((l) => l.quantity > 0);
      if (lines.length === 0) throw new OrderError("EMPTY_CART", { quote });
      if (quote.hasIssues) throw new OrderError("STOCK", { quote });
      if (!quote.governorate?.deliverable || quote.shipping === null) throw new OrderError("NOT_DELIVERABLE", { quote });
      if (input.couponCode && quote.coupon && !quote.coupon.applied) {
        throw new OrderError("COUPON", { quote, couponError: quote.coupon.error, minOrderAmount: quote.coupon.minOrderAmount });
      }

      // 1) Reserve stock — conditional decrement guarantees stock never goes below zero.
      for (const line of lines) {
        const res = await tx.product.updateMany({
          where: { id: line.productId, status: "ACTIVE", stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (res.count !== 1) throw new OrderError("STOCK", { quote });
      }

      // 2) Consume coupon (guarded against exceeding its usage limit concurrently).
      let couponId: string | null = null;
      if (quote.coupon?.applied) {
        const coupon = await tx.coupon.findUnique({ where: { id: quote.coupon.id } });
        if (!coupon) throw new OrderError("COUPON", { quote, couponError: "NOT_FOUND" });
        const res = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            active: true,
            ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (res.count !== 1) throw new OrderError("COUPON", { quote, couponError: "USAGE_LIMIT_REACHED" });
        couponId = coupon.id;
      }

      // 3) Guest customer (identified by phone)
      const dbCustomer = await tx.customer.upsert({
        where: { phone: customer.phone },
        create: {
          name: customer.fullName,
          phone: customer.phone,
          governorate: quote.governorate.name,
          district: customer.district,
          address: customer.address,
          firstOrderAt: now,
          lastOrderAt: now,
        },
        update: {
          name: customer.fullName,
          governorate: quote.governorate.name,
          district: customer.district,
          address: customer.address,
          lastOrderAt: now,
        },
      });

      // 4) Sequential, human-friendly order number per Baghdad day
      const dateKey = baghdadCompactDate(now);
      const counter = await tx.orderCounter.upsert({
        where: { date: dateKey },
        create: { date: dateKey, seq: 1 },
        update: { seq: { increment: 1 } },
      });
      const orderNumber = formatOrderNumber(dateKey, counter.seq);
      const accessToken = randomToken(24);
      const purchaseEventId = newEventId("purchase");
      const attr = ctx.attribution;

      const order = await tx.order.create({
        data: {
          orderNumber,
          accessToken,
          purchaseEventId,
          customerId: dbCustomer.id,
          status: "PENDING",
          paymentMethod: payment.id,
          paymentStatus: payment.initialPaymentStatus,
          customerName: customer.fullName,
          customerPhone: customer.phone,
          governorateCode: quote.governorate.code,
          governorateName: quote.governorate.name,
          district: customer.district,
          address: customer.address,
          notes: customer.notes,
          subtotal: quote.subtotal,
          discountTotal: quote.discount,
          shippingFee: quote.shipping,
          total: quote.total,
          currency: "IQD",
          couponId,
          couponCode: couponId ? quote.coupon?.code ?? null : null,
          utmSource: attr?.utmSource ?? null,
          utmMedium: attr?.utmMedium ?? null,
          utmCampaign: attr?.utmCampaign ?? null,
          utmContent: attr?.utmContent ?? null,
          utmTerm: attr?.utmTerm ?? null,
          fbclid: attr?.fbclid ?? null,
          landingPage: attr?.landingPage ?? null,
          referrer: attr?.referrer ?? null,
          ipAddress: ctx.ip?.slice(0, 100) ?? null,
          userAgent: ctx.userAgent?.slice(0, 300) ?? null,
          createdAt: now,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.name,
              productSlug: l.slug,
              sku: l.sku,
              image: l.image,
              categoryId: l.categoryId,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          events: {
            create: [
              { type: "CREATED", toStatus: "PENDING", message: "تم إنشاء الطلب من المتجر", createdAt: now },
              { type: "STOCK_RESERVED", message: "تم حجز المخزون", createdAt: now },
            ],
          },
        },
      });

      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, orderId: order.id, customerId: dbCustomer.id, discount: quote.discount },
        });
      }

      return {
        id: order.id,
        orderNumber,
        accessToken,
        purchaseEventId,
        total: quote.total,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shipping: quote.shipping,
        currency: "IQD",
        customerId: dbCustomer.id,
        customer: {
          name: customer.fullName,
          phone: customer.phone,
          governorateName: quote.governorate.name,
          district: customer.district,
        },
        lines: lines.map((l) => ({
          productId: l.productId,
          slug: l.slug,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          categoryId: l.categoryId,
        })),
      };
    },
    { maxWait: 5000, timeout: 15000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
