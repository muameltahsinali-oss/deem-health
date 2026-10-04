import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductListing, parseListingParams } from "@/components/store/product-listing";
import { getActiveCategories, listProducts, parseSort } from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";
import { t } from "@/i18n";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const hasQuery = Boolean(sp.q) || Boolean(sp.page) || Boolean(sp.sort) || Boolean(sp.stock) || Boolean(sp.sale);
  return {
    title: t.shop.title,
    description: "تسوّق الفيتامينات والمكملات الغذائية ومنتجات العناية بالوزن والمقويات من ديم هيلث — الدفع عند الاستلام في جميع محافظات العراق.",
    alternates: { canonical: "/shop" },
    // Filtered / search result pages are not indexed; the canonical /shop is.
    robots: hasQuery ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // Legacy/alternate ?category=slug → canonical category URL
  const categoryParam = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  if (categoryParam && /^[a-z0-9-]+$/.test(categoryParam)) {
    const rest = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (k !== "category" && typeof v === "string") rest.set(k, v);
    redirect(`/category/${categoryParam}${rest.size ? `?${rest}` : ""}`);
  }

  const params = parseListingParams(sp, parseSort);
  const [categories, settings, result] = await Promise.all([
    getActiveCategories(),
    getStoreSettings(),
    listProducts({ q: params.q, sort: params.sort, page: params.page, inStock: params.inStock, onSale: params.onSale }),
  ]);

  return (
    <ProductListing
      title={params.onSale ? t.nav.offers : t.shop.title}
      basePath="/shop"
      categories={categories}
      params={params}
      result={result}
      lowStockThreshold={settings.lowStockThreshold}
      breadcrumbs={[{ name: t.common.home, href: "/" }, { name: t.shop.title }]}
    />
  );
}
