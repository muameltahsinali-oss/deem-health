import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const intString = (label: string, { min = 0, max = 1_000_000_000, optional = false } = {}) =>
  z
    .string()
    .trim()
    .refine((v) => (optional && v === "") || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `${label}: أدخل رقماً صحيحاً`);

/**
 * Admin product form. All inputs are strings (as typed) so React Hook Form input/output types match;
 * the server converts with `toProductData`.
 */
export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "اسم المنتج مطلوب").max(120),
    slug: z.string().trim().min(2, "الرابط مطلوب").max(80).regex(SLUG_PATTERN, "استخدم أحرفاً وأرقاماً وشرطات فقط"),
    sku: z.string().trim().min(2, "رمز المنتج مطلوب").max(40).regex(/^[A-Za-z0-9._-]+$/, "أحرف لاتينية وأرقام وشرطات فقط"),
    categoryId: z.string().min(1, "اختر القسم"),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    price: intString("السعر", { min: 0, max: 100_000_000 }),
    compareAtPrice: intString("السعر قبل الخصم", { optional: true, max: 100_000_000 }),
    stock: intString("المخزون", { min: 0, max: 1_000_000 }),
    shortDescription: z.string().trim().min(10, "اكتب وصفاً مختصراً (10 أحرف على الأقل)").max(300),
    description: z.string().trim().min(20, "اكتب وصفاً كاملاً (20 حرفاً على الأقل)").max(5000),
    brand: z.string().trim().max(80),
    netContent: z.string().trim().max(80),
    weightGrams: intString("الوزن", { optional: true, max: 100_000 }),
    benefits: z.string().max(3000),
    ingredients: z.string().trim().max(3000),
    usage: z.string().trim().max(3000),
    warnings: z.string().trim().max(3000),
    faq: z.array(z.object({ q: z.string().trim().max(200), a: z.string().trim().max(1000) })).max(12),
    featured: z.boolean(),
    bestSeller: z.boolean(),
    metaTitle: z.string().trim().max(70),
    metaDescription: z.string().trim().max(170),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .max(500)
            .regex(/^\/(images|api\/uploads)\/[A-Za-z0-9._/-]+$/, "رابط صورة غير صالح"),
          alt: z.string().trim().max(150),
        }),
      )
      .max(10, "10 صور كحد أقصى"),
  })
  .refine((v) => v.compareAtPrice === "" || Number(v.compareAtPrice) > Number(v.price), {
    message: "يجب أن يكون السعر قبل الخصم أعلى من السعر الحالي (أو اتركه فارغاً)",
    path: ["compareAtPrice"],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function toProductData(v: ProductFormValues) {
  const optionalText = (s: string) => (s.trim() ? s.trim() : null);
  return {
    name: v.name.trim(),
    slug: v.slug.trim(),
    sku: v.sku.trim().toUpperCase(),
    categoryId: v.categoryId,
    status: v.status,
    price: Number(v.price),
    compareAtPrice: v.compareAtPrice === "" ? null : Number(v.compareAtPrice),
    stock: Number(v.stock),
    shortDescription: v.shortDescription.trim(),
    description: v.description.trim(),
    brand: optionalText(v.brand),
    netContent: optionalText(v.netContent),
    weightGrams: v.weightGrams === "" ? null : Number(v.weightGrams),
    benefits: v.benefits
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean)
      .slice(0, 20),
    ingredients: optionalText(v.ingredients),
    usage: optionalText(v.usage),
    warnings: optionalText(v.warnings),
    faq: v.faq.filter((f) => f.q && f.a),
    featured: v.featured,
    bestSeller: v.bestSeller,
    metaTitle: optionalText(v.metaTitle),
    metaDescription: optionalText(v.metaDescription),
  };
}
