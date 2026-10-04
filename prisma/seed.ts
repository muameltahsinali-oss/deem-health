/* eslint-disable no-console */
/**
 * Seed script — `npm run db:seed` (or automatically after `npm run db:reset`).
 * Wipes store data and inserts the DEMO catalog, customers, orders, coupons, reviews,
 * Iraqi shipping rates and the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 */
import { PrismaClient, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { hashPassword, randomToken } from "../src/server/crypto";
import { buildProductSearchText } from "../src/lib/search";
import { computeSubtotal, computeTotals, evaluateCoupon } from "../src/features/pricing/rules";
import { formatOrderNumber } from "../src/features/orders/order-number";
import { IRAQ_GOVERNORATES } from "../src/config/governorates";
import {
  categories,
  demoCoupons,
  demoCustomers,
  demoReviewAuthors,
  demoReviewComments,
  products,
  STANDARD_FAQ,
  STANDARD_WARNING,
} from "./seed-data";
import { PRODUCT_MEDIA } from "../src/config/product-media";

const db = new PrismaClient();
const DAY = 86_400_000;
const BAGHDAD_OFFSET = 3 * 60 * 60 * 1000;

// Deterministic PRNG so every reseed produces the same demo dataset
let seedState = 20260927;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function compactBaghdadDate(d: Date) {
  return new Date(d.getTime() + BAGHDAD_OFFSET).toISOString().slice(0, 10).replace(/-/g, "");
}

async function wipe() {
  await db.$transaction([
    db.trackingEvent.deleteMany(),
    db.orderEvent.deleteMany(),
    db.couponUsage.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.customer.deleteMany(),
    db.review.deleteMany(),
    db.productImage.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.coupon.deleteMany(),
    db.shippingRate.deleteMany(),
    db.orderCounter.deleteMany(),
    db.storeSession.deleteMany(),
  ]);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account. Run `npm run admin:create` later.");
    return;
  }
  if (password.length < 10) { console.warn("⚠ ADMIN_PASSWORD must be at least 10 characters. Skipping admin account creation."); return; }
  const passwordHash = await hashPassword(password);
  await db.adminUser.upsert({
    where: { email },
    create: { email, name: process.env.ADMIN_NAME?.trim() || "مدير المتجر", passwordHash },
    update: { passwordHash },
  });
  console.log(`✓ Admin account ready: ${email}`);
}

async function main() {
  console.log("Seeding Deem Health demo data…");
  await wipe();

  // Settings & tracking singletons (keep existing admin-entered values)
  await db.storeSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      storeName: "Deem Health",
      contactPhone: "07700000000",
      whatsapp: "07700000000",
      contactEmail: "hello@example.com",
      address: "بغداد، العراق",
      lowStockThreshold: 10,
      freeShippingThreshold: 75000,
      maxQuantityPerItem: 10,
      announcementEnabled: false,
      announcementText: null,
    },
    update: {},
  });
  await db.trackingConfiguration.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  // Shipping
  await db.shippingRate.createMany({
    data: IRAQ_GOVERNORATES.map((g, i) => ({ governorateCode: g.code, name: g.name, fee: g.demoFee, active: true, sortOrder: i })),
  });

  // Categories
  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.create({
      data: { ...c, image: null, active: true },
    });
    categoryIds.set(c.slug, row.id);
  }

  // Products
  const now = Date.now();
  const productRows: Array<{ id: string; price: number; name: string; slug: string; sku: string; categoryId: string; image: string; real: boolean }> = [];
  for (const p of products) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category ${p.categorySlug}`);
    const categoryName = categories.find((c) => c.slug === p.categorySlug)?.name ?? "";
    const createdAt = new Date(now - p.ageDays * DAY);
    const row = await db.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        status: "ACTIVE",
        categoryId,
        brand: p.brand,
        netContent: p.netContent,
        weightGrams: p.weightGrams,
        benefits: p.benefits,
        ingredients: p.ingredients,
        usage: p.usage,
        warnings: p.warnings === undefined ? STANDARD_WARNING : p.warnings,
        faq: STANDARD_FAQ,
        featured: p.featured ?? false,
        bestSeller: p.bestSeller ?? false,
        searchText: buildProductSearchText([p.name, p.shortDescription, p.brand, p.sku, categoryName, p.netContent]),
        createdAt,
        images: {
          create: (PRODUCT_MEDIA[p.slug]?.all ?? []).map((m, idx) => ({
            url: m.url,
            alt: m.alt,
            sortOrder: idx,
          })),
        },
      },
    });
    productRows.push({ id: row.id, price: p.price, name: p.name, slug: p.slug, sku: p.sku, categoryId, image: null as unknown as string, real: p.real ?? false });
  }
  console.log(`✓ ${categories.length} categories, ${products.length} products`);
  // Real catalog products get no fabricated sales history or reviews — demo data uses demo products only
  const demoRows = productRows;

  // Coupons
  for (const c of demoCoupons) {
    await db.coupon.create({
      data: {
        code: c.code,
        type: c.type,
        value: c.value,
        minOrderAmount: c.minOrderAmount,
        usageLimit: c.usageLimit,
        description: c.description,
        active: true,
        expiresAt: "expired" in c && c.expired ? new Date(now - 5 * DAY) : new Date(now + 180 * DAY),
      },
    });
  }
  const welcome = await db.coupon.findUniqueOrThrow({ where: { code: "WELCOME10" } });

  // Customers + historical demo orders (stock is NOT decremented for historical orders)
  const rates = await db.shippingRate.findMany();
  const counters = new Map<string, number>();
  let orderCount = 0;
  for (const c of demoCustomers) {
    const rate = rates.find((r) => r.governorateCode === c.governorate)!;
    const nOrders = int(1, 4);
    const customer = await db.customer.create({
      data: { name: c.name, phone: c.phone, governorate: rate.name, district: c.district, address: c.address },
    });
    const dates: Date[] = [];
    for (let i = 0; i < nOrders; i++) dates.push(new Date(now - int(0, 75) * DAY - int(0, 20) * 3600_000));
    dates.sort((a, b) => a.getTime() - b.getTime());

    for (const createdAt of dates) {
      const lineCount = Math.min(int(1, 2), demoRows.length);
      const chosen = new Set<number>();
      while (chosen.size < lineCount) chosen.add(int(0, demoRows.length - 1));
      const lines = [...chosen].map((idx) => ({ p: demoRows[idx], quantity: int(1, 2) }));
      const subtotal = computeSubtotal(lines.map((l) => ({ unitPrice: l.p.price, quantity: l.quantity })));
      const useCoupon = rand() < 0.2;
      const couponEval = useCoupon ? evaluateCoupon({ ...welcome, usedCount: 0 }, subtotal, createdAt) : null;
      const discount = couponEval?.ok ? couponEval.discount : 0;
      const shipping = subtotal - discount >= 75000 ? 0 : rate.fee;
      const totals = computeTotals(subtotal, discount, shipping);

      const ageDays = (now - createdAt.getTime()) / DAY;
      const r = rand();
      let status: OrderStatus;
      if (ageDays < 1) status = r < 0.6 ? "PENDING" : "CONFIRMED";
      else if (ageDays < 3) status = r < 0.3 ? "CONFIRMED" : r < 0.6 ? "PROCESSING" : r < 0.9 ? "SHIPPED" : "CANCELLED";
      else status = r < 0.85 ? "DELIVERED" : "CANCELLED";
      const paymentStatus: PaymentStatus = status === "DELIVERED" ? "PAID" : "COD";

      const dateKey = compactBaghdadDate(createdAt);
      const seq = (counters.get(dateKey) ?? 0) + 1;
      counters.set(dateKey, seq);
      const utm = pick([
        { utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "autumn_vitamins" },
        { utmSource: "instagram", utmMedium: "paid_social", utmCampaign: "acv_gummies" },
        { utmSource: null, utmMedium: null, utmCampaign: null },
        { utmSource: "google", utmMedium: "organic", utmCampaign: null },
      ]);

      const order = await db.order.create({
        data: {
          orderNumber: formatOrderNumber(dateKey, seq),
          accessToken: randomToken(24),
          purchaseEventId: `purchase.demo-${randomToken(8)}`,
          customerId: customer.id,
          status,
          paymentStatus,
          paymentMethod: "COD",
          customerName: c.name,
          customerPhone: c.phone,
          governorateCode: rate.governorateCode,
          governorateName: rate.name,
          district: c.district,
          address: c.address,
          subtotal: totals.subtotal,
          discountTotal: totals.discount,
          shippingFee: totals.shipping,
          total: totals.total,
          couponId: discount > 0 ? welcome.id : null,
          couponCode: discount > 0 ? welcome.code : null,
          stockRestored: status === "CANCELLED",
          ...utm,
          createdAt,
          items: {
            create: lines.map((l) => ({
              productId: l.p.id,
              productName: l.p.name,
              productSlug: l.p.slug,
              sku: l.p.sku,
              image: l.p.image,
              categoryId: l.p.categoryId,
              unitPrice: l.p.price,
              quantity: l.quantity,
              lineTotal: l.p.price * l.quantity,
            })),
          },
          events: {
            create: [
              { type: "CREATED", toStatus: "PENDING", message: "تم إنشاء الطلب (بيانات تجريبية)", createdAt },
              ...(status !== "PENDING"
                ? [{ type: "STATUS_CHANGED" as const, fromStatus: "PENDING", toStatus: status, createdAt: new Date(createdAt.getTime() + 3600_000) }]
                : []),
            ],
          },
        },
      });
      if (discount > 0) {
        await db.couponUsage.create({ data: { couponId: welcome.id, orderId: order.id, customerId: customer.id, discount } });
        await db.coupon.update({ where: { id: welcome.id }, data: { usedCount: { increment: 1 } } });
      }
      orderCount++;
    }
    await db.customer.update({ where: { id: customer.id }, data: { firstOrderAt: dates[0], lastOrderAt: dates[dates.length - 1] } });
  }
  for (const [date, seq] of counters) await db.orderCounter.create({ data: { date, seq } });
  console.log(`✓ ${demoCustomers.length} customers, ${orderCount} orders`);

  // Reviews (approved) + product rating aggregates, plus 2 pending for moderation
  for (const p of demoRows) {
    const n = int(0, 4);
    const ratings: number[] = [];
    for (let i = 0; i < n; i++) {
      const rating = rand() < 0.75 ? 5 : 4;
      ratings.push(rating);
      await db.review.create({
        data: {
          productId: p.id,
          authorName: pick(demoReviewAuthors),
          rating,
          comment: pick(demoReviewComments),
          status: "APPROVED",
          createdAt: new Date(now - int(1, 60) * DAY),
        },
      });
    }
    if (ratings.length) {
      await db.product.update({
        where: { id: p.id },
        data: { ratingCount: ratings.length, ratingAvg: ratings.reduce((a, b) => a + b, 0) / ratings.length },
      });
    }
  }
  if (demoRows.length > 0) {
    await db.review.createMany({
      data: [
        { productId: demoRows[0].id, authorName: "زائر", rating: 4, comment: "هل يوجد حجم أكبر؟ المنتج جيد.", status: "PENDING" },
        ...(demoRows.length > 1 ? [{ productId: demoRows[1].id, authorName: "رنا", rating: 5, comment: "ممتاز وسعره مناسب.", status: "PENDING" as const }] : []),
      ],
    });
  }

  // First-party sessions (demo) so the conversion-rate KPI has data in development
  const sessions: Array<{ id: string; startedAt: Date; landingPath: string; utmSource: string | null }> = [];
  for (let d = 0; d < 90; d++) {
    const perDay = int(25, 60);
    for (let i = 0; i < perDay; i++) {
      sessions.push({
        id: `demo-${d}-${i}-${randomToken(6)}`,
        startedAt: new Date(now - d * DAY - int(0, 23) * 3600_000),
        landingPath: pick([
          "/",
          "/shop",
          "/product/nutriplus-meal-replacement-shake",
          "/category/weight-loss",
          "/product/nutriplus-liquid-collagen-shots",
          "/product/nutriplus-chamomile-extract",
          "/product/nutriplus-chicory-coffee-collagen",
          "/product/nutriplus-recharge",
        ]),
        utmSource: pick(["facebook", "instagram", null, null, "google"]),
      });
    }
  }
  await db.storeSession.createMany({ data: sessions });
  console.log(`✓ ${sessions.length} demo sessions`);

  await seedAdmin();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
