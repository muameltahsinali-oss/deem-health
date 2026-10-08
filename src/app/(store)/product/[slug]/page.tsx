import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CashIcon, CheckIcon, ChevronLeftIcon, LeafIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { isAnimalFree } from "@/config/product-claims";
import { Badge } from "@/components/ui/primitives";
import { Price, Rating } from "@/components/ui/price";
import { Tabs } from "@/components/ui/tabs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ReviewForm } from "@/components/store/review-form";
import { ProductCard, ProductGrid } from "@/components/store/product-card";
import { FaqList, SectionHeading } from "@/components/store/faq-list";
import { getProductBySlug, getRelatedProducts, parseProductFaq } from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { discountPercent, formatNumber } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { t } from "@/i18n";

export const revalidate = 120;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) return { title: t.product.notFound, robots: { index: false } };
  const title = product.metaTitle || product.name;
  const description = product.metaDescription || product.shortDescription;
  const image = product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${product.slug}`,
      images: image ? [{ url: image, width: 1000, height: 1000, alt: product.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

function Paragraphs({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="prose-dh text-[0.95rem]">
      {text.split(/\n{2,}|\r\n\r\n/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product.id, product.categoryId), getStoreSettings()]);
  const pct = discountPercent(product.price, product.compareAtPrice);
  const faq = parseProductFaq(product.faq);
  const images = product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }));

  const details: Array<[string, string | null]> = [
    [t.product.sku, product.sku],
    [t.product.brand, product.brand],
    [t.product.netContent, product.netContent],
    [t.product.weight, product.weightGrams ? `${formatNumber(product.weightGrams)} غ` : null],
    [t.product.category, product.category.name],
  ];

  const tabs = [
    {
      id: "description",
      label: t.product.summary,
      content: (
        <div className="space-y-6">
          <Paragraphs text={product.description} />
          {product.benefits.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-plum-950">{t.product.benefits}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 rounded-lg bg-lavender-50 px-3.5 py-2.5 text-sm text-plum-950">
                    <CheckIcon size={16} className="mt-1 shrink-0 text-lavender-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
    ...(product.ingredients ? [{ id: "ingredients", label: t.product.ingredients, content: <Paragraphs text={product.ingredients} /> }] : []),
    ...(product.usage ? [{ id: "usage", label: t.product.usage, content: <Paragraphs text={product.usage} /> }] : []),
    ...(product.warnings
      ? [
          {
            id: "warnings",
            label: t.product.warnings,
            content: (
              <div className="rounded-xl border border-sun-200 bg-sun-50 p-4">
                <Paragraphs text={product.warnings} />
              </div>
            ),
          },
        ]
      : []),
    {
      id: "details",
      label: t.product.details,
      content: (
        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper text-sm">
          {details
            .filter((d): d is [string, string] => Boolean(d[1]))
            .map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3">
                <dt className="text-subtle">{k}</dt>
                <dd className="font-medium text-plum-950">{v}</dd>
              </div>
            ))}
        </dl>
      ),
    },
  ];

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page pt-5 sm:pt-8">
        <nav aria-label="مسار التنقل" className="mb-5 text-xs text-subtle">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-plum-950">
                {t.common.home}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeftIcon size={12} />
            </li>
            <li>
              <Link href={`/category/${product.category.slug}`} className="hover:text-plum-950">
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeftIcon size={12} />
            </li>
            <li aria-current="page" className="line-clamp-1 text-plum-950">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={images} name={product.name} />

          <div className="lg:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/category/${product.category.slug}`} className="eyebrow hover:underline">
                {product.category.name}
              </Link>
              {product.bestSeller && <Badge tone="plum">{t.product.bestSeller}</Badge>}
              {pct !== null && <Badge tone="sun">{t.product.save(pct)}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl leading-snug font-bold tracking-tight text-plum-950 sm:text-3xl">{product.name}</h1>
            {product.netContent && <p className="mt-2 text-sm text-muted">{product.netContent}</p>}

            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-plum-950">
              {product.ratingCount > 0 ? (
                <Rating value={product.ratingAvg} count={product.ratingCount} />
              ) : (
                <span>{t.product.reviewsCount(0)}</span>
              )}
            </a>

            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-5" />

            <p className="mt-5 text-[0.95rem] leading-8 text-muted">{product.shortDescription}</p>

            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-success">
                <CheckIcon size={14} className="shrink-0" /> {t.product.halal}
              </li>
              {isAnimalFree(product.slug) && (
                <li className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-success">
                  <LeafIcon size={14} className="shrink-0" /> {t.product.animalFree}
                </li>
              )}
            </ul>

            <div className="mt-6 border-t border-line pt-6">
              <ProductPurchase
                product={{
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.images[0]?.url ?? null,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  categoryId: product.categoryId,
                  categoryName: product.category.name,
                  stock: product.stock,
                  sku: product.sku,
                }}
                maxQuantity={settings.maxQuantityPerItem}
                lowStockThreshold={settings.lowStockThreshold}
              />
            </div>

            <ul className="mt-6 grid gap-2 rounded-xl bg-lavender-50 p-4 text-sm text-plum-900 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <CashIcon size={18} className="shrink-0" /> {t.trust.codTitle}
              </li>
              <li className="flex items-center gap-2">
                <TruckIcon size={18} className="shrink-0" /> {t.trust.deliveryTitle}
              </li>
              <li className="flex items-center gap-2">
                <ShieldIcon size={18} className="shrink-0" /> {t.trust.originalTitle}
              </li>
            </ul>
            <p className="mt-4 text-xs leading-6 text-subtle">{t.product.disclaimer}</p>
          </div>
        </div>

        <section className="mt-12 lg:mt-16" aria-label={t.product.details}>
          <Tabs items={tabs} />
        </section>

        <section id="reviews" aria-labelledby="reviews-title" className="mt-10 scroll-mt-28 lg:mt-14">
          <SectionHeading id="reviews-title" title={t.product.reviews} />
          <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
            <div className="rounded-xl bg-lavender-50 p-6 text-center lg:self-start">
              <p className="text-4xl font-bold text-plum-950 tabular-nums">{product.ratingCount > 0 ? product.ratingAvg.toFixed(1) : "—"}</p>
              <Rating value={product.ratingAvg} showCount={false} size={18} className="mt-2 justify-center" />
              <p className="mt-2 text-sm text-muted">{t.product.reviewsCount(product.ratingCount)}</p>
              <div className="mt-5">
                <ReviewForm productId={product.id} />
              </div>
            </div>
            {product.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-muted">{t.product.noReviews}</p>
            ) : (
              <ul className="space-y-4">
                {product.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line bg-paper p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-plum-950">{r.authorName}</span>
                      <time className="text-xs text-subtle" dateTime={r.createdAt.toISOString()}>
                        {formatDate(r.createdAt)}
                      </time>
                    </div>
                    <Rating value={r.rating} showCount={false} size={13} className="mt-1.5" />
                    <p className="mt-3 text-sm leading-7 text-muted">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {faq.length > 0 && (
          <section aria-labelledby="product-faq" className="mt-12 lg:mt-16">
            <SectionHeading id="product-faq" title={t.product.faq} />
            <FaqList items={faq} className="rounded-xl border border-line bg-paper px-5" />
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-12 lg:mt-16">
            <SectionHeading id="related" title={t.product.related} />
            <ProductGrid>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} lowStockThreshold={settings.lowStockThreshold} />
              ))}
            </ProductGrid>
          </section>
        )}
      </div>

      <JsonLd
        data={[
          productJsonLd({
            name: product.name,
            slug: product.slug,
            description: product.shortDescription,
            sku: product.sku,
            brand: product.brand,
            images: product.images.map((i) => i.url),
            price: product.price,
            stock: product.stock,
            ratingAvg: product.ratingAvg,
            ratingCount: product.ratingCount,
            categoryName: product.category.name,
          }),
          breadcrumbJsonLd([
            { name: t.common.home, path: "/" },
            { name: product.category.name, path: `/category/${product.category.slug}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
    </div>
  );
}
