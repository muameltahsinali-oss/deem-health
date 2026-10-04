import type { Product, ProductImage } from "@prisma/client";
import type { ProductFormValues } from "@/features/admin/product-schema";
import { parseProductFaq } from "@/server/catalog";

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  status: "DRAFT",
  price: "",
  compareAtPrice: "",
  stock: "0",
  shortDescription: "",
  description: "",
  brand: "",
  netContent: "",
  weightGrams: "",
  benefits: "",
  ingredients: "",
  usage: "",
  warnings:
    "مكمل غذائي وليس بديلاً عن نظام غذائي متوازن. لا تتجاوز الجرعة المذكورة. استشر الطبيب قبل الاستخدام في حال الحمل أو الرضاعة أو تناول أدوية. يحفظ بعيداً عن متناول الأطفال.",
  faq: [],
  featured: false,
  bestSeller: false,
  metaTitle: "",
  metaDescription: "",
  images: [],
};

export function productToFormValues(p: Product & { images: ProductImage[] }): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categoryId,
    status: p.status,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice === null ? "" : String(p.compareAtPrice),
    stock: String(p.stock),
    shortDescription: p.shortDescription,
    description: p.description,
    brand: p.brand ?? "",
    netContent: p.netContent ?? "",
    weightGrams: p.weightGrams === null ? "" : String(p.weightGrams),
    benefits: p.benefits.join("\n"),
    ingredients: p.ingredients ?? "",
    usage: p.usage ?? "",
    warnings: p.warnings ?? "",
    faq: parseProductFaq(p.faq),
    featured: p.featured,
    bestSeller: p.bestSeller,
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    images: p.images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
  };
}
