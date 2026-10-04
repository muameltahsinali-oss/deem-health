import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { db } from "@/server/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.product.findMany({
      where: { status: "ACTIVE", category: { active: true } },
      select: { slug: true, updatedAt: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
    }),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${base}${i.url}`)),
    })),
  ];
}
