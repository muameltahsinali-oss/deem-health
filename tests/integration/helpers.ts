import { db } from "@/server/db";
import { buildProductSearchText } from "@/lib/search";

/** Deletes all rows (FK-safe order). */
export async function resetDb() {
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
    db.storeSettings.deleteMany(),
    db.adminSession.deleteMany(),
    db.adminUser.deleteMany(),
  ]);
}

export async function seedBasics() {
  await db.storeSettings.create({ data: { id: 1, lowStockThreshold: 5, freeShippingThreshold: 100_000, maxQuantityPerItem: 10 } });
  await db.shippingRate.createMany({
    data: [
      { governorateCode: "BGD", name: "بغداد", fee: 5000, active: true, sortOrder: 0 },
      { governorateCode: "BSR", name: "البصرة", fee: 7000, active: true, sortOrder: 1 },
      { governorateCode: "HLB", name: "حلبجة", fee: 7000, active: false, sortOrder: 2 },
    ],
  });
  const vitamins = await db.category.create({ data: { name: "فيتامينات", slug: "vitamins", sortOrder: 1 } });
  const tonics = await db.category.create({ data: { name: "مقويات", slug: "tonics", sortOrder: 2 } });

  const mk = (data: { slug: string; name: string; price: number; compareAtPrice?: number | null; stock: number; categoryId: string; catName: string }) =>
    db.product.create({
      data: {
        slug: data.slug,
        sku: data.slug.toUpperCase(),
        name: data.name,
        shortDescription: "وصف مختصر للاختبار",
        description: "وصف كامل للمنتج لأغراض الاختبار فقط.",
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        stock: data.stock,
        status: "ACTIVE",
        categoryId: data.categoryId,
        searchText: buildProductSearchText([data.name, data.slug, data.catName]),
      },
    });

  const d3 = await mk({ slug: "d3", name: "فيتامين د3", price: 18_000, compareAtPrice: 22_000, stock: 10, categoryId: vitamins.id, catName: "فيتامينات" });
  const omega = await mk({ slug: "omega", name: "أوميغا 3", price: 28_000, stock: 2, categoryId: vitamins.id, catName: "فيتامينات" });
  const syrup = await mk({ slug: "syrup", name: "شراب الحديد", price: 14_000, stock: 0, categoryId: tonics.id, catName: "مقويات" });
  await db.coupon.create({ data: { code: "TEN", type: "PERCENTAGE", value: 10, minOrderAmount: 20_000, active: true } });
  await db.coupon.create({ data: { code: "ONCE", type: "FIXED", value: 3000, minOrderAmount: 0, usageLimit: 1, active: true } });
  return { vitamins, tonics, d3, omega, syrup };
}

export const customer = {
  fullName: "زينب علي",
  phone: "0770 123 4567",
  governorateCode: "BGD",
  district: "الكرادة",
  address: "محلة 901، زقاق 12، دار 5",
  notes: "",
};
