import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { buildQuote } from "@/server/checkout/quote";
import { createOrder, OrderError } from "@/server/orders/create-order";
import { changeOrderStatus, OrderUpdateError } from "@/server/orders/admin-orders";
import { ORDER_NUMBER_PATTERN } from "@/features/orders/order-number";
import { customer, resetDb, seedBasics } from "./helpers";

let s: Awaited<ReturnType<typeof seedBasics>>;
const ctx = { ip: "127.0.0.1", userAgent: "vitest", attribution: null };

beforeEach(async () => {
  await resetDb();
  s = await seedBasics();
});

describe("quote (server-authoritative pricing)", () => {
  it("prices from the database, applies coupon and shipping", async () => {
    const q = await buildQuote(db, {
      items: [{ productId: s.d3.id, quantity: 2 }],
      couponCode: "ten",
      governorateCode: "BGD",
    });
    expect(q.subtotal).toBe(36_000);
    expect(q.discount).toBe(3_600);
    expect(q.shipping).toBe(5_000);
    expect(q.total).toBe(37_400);
    expect(q.coupon).toMatchObject({ applied: true, code: "TEN" });
    expect(q.hasIssues).toBe(false);
  });

  it("flags unavailable products and clamps quantities to stock", async () => {
    const q = await buildQuote(db, {
      items: [
        { productId: s.omega.id, quantity: 5 },
        { productId: s.syrup.id, quantity: 1 },
        { productId: "does-not-exist", quantity: 1 },
      ],
    });
    const omega = q.lines.find((l) => l.productId === s.omega.id)!;
    expect(omega).toMatchObject({ issue: "QTY_ADJUSTED", quantity: 2 });
    expect(q.lines.find((l) => l.productId === s.syrup.id)?.issue).toBe("UNAVAILABLE");
    expect(q.lines.find((l) => l.productId === "does-not-exist")?.issue).toBe("UNAVAILABLE");
    expect(q.hasIssues).toBe(true);
  });

  it("returns null shipping for inactive governorates and free shipping above the threshold", async () => {
    expect((await buildQuote(db, { items: [{ productId: s.d3.id, quantity: 1 }], governorateCode: "HLB" })).shipping).toBeNull();
    const big = await buildQuote(db, { items: [{ productId: s.d3.id, quantity: 6 }], governorateCode: "BSR" });
    expect(big.subtotal).toBe(108_000);
    expect(big.shipping).toBe(0);
  });
});

describe("createOrder", () => {
  it("creates a COD order with server totals, decrements stock and upserts the customer", async () => {
    const order = await createOrder(
      { customer, items: [{ productId: s.d3.id, quantity: 3 }], couponCode: "TEN", paymentMethod: "COD" },
      { ...ctx, attribution: { utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "acv", utmContent: null, utmTerm: null, fbclid: "abc", landingPage: "/", referrer: null, capturedAt: 1 } },
    );
    expect(order.orderNumber).toMatch(ORDER_NUMBER_PATTERN);
    expect(order.total).toBe(54_000 - 5_400 + 5_000);

    const row = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, couponUsage: true, events: true } });
    expect(row.paymentMethod).toBe("COD");
    expect(row.paymentStatus).toBe("COD");
    expect(row.status).toBe("PENDING");
    expect(row.customerPhone).toBe("07701234567");
    expect(row.utmSource).toBe("facebook");
    expect(row.items[0]).toMatchObject({ unitPrice: 18_000, quantity: 3, lineTotal: 54_000 });
    expect(row.couponUsage?.discount).toBe(5_400);
    expect(row.events.map((e) => e.type)).toContain("CREATED");
    expect(row.purchaseEventId).toBe(order.purchaseEventId);

    expect((await db.product.findUniqueOrThrow({ where: { id: s.d3.id } })).stock).toBe(7);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "TEN" } })).usedCount).toBe(1);
    const c = await db.customer.findUniqueOrThrow({ where: { phone: "07701234567" } });
    expect(c.firstOrderAt).not.toBeNull();
  });

  it("generates sequential order numbers per day", async () => {
    const a = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    const b = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    const seqA = Number(a.orderNumber.split("-")[2]);
    const seqB = Number(b.orderNumber.split("-")[2]);
    expect(seqB).toBe(seqA + 1);
  });

  it("rejects insufficient stock without changing anything", async () => {
    await expect(
      createOrder({ customer, items: [{ productId: s.omega.id, quantity: 3 }], paymentMethod: "COD" }, ctx),
    ).rejects.toMatchObject({ code: "STOCK" });
    expect((await db.product.findUniqueOrThrow({ where: { id: s.omega.id } })).stock).toBe(2);
    expect(await db.order.count()).toBe(0);
  });

  it("never oversells under concurrent orders", async () => {
    const attempt = () => createOrder({ customer, items: [{ productId: s.omega.id, quantity: 2 }], paymentMethod: "COD" }, ctx);
    const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.product.findUniqueOrThrow({ where: { id: s.omega.id } })).stock).toBe(0);
  });

  it("respects coupon usage limits under concurrency", async () => {
    const attempt = () => createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], couponCode: "ONCE", paymentMethod: "COD" }, ctx);
    const results = await Promise.allSettled([attempt(), attempt()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(OrderError);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "ONCE" } })).usedCount).toBe(1);
  });

  it("rejects invalid coupons and undeliverable governorates", async () => {
    await expect(
      createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], couponCode: "TEN", paymentMethod: "COD" }, ctx),
    ).rejects.toMatchObject({ code: "COUPON", details: { couponError: "MIN_ORDER_NOT_MET" } });
    await expect(
      createOrder({ customer: { ...customer, governorateCode: "HLB" }, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx),
    ).rejects.toMatchObject({ code: "NOT_DELIVERABLE" });
  });
});

describe("admin order management", () => {
  it("cancelling restores stock once and releases the coupon", async () => {
    const order = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 4 }], couponCode: "TEN", paymentMethod: "COD" }, ctx);
    expect((await db.product.findUniqueOrThrow({ where: { id: s.d3.id } })).stock).toBe(6);

    await changeOrderStatus(order.id, "CANCELLED", null, "العميل ألغى");
    expect((await db.product.findUniqueOrThrow({ where: { id: s.d3.id } })).stock).toBe(10);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "TEN" } })).usedCount).toBe(0);
    const row = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { events: true } });
    expect(row.stockRestored).toBe(true);
    expect(row.events.map((e) => e.type)).toEqual(expect.arrayContaining(["STATUS_CHANGED", "STOCK_RESTORED"]));

    await expect(changeOrderStatus(order.id, "PENDING", null)).rejects.toBeInstanceOf(OrderUpdateError);
    expect((await db.product.findUniqueOrThrow({ where: { id: s.d3.id } })).stock).toBe(10);
  });

  it("marks COD orders as paid on delivery", async () => {
    const order = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    for (const status of ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const) {
      await changeOrderStatus(order.id, status, null);
    }
    const row = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.status).toBe("DELIVERED");
    expect(row.paymentStatus).toBe("PAID");
  });
});
