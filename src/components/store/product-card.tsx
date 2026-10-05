import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { Price, Rating } from "@/components/ui/price";
import { discountPercent } from "@/lib/format";
import type { ProductCardData } from "@/server/catalog";
import { t } from "@/i18n";
import { CardBuyActions } from "./quick-add-button";

export function ProductCard({
  product,
  priority = false,
  lowStockThreshold = 5,
}: {
  product: ProductCardData;
  priority?: boolean;
  lowStockThreshold?: number;
}) {
  const pct = discountPercent(product.price, product.compareAtPrice);
  const href = `/product/${product.slug}`;
  const soldOut = product.stock <= 0;
  const hasSecondary = Boolean(product.secondaryImage && product.secondaryImage !== product.image);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-lavender-50" tabIndex={-1} aria-hidden="true">
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className={`object-cover transition-all duration-500 group-hover:scale-[1.04] ${
                hasSecondary ? "group-hover:opacity-0" : ""
              } ${soldOut ? "opacity-60" : ""}`}
            />
            {hasSecondary && (
              <Image
                src={product.secondaryImage!}
                alt={`${product.name} - زاوية أخرى`}
                fill
                sizes="(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={`object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.04] ${
                  soldOut ? "opacity-30" : ""
                }`}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-lavender-400">
            <svg className="size-16 opacity-40 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
            <span className="mt-2 line-clamp-1 text-center text-xs font-medium text-subtle/80">{product.name}</span>
          </div>
        )}
        <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5 z-10">
          {pct !== null && !soldOut && <Badge tone="sun">خصم {pct}%</Badge>}
          {product.bestSeller && !soldOut && <Badge tone="plum">الأكثر طلباً 🔥</Badge>}
          {product.isNew && !product.bestSeller && !soldOut && <Badge tone="lavender">جديد</Badge>}
          {soldOut && <Badge tone="neutral">{t.product.outOfStock}</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[0.7rem] font-medium text-subtle">{product.categoryName}</p>
          <span className="text-[0.65rem] text-success font-medium">أصلي ومضمون</span>
        </div>

        <h3 className="text-sm leading-snug font-semibold text-plum-950 sm:text-[0.95rem]">
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-xs leading-5 text-muted">{product.shortDescription}</p>

        {product.ratingCount > 0 && <Rating value={product.ratingAvg} count={product.ratingCount} size={12} />}

        <div className="mt-auto space-y-2.5 pt-2 border-t border-line/50">
          <div className="flex items-end justify-between gap-2">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
            {!soldOut && product.stock <= lowStockThreshold && (
              <span className="text-[0.7rem] font-semibold text-danger animate-pulse">
                بقي {product.stock} فقط
              </span>
            )}
          </div>

          {/* Direct purchase & add to cart controls */}
          <div className="relative z-10">
            <CardBuyActions
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                stock: product.stock,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 ${className ?? ""}`}>{children}</div>
  );
}
