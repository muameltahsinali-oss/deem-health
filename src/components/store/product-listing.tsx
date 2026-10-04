import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/primitives";
import { ProductCard, ProductGrid } from "@/components/store/product-card";
import { MobileFilters, SortSelect, TrackSearch } from "@/components/store/listing-controls";
import { cn } from "@/lib/cn";
import type { listProducts, SortOption } from "@/server/catalog";
import { t } from "@/i18n";

export type ListingParams = {
  q?: string;
  sort: SortOption;
  page: number;
  inStock: boolean;
  onSale: boolean;
};

type Props = {
  title: string;
  description?: string | null;
  basePath: string;
  categories: Array<{ name: string; slug: string }>;
  activeCategorySlug?: string;
  params: ListingParams;
  result: Awaited<ReturnType<typeof listProducts>>;
  lowStockThreshold: number;
  breadcrumbs: Array<{ name: string; href?: string }>;
};

function buildHref(basePath: string, params: Partial<ListingParams> & { category?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.sort && params.sort !== "featured") sp.set("sort", params.sort);
  if (params.inStock) sp.set("stock", "1");
  if (params.onSale) sp.set("sale", "1");
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function FiltersPanel({
  basePath,
  categories,
  activeCategorySlug,
  params,
  idPrefix,
}: Pick<Props, "basePath" | "categories" | "activeCategorySlug" | "params"> & { idPrefix: string }) {
  const onShop = basePath === "/shop";
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-plum-950">{t.shop.category}</h3>
        <ul className="space-y-1">
          <li>
            <Link
              href={buildHref("/shop", { ...params, page: 1 })}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm",
                onShop && !activeCategorySlug ? "bg-lavender-100 font-medium text-plum-950" : "text-muted hover:bg-lavender-50",
              )}
            >
              {t.shop.allCategories}
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={buildHref(`/category/${c.slug}`, { ...params, q: params.q, page: 1 })}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm",
                  activeCategorySlug === c.slug ? "bg-lavender-100 font-medium text-plum-950" : "text-muted hover:bg-lavender-50",
                )}
                aria-current={activeCategorySlug === c.slug ? "page" : undefined}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <form action={basePath} method="get" className="space-y-4">
        {params.q && <input type="hidden" name="q" value={params.q} />}
        {params.sort !== "featured" && <input type="hidden" name="sort" value={params.sort} />}
        <Checkbox id={`${idPrefix}-stock`} name="stock" value="1" defaultChecked={params.inStock} label={t.shop.inStockOnly} />
        <Checkbox id={`${idPrefix}-sale`} name="sale" value="1" defaultChecked={params.onSale} label={t.shop.onSaleOnly} />
        <div className="flex gap-2 pt-2">
          <button type="submit" className="h-10 flex-1 rounded-full bg-plum-950 text-sm font-medium text-paper hover:bg-plum-800">
            {t.shop.apply}
          </button>
          {(params.inStock || params.onSale) && (
            <Link href={buildHref(basePath, { q: params.q, sort: params.sort })} className="grid h-10 place-items-center rounded-full px-4 text-sm text-muted hover:bg-lavender-50">
              {t.shop.clear}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

export function ProductListing(props: Props) {
  const { title, description, basePath, params, result, breadcrumbs } = props;
  const activeFilters = (params.inStock ? 1 : 0) + (params.onSale ? 1 : 0) + (props.activeCategorySlug ? 1 : 0);
  const hidden = { q: params.q, stock: params.inStock ? "1" : undefined, sale: params.onSale ? "1" : undefined };

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="مسار التنقل" className="mb-4 text-xs text-subtle">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((b, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {b.href ? (
                <Link href={b.href} className="hover:text-plum-950">
                  {b.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-plum-950">
                  {b.name}
                </span>
              )}
              {i < breadcrumbs.length - 1 && <ChevronLeftIcon size={12} />}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-plum-950 sm:text-3xl">
            {params.q ? t.shop.resultsFor(params.q) : title}
          </h1>
          {description && !params.q && <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</p>}
          <p className="mt-2 text-sm text-subtle" aria-live="polite">
            {t.shop.count(result.total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MobileFilters activeCount={activeFilters}>
            <FiltersPanel {...props} idPrefix="m" />
          </MobileFilters>
          <SortSelect value={params.sort} hidden={hidden} action={basePath} />
        </div>
      </header>

      {params.q && <TrackSearch query={params.q} resultCount={result.total} />}

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <aside aria-label={t.shop.filters} className="hidden lg:block">
          <div className="sticky top-28">
            <FiltersPanel {...props} idPrefix="d" />
          </div>
        </aside>

        <div>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={24} />}
              title={t.shop.empty}
              description={t.shop.emptyText}
              action={
                <ButtonLink href="/shop" variant="primary">
                  {t.shop.clear}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <ProductGrid className="lg:grid-cols-3 xl:grid-cols-3">
                {result.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 2} lowStockThreshold={props.lowStockThreshold} />
                ))}
              </ProductGrid>

              {result.pageCount > 1 && (
                <nav aria-label="الصفحات" className="mt-10 flex items-center justify-center gap-2">
                  {result.page > 1 ? (
                    <Link
                      href={buildHref(basePath, { ...params, page: result.page - 1 })}
                      className="inline-flex h-10 items-center gap-1 rounded-full border border-line-strong px-4 text-sm hover:border-plum-950"
                      rel="prev"
                    >
                      <ChevronRightIcon size={16} />
                      {t.shop.prev}
                    </Link>
                  ) : null}
                  <span className="px-3 text-sm text-muted">{t.shop.page(result.page, result.pageCount)}</span>
                  {result.page < result.pageCount ? (
                    <Link
                      href={buildHref(basePath, { ...params, page: result.page + 1 })}
                      className="inline-flex h-10 items-center gap-1 rounded-full border border-line-strong px-4 text-sm hover:border-plum-950"
                      rel="next"
                    >
                      {t.shop.next}
                      <ChevronLeftIcon size={16} />
                    </Link>
                  ) : null}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Parses the shared listing query string. */
export function parseListingParams(sp: Record<string, string | string[] | undefined>, parseSort: (v?: string) => SortOption): ListingParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Number.parseInt(one(sp.page) ?? "1", 10);
  const q = one(sp.q)?.trim().slice(0, 80) || undefined;
  return {
    q,
    sort: parseSort(one(sp.sort)),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    inStock: one(sp.stock) === "1",
    onSale: one(sp.sale) === "1",
  };
}
