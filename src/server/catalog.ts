import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { normalizeSearchText } from "@/lib/search";
import { resolveProductCardImages, resolveProductGalleryImages } from "@/config/product-media";

export const PAGE_SIZE = 12;

export const SORT_OPTIONS = ["featured", "newest", "price_asc", "price_desc", "top_rated"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export function parseSort(value: string | undefined): SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value ?? "") ? (value as SortOption) : "featured";
}

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  ratingAvg: true,
  ratingCount: true,
  bestSeller: true,
  featured: true,
  createdAt: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 2, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  bestSeller: boolean;
  featured: boolean;
  isNew: boolean;
  categoryId: string;
  categoryName: string;
  image: string | null;
  secondaryImage: string | null;
  imageAlt: string;
};

const NEW_DAYS = 21;

function toCard(p: CardRow): ProductCardData {
  const { image, secondaryImage } = resolveProductCardImages(p.slug, p.images);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    bestSeller: p.bestSeller,
    featured: p.featured,
    isNew: Date.now() - p.createdAt.getTime() < NEW_DAYS * 86_400_000,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    image,
    secondaryImage,
    imageAlt: p.images[0]?.alt ?? p.name,
  };
}

function orderByFor(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "top_rated":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    default:
      return [{ featured: "desc" }, { bestSeller: "desc" }, { stock: "desc" }, { createdAt: "desc" }];
  }
}

export const getActiveCategories = cache(async () => {
  const rows = await db.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: [{ bestSeller: "desc" }, { featured: "desc" }, { createdAt: "desc" }],
        take: 2,
        select: cardSelect,
      },
    },
  });
  return rows.map((c) => ({
    ...c,
    products: c.products.map(toCard),
  }));
});

export const getCategoryBySlug = cache(async (slug: string) => {
  return db.category.findFirst({ where: { slug, active: true } });
});

export type ListProductsParams = {
  q?: string;
  categoryId?: string;
  sort?: SortOption;
  page?: number;
  inStock?: boolean;
  onSale?: boolean;
  pageSize?: number;
};

export async function listProducts(params: ListProductsParams) {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const where: Prisma.ProductWhereInput = { status: "ACTIVE", category: { active: true } };
  const q = params.q ? normalizeSearchText(params.q) : "";
  if (q) {
    where.AND = q
      .split(" ")
      .filter((w) => w.length > 0)
      .slice(0, 6)
      .map((word) => ({ searchText: { contains: word } }));
  }
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.inStock) where.stock = { gt: 0 };
  if (params.onSale) where.compareAtPrice = { gt: db.product.fields.price };

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
  const rows = await db.product.findMany({
    where,
    orderBy: orderByFor(params.sort ?? "featured"),
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: cardSelect,
  });
  return { items: rows.map(toCard), total, page, pageCount, pageSize };
}

export const getHomeData = cache(async () => {
  const active = { status: "ACTIVE" as const, category: { active: true } };
  const [bestSellers, featured, onSale, newest, allProducts, reviews, reviewStats] = await Promise.all([
    db.product.findMany({
      where: active,
      orderBy: [{ bestSeller: "desc" }, { featured: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: cardSelect,
    }),
    db.product.findMany({ where: { ...active, featured: true }, orderBy: { createdAt: "desc" }, take: 4, select: cardSelect }),
    db.product.findMany({
      where: { ...active, stock: { gt: 0 }, compareAtPrice: { gt: db.product.fields.price } },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: cardSelect,
    }),
    db.product.findMany({ where: active, orderBy: { createdAt: "desc" }, take: 4, select: cardSelect }),
    db.product.findMany({ where: active, orderBy: [{ bestSeller: "desc" }, { createdAt: "desc" }], select: cardSelect }),
    db.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 }, product: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: {
          select: { name: true, slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
        },
      },
    }),
    db.review.aggregate({
      where: { status: "APPROVED", product: { status: "ACTIVE" } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  return {
    bestSellers: bestSellers.map(toCard),
    featured: featured.map(toCard),
    onSale: onSale.map(toCard),
    newest: newest.map(toCard),
    allProducts: allProducts.map(toCard),
    reviews: reviews.map(({ product: { images, ...product }, ...r }) => ({
      ...r,
      product: { ...product, image: images[0]?.url ?? null },
    })),
    /** Store-wide approved reviews — shown as the social-proof summary on the homepage. */
    reviewSummary: { average: reviewStats._avg.rating ?? 0, count: reviewStats._count._all },
  };
});

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true, slug: true, active: true } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, authorName: true, rating: true, comment: true, createdAt: true },
      },
    },
  });
  if (!product || !product.category.active) return null;
  const enrichedImages = resolveProductGalleryImages(product.slug, product.images, product.name);
  return { ...product, images: enrichedImages };
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(productId: string, categoryId: string, take = 4) {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", categoryId, id: { not: productId } },
    orderBy: [{ bestSeller: "desc" }, { stock: "desc" }, { createdAt: "desc" }],
    take,
    select: cardSelect,
  });
  if (rows.length >= take) return rows.map(toCard);
  const extra = await db.product.findMany({
    where: { status: "ACTIVE", categoryId: { not: categoryId }, id: { not: productId }, bestSeller: true },
    take: take - rows.length,
    select: cardSelect,
  });
  return [...rows, ...extra].map(toCard);
}

export function parseProductFaq(value: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is { q: string; a: string } => Boolean(x && typeof x.q === "string" && typeof x.a === "string"))
    .slice(0, 12);
}
