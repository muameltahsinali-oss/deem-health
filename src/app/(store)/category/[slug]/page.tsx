import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, parseListingParams } from "@/components/store/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { getActiveCategories, getCategoryBySlug, listProducts, parseSort } from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";
import { breadcrumbJsonLd } from "@/lib/seo";
import { t } from "@/i18n";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(decodeURIComponent(slug));
  if (!category) return { title: t.errors.notFoundTitle, robots: { index: false } };
  const filtered = Boolean(sp.q || sp.page || sp.sort || sp.stock || sp.sale);
  return {
    title: category.name,
    description: category.description ?? `تسوّق ${category.name} من ديم هيلث — الدفع عند الاستلام في جميع محافظات العراق.`,
    alternates: { canonical: `/category/${category.slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      title: category.name,
      url: `/category/${category.slug}`,
      images: category.image ? [{ url: category.image }] : undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(decodeURIComponent(slug));
  if (!category) notFound();

  const listing = parseListingParams(await searchParams, parseSort);
  const [categories, settings, result] = await Promise.all([
    getActiveCategories(),
    getStoreSettings(),
    listProducts({
      q: listing.q,
      categoryId: category.id,
      sort: listing.sort,
      page: listing.page,
      inStock: listing.inStock,
      onSale: listing.onSale,
    }),
  ]);

  return (
    <>
      <ProductListing
        title={category.name}
        description={category.description}
        basePath={`/category/${category.slug}`}
        categories={categories}
        activeCategorySlug={category.slug}
        params={listing}
        result={result}
        lowStockThreshold={settings.lowStockThreshold}
        breadcrumbs={[{ name: t.common.home, href: "/" }, { name: t.shop.title, href: "/shop" }, { name: category.name }]}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.shop.title, path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />
    </>
  );
}
