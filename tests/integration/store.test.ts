import { beforeEach, describe, expect, it, vi } from "vitest";

// Server actions call requireAdmin() / revalidatePath() — stub the Next.js runtime pieces.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(),
}));
vi.mock("@/server/auth", () => ({
  requireAdmin: vi.fn(async () => ({ id: "admin-1", email: "a@test", name: "Admin" })),
  getCurrentAdmin: vi.fn(async () => ({ id: "admin-1", email: "a@test", name: "Admin" })),
}));

import { db } from "@/server/db";
import { listProducts } from "@/server/catalog";
import { getAnalytics } from "@/server/analytics";
import { createOrder } from "@/server/orders/create-order";
import { changeOrderStatus } from "@/server/orders/admin-orders";
import { deleteProductAction, saveProductAction } from "@/server/admin/product-actions";
import { resolveRange } from "@/features/analytics/calc";
import type { ProductFormValues } from "@/features/admin/product-schema";
import { customer, resetDb, seedBasics } from "./helpers";

let s: Awaited<ReturnType<typeof seedBasics>>;
const ctx = { ip: null, userAgent: null, attribution: null };

beforeEach(async () => {
  await resetDb();
  s = await seedBasics();
});

describe("catalog browsing", () => {
  it("searches with Arabic spelling variants", async () => {
    const res = await listProducts({ q: "اوميغا" });
    expect(res.items.map((p) => p.slug)).toEqual(["omega"]);
  });

  it("filters by category, stock and sale", async () => {
    expect((await listProducts({ categoryId: s.tonics.id })).items.map((p) => p.slug)).toEqual(["syrup"]);
    expect((await listProducts({ inStock: true })).items.map((p) => p.slug).sort()).toEqual(["d3", "omega"]);
    expect((await listProducts({ onSale: true })).items.map((p) => p.slug)).toEqual(["d3"]);
  });

  it("sorts by price and paginates", async () => {
    const asc = await listProducts({ sort: "price_asc", pageSize: 2, page: 1 });
    expect(asc.items.map((p) => p.price)).toEqual([14_000, 18_000]);
    expect(asc.pageCount).toBe(2);
    expect((await listProducts({ sort: "price_asc", pageSize: 2, page: 2 })).items.map((p) => p.price)).toEqual([28_000]);
  });

  it("hides drafts and products in hidden categories", async () => {
    await db.product.update({ where: { id: s.d3.id }, data: { status: "DRAFT" } });
    await db.category.update({ where: { id: s.tonics.id }, data: { active: false } });
    expect((await listProducts({})).items.map((p) => p.slug)).toEqual(["omega"]);
  });
});

describe("analytics from real orders", () => {
  it("computes revenue, orders, AOV and customers excluding cancelled orders", async () => {
    const a = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 2 }], paymentMethod: "COD" }, ctx); // 36k + 5k
    await createOrder({ customer: { ...customer, phone: "07811112222" }, items: [{ productId: s.omega.id, quantity: 1 }], paymentMethod: "COD" }, ctx); // 28k + 5k
    const c = await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    await changeOrderStatus(c.id, "CANCELLED", null);
    await db.storeSession.createMany({ data: Array.from({ length: 40 }, (_, i) => ({ id: `sess-${i}-xxxxxxxx` })) });

    const res = await getAnalytics(resolveRange("7d"));
    expect(res.summary.revenue).toBe(a.total + 33_000);
    expect(res.summary.orders).toBe(2);
    expect(res.summary.cancelledOrders).toBe(1);
    expect(res.summary.aov).toBe(Math.round((a.total + 33_000) / 2));
    expect(res.summary.customers).toBe(2);
    expect(res.summary.conversionRate).toBeCloseTo(2 / 40);
    expect(res.topProducts[0]).toMatchObject({ name: "فيتامين د3", units: 2, revenue: 36_000 });
    expect(res.categoryPerformance).toEqual([expect.objectContaining({ name: "فيتامينات", revenue: 64_000, units: 3 })]);
  });
});

describe("customers", () => {
  it("creates one customer per phone and tracks first/last order", async () => {
    await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    await createOrder({ customer: { ...customer, fullName: "زينب علي حسن", phone: "+964 770 123 4567" }, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    const customers = await db.customer.findMany({ include: { _count: { select: { orders: true } } } });
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({ phone: "07701234567", name: "زينب علي حسن" });
    expect(customers[0]._count.orders).toBe(2);
    expect(customers[0].lastOrderAt!.getTime()).toBeGreaterThanOrEqual(customers[0].firstOrderAt!.getTime());
  });
});

describe("product CRUD (admin actions)", () => {
  const values = (): ProductFormValues => ({
    name: "مغنيسيوم 400",
    slug: "magnesium-400",
    sku: "dh-mag-400",
    categoryId: s.vitamins.id,
    status: "ACTIVE",
    price: "24000",
    compareAtPrice: "",
    stock: "12",
    shortDescription: "مغنيسيوم في كبسولات نباتية.",
    description: "وصف كامل لمنتج المغنيسيوم لأغراض الاختبار.",
    brand: "",
    netContent: "90 كبسولة",
    weightGrams: "",
    benefits: "كبسولات نباتية\n400 ملغ",
    ingredients: "",
    usage: "",
    warnings: "",
    faq: [{ q: "سؤال؟", a: "جواب." }],
    featured: true,
    bestSeller: false,
    metaTitle: "",
    metaDescription: "",
    images: [{ url: "/images/products/magnesium-glycinate-400-1.webp", alt: "" }],
  });

  it("creates, validates, updates and deletes a product", async () => {
    const created = await saveProductAction(null, values());
    expect(created.ok).toBe(true);
    const row = await db.product.findUniqueOrThrow({ where: { id: created.id! }, include: { images: true } });
    expect(row).toMatchObject({ sku: "DH-MAG-400", price: 24_000, stock: 12, compareAtPrice: null, featured: true });
    expect(row.benefits).toEqual(["كبسولات نباتية", "400 ملغ"]);
    expect(row.images).toHaveLength(1);
    expect(row.searchText).toContain("مغنيسيوم");

    const dup = await saveProductAction(null, { ...values(), name: "آخر" });
    expect(dup.fieldErrors).toMatchObject({ slug: expect.any(String), sku: expect.any(String) });

    const invalid = await saveProductAction(created.id!, { ...values(), price: "20000", compareAtPrice: "15000" });
    expect(invalid.fieldErrors?.compareAtPrice).toBeDefined();

    const updated = await saveProductAction(created.id!, { ...values(), price: "22000", compareAtPrice: "24000", images: [] });
    expect(updated.ok).toBe(true);
    const after = await db.product.findUniqueOrThrow({ where: { id: created.id! }, include: { images: true } });
    expect(after).toMatchObject({ price: 22_000, compareAtPrice: 24_000 });
    expect(after.images).toHaveLength(0);

    await expect(deleteProductAction(created.id!)).rejects.toThrow("REDIRECT:/admin/products?deleted=1");
    expect(await db.product.findUnique({ where: { id: created.id! } })).toBeNull();
  });

  it("archives instead of deleting products that were ordered", async () => {
    await createOrder({ customer, items: [{ productId: s.d3.id, quantity: 1 }], paymentMethod: "COD" }, ctx);
    const res = await deleteProductAction(s.d3.id);
    expect(res.ok).toBe(true);
    expect((await db.product.findUniqueOrThrow({ where: { id: s.d3.id } })).status).toBe("ARCHIVED");
  });
});
