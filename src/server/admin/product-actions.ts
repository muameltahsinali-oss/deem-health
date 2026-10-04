"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { productFormSchema, toProductData, type ProductFormValues } from "@/features/admin/product-schema";
import { buildProductSearchText } from "@/lib/search";

export type ProductSaveResult = { ok?: boolean; id?: string; error?: string; message?: string; fieldErrors?: Record<string, string> };

function revalidateStore(slug?: string) {
  revalidatePath("/", "layout"); // home, listings, product pages, sitemap
  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function saveProductAction(id: string | null, values: ProductFormValues): Promise<ProductSaveResult> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "يرجى تصحيح الحقول المحددة.", fieldErrors };
  }
  const data = toProductData(parsed.data);

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { name: true } });
  if (!category) return { fieldErrors: { categoryId: "القسم غير موجود" }, error: "يرجى تصحيح الحقول المحددة." };

  const [slugClash, skuClash] = await Promise.all([
    db.product.findFirst({ where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } }),
    db.product.findFirst({ where: { sku: data.sku, ...(id ? { NOT: { id } } : {}) }, select: { id: true } }),
  ]);
  const clashErrors: Record<string, string> = {};
  if (slugClash) clashErrors.slug = "هذا الرابط مستخدم لمنتج آخر";
  if (skuClash) clashErrors.sku = "رمز المنتج مستخدم لمنتج آخر";
  if (Object.keys(clashErrors).length) return { error: "يرجى تصحيح الحقول المحددة.", fieldErrors: clashErrors };

  const searchText = buildProductSearchText([data.name, data.shortDescription, data.brand, data.sku, category.name, data.netContent]);
  const images = parsed.data.images.map((img, i) => ({ url: img.url, alt: img.alt || data.name, sortOrder: i }));
  const { faq, ...rest } = data;
  const payload = { ...rest, faq: faq.length ? (faq as Prisma.InputJsonValue) : Prisma.JsonNull, searchText };

  let previousSlug: string | undefined;
  let savedId: string;
  if (id) {
    const existing = await db.product.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return { error: "المنتج غير موجود." };
    previousSlug = existing.slug;
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: id } }),
      db.product.update({ where: { id }, data: { ...payload, images: { create: images } } }),
    ]);
    savedId = id;
  } else {
    const created = await db.product.create({ data: { ...payload, images: { create: images } } });
    savedId = created.id;
  }

  revalidateStore(data.slug);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/product/${previousSlug}`);
  return { ok: true, id: savedId };
}

/** Deletes a product that was never ordered; otherwise archives it (order history keeps its snapshot). */
export async function deleteProductAction(id: string): Promise<ProductSaveResult> {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id }, select: { slug: true, _count: { select: { orderItems: true } } } });
  if (!product) return { error: "المنتج غير موجود." };
  if (product._count.orderItems > 0) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidateStore(product.slug);
    return { ok: true, id, message: "المنتج مرتبط بطلبات سابقة، لذلك تمت أرشفته بدلاً من حذفه" };
  }
  await db.product.delete({ where: { id } });
  revalidateStore(product.slug);
  redirect("/admin/products?deleted=1");
}

export async function setProductStatusAction(id: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED"): Promise<ProductSaveResult> {
  await requireAdmin();
  const product = await db.product.update({ where: { id }, data: { status }, select: { slug: true } });
  revalidateStore(product.slug);
  return { ok: true, id };
}

/** Inventory quick edit: set absolute stock level. */
export async function updateStockAction(_prev: ProductSaveResult, formData: FormData): Promise<ProductSaveResult> {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  const raw = String(formData.get("stock") ?? "").trim();
  if (!id || !/^\d+$/.test(raw) || Number(raw) > 1_000_000) return { error: "أدخل كمية صحيحة (0 أو أكثر)." };
  const product = await db.product.update({ where: { id }, data: { stock: Number(raw) }, select: { slug: true, name: true } });
  revalidateStore(product.slug);
  revalidatePath("/admin/dashboard");
  return { ok: true, message: `تم تحديث مخزون ${product.name}` };
}
