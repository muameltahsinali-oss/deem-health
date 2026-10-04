"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { SLUG_PATTERN } from "@/lib/slug";
import { buildProductSearchText } from "@/lib/search";

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "اسم القسم مطلوب").max(60),
  slug: z.string().trim().min(2, "الرابط مطلوب").max(60).regex(SLUG_PATTERN, "أحرف وأرقام وشرطات فقط"),
  description: z.string().trim().max(300),
  image: z.union([z.literal(""), z.string().regex(/^\/(images|api\/uploads)\/[A-Za-z0-9._/-]+$/)]),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    image: formData.get("image") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: "يرجى تصحيح الحقول.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { id, ...data } = parsed.data;
  const clash = await db.category.findFirst({ where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) return { error: "هذا الرابط مستخدم لقسم آخر.", fieldErrors: { slug: "مستخدم" } };

  const row = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image: data.image || null,
    sortOrder: data.sortOrder,
    active: data.active,
  };
  if (id) {
    const before = await db.category.findUnique({ where: { id }, select: { name: true } });
    await db.category.update({ where: { id }, data: row });
    // Category name is part of product search text
    if (before && before.name !== row.name) {
      const products = await db.product.findMany({
        where: { categoryId: id },
        select: { id: true, name: true, shortDescription: true, brand: true, sku: true, netContent: true },
      });
      for (const p of products) {
        await db.product.update({
          where: { id: p.id },
          data: { searchText: buildProductSearchText([p.name, p.shortDescription, p.brand, p.sku, row.name, p.netContent]) },
        });
      }
    }
  } else {
    await db.category.create({ data: row });
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  return { ok: true, message: id ? "تم حفظ القسم" : "تم إنشاء القسم" };
}

export async function deleteCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) return { error: `لا يمكن حذف قسم يحتوي على ${count} منتج. انقل المنتجات أو أخفِ القسم بدلاً من ذلك.` };
  await db.category.delete({ where: { id } }).catch(() => null);
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  return { ok: true, message: "تم حذف القسم" };
}
