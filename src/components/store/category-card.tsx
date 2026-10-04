import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/primitives";
import { QuickAddButton } from "./quick-add-button";
import type { ProductCardData } from "@/server/catalog";
import { t } from "@/i18n";

export type CategoryWithProducts = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
  products?: ProductCardData[];
};

// Curated highlights and thematic info for each category and its Nutriplus product
const CATEGORY_THEMES: Record<
  string,
  {
    heroTag: string;
    gradientClass: string;
    accentGlow: string;
    badgeTone: "sun" | "lavender" | "plum" | "neutral";
    iconSvg: React.ReactNode;
    features: string[];
  }
> = {
  "weight-loss": {
    heroTag: "نتروبلس ميلك شيك (بديل الوجبة)",
    gradientClass: "from-[#20102b] via-[#2d143d] to-[#1a0a24]",
    accentGlow: "bg-sun-400/20",
    badgeTone: "sun",
    iconSvg: (
      <svg viewBox="0 0 160 160" className="size-full" fill="none" aria-hidden="true">
        <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className="opacity-30" />
        <path d="M55 45 C70 45 75 60 70 85 C65 110 95 115 105 115" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-70" />
        <path d="M105 45 C90 45 85 60 90 85 C95 110 65 115 55 115" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-70" />
        <circle cx="80" cy="80" r="18" fill="currentColor" className="opacity-20" />
        <path d="M75 75 L85 85 M85 75 L75 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-80" />
        <circle cx="112" cy="52" r="4" fill="currentColor" className="opacity-60" />
        <circle cx="48" cy="108" r="3" fill="currentColor" className="opacity-40" />
      </svg>
    ),
    features: ["سعرات محسوبة بدون زيادة وزن", "20g بروتين بالكمية اليومية", "27 فيتامين ومعدن أساسي", "خالٍ من الغلوتين ونباتي"],
  },
  supplements: {
    heroTag: "جلاتين خل التفاح الناسف للشحوم",
    gradientClass: "from-[#0f241d] via-[#163328] to-[#0c1c17]",
    accentGlow: "bg-emerald-400/20",
    badgeTone: "lavender",
    iconSvg: (
      <svg viewBox="0 0 160 160" className="size-full" fill="none" aria-hidden="true">
        <path
          d="M80 30 C50 60 45 95 65 115 C85 135 120 130 130 100 C140 70 110 30 80 30 Z"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-60"
        />
        <path d="M80 30 C80 65 75 105 65 115" stroke="currentColor" strokeWidth="1.5" className="opacity-40" />
        <path d="M78 60 C90 65 102 60 110 50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-40" />
        <path d="M75 85 C90 90 105 85 115 75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-40" />
        <circle cx="42" cy="65" r="5" fill="currentColor" className="opacity-40" />
        <circle cx="120" cy="120" r="3" fill="currentColor" className="opacity-30" />
      </svg>
    ),
    features: ["طبيعي 100% ناسف للشحوم", "خل تفاح ورمان وشوندر", "محلى طبيعياً بالاستيفيا", "يعدل السكر التراكمي ويمنع النفخة"],
  },
  tonics: {
    heroTag: "شوتات كولاجين سائلة 5500 مع Q10",
    gradientClass: "from-[#291038] via-[#351547] to-[#1e0a29]",
    accentGlow: "bg-purple-400/20",
    badgeTone: "plum",
    iconSvg: (
      <svg viewBox="0 0 160 160" className="size-full" fill="none" aria-hidden="true">
        <path
          d="M80 35 C80 35 115 75 115 102 C115 122 99 138 80 138 C61 138 45 122 45 102 C45 75 80 35 80 35 Z"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-70"
        />
        <path d="M80 60 L74 88 L90 88 L70 120 L76 96 L62 96 Z" fill="currentColor" className="opacity-50" />
        <circle cx="125" cy="55" r="3" fill="currentColor" className="opacity-60" />
        <circle cx="35" cy="85" r="4" fill="currentColor" className="opacity-40" />
      </svg>
    ),
    features: ["نسبة كولاجين 5500 مركزة", "للأعمار من 35 إلى 50 سنة", "جاهز للشرب وغير مؤذٍ للمعدة", "بايوتين سريع الامتصاص وإنزيم Q10"],
  },
  vitamins: {
    heroTag: "كبسول الكولاجين المتحلل مائياً",
    gradientClass: "from-[#2e1d0d] via-[#3b2511] to-[#24160a]",
    accentGlow: "bg-sun-400/20",
    badgeTone: "sun",
    iconSvg: (
      <svg viewBox="0 0 160 160" className="size-full" fill="none" aria-hidden="true">
        <rect x="52" y="52" width="56" height="56" rx="28" transform="rotate(-45 80 80)" stroke="currentColor" strokeWidth="2" className="opacity-70" />
        <line x1="60" y1="60" x2="100" y2="100" stroke="currentColor" strokeWidth="2" className="opacity-50" />
        <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" className="opacity-30" />
        <circle cx="128" cy="80" r="3" fill="currentColor" className="opacity-70" />
        <circle cx="32" cy="80" r="3" fill="currentColor" className="opacity-40" />
        <circle cx="80" cy="32" r="3" fill="currentColor" className="opacity-60" />
        <circle cx="80" cy="128" r="3" fill="currentColor" className="opacity-40" />
      </svg>
    ),
    features: ["كولاجين متحلل مائياً دقيق", "مناسب للأعمار 25-35 سنة", "فيتامين C النقي المضاد للأكسدة", "نضارة فائقة للبشرة والشعر"],
  },
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Modern Category Card with rich thematic SVG visual placeholder,
 * glowing ambient accents, featured product tag, and smooth hover micro-animations.
 */
export function CategoryCard({
  category,
  index,
}: {
  category: CategoryWithProducts;
  index: number;
}) {
  const theme = CATEGORY_THEMES[category.slug] ?? {
    heroTag: category.name,
    gradientClass: "from-plum-950 via-[#231230] to-plum-900",
    accentGlow: "bg-sun-400/20",
    badgeTone: "plum" as const,
    iconSvg: null,
    features: [],
  };

  const heroProduct = category.products?.[0];

  return (
    <Link
      href={`/category/${category.slug}`}
      className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:aspect-[5/6] sm:p-5 bg-gradient-to-br ${theme.gradientClass} text-paper`}
    >
      {/* Ambient background glow */}
      <span
        className={`pointer-events-none absolute -end-10 -top-10 size-44 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60 ${theme.accentGlow}`}
        aria-hidden="true"
      />

      {/* Thematic vector placeholder art */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-paper/30 transition-transform duration-500 group-hover:scale-110">
        <span className="size-44 sm:size-52">{theme.iconSvg}</span>
      </span>

      {/* Top bar: index number + product tag */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="rounded-full bg-paper/15 px-2.5 py-1 text-[0.7rem] font-bold text-paper tabular-nums backdrop-blur-sm">
          {pad2(index + 1)}
        </span>
        <span className="line-clamp-1 rounded-full bg-sun-300/90 px-2.5 py-0.5 text-[0.65rem] font-bold text-plum-950 shadow-xs backdrop-blur-xs">
          {heroProduct ? heroProduct.name.split(" ")[0] + " " + (heroProduct.name.split(" ")[1] ?? "") : "متوفر"}
        </span>
      </div>

      {/* Subtle bottom shadow overlay to guarantee text readability */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" aria-hidden="true" />

      {/* Bottom info: Title, hero product note, and button */}
      <div className="relative z-10">
        <p className="line-clamp-1 text-[0.75rem] font-medium text-sun-300 sm:text-xs">
          {theme.heroTag}
        </p>
        <h3 className="mt-1 text-lg font-bold text-paper sm:text-xl group-hover:text-sun-200 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 hidden text-xs leading-5 text-paper/75 line-clamp-2 sm:block">
            {category.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-paper/15 pt-2.5">
          <span className="text-[0.7rem] font-medium text-paper/80">
            {t.shop.count(category._count.products)}
          </span>
          <span className="grid size-7 place-items-center rounded-full bg-sun-300 text-plum-950 transition-transform duration-200 group-hover:-translate-x-1 sm:size-8">
            <ChevronLeftIcon size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Rich Spotlight Showcase: Highlights each category and its Nutriplus product
 * with clear key benefits, real price, and a direct "Add to Cart" button.
 */
export function CategoryShowcaseSection({
  categories,
  lowStockThreshold = 5,
}: {
  categories: CategoryWithProducts[];
  lowStockThreshold?: number;
}) {
  return (
    <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
      {categories.map((c) => {
        const product = c.products?.[0];
        const theme = CATEGORY_THEMES[c.slug];
        if (!product) return null;

        return (
          <div
            key={c.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-paper p-5 transition-all duration-300 hover:border-plum-300 hover:shadow-lift sm:p-6"
          >
            {/* Top row: Category tag & stock info */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-plum-950 hover:bg-lavender-200 transition-colors"
                >
                  <span>{c.name}</span>
                  <ChevronLeftIcon size={12} />
                </Link>
                {product.bestSeller && <Badge tone="plum">الأكثر طلباً</Badge>}
                {product.isNew && !product.bestSeller && <Badge tone="lavender">جديد</Badge>}
              </div>

              {/* Product Title & Short description */}
              <h4 className="mt-4 text-base font-bold text-plum-950 sm:text-lg">
                <Link href={`/product/${product.slug}`} className="hover:underline">
                  {product.name}
                </Link>
              </h4>
              <p className="mt-2 text-xs leading-6 text-muted sm:text-sm">
                {product.shortDescription}
              </p>

              {/* Key Features Bullet List */}
              {theme?.features && theme.features.length > 0 && (
                <ul className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-lavender-50/70 p-3 text-xs text-plum-900 sm:grid-cols-2">
                  {theme.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-sun-600">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom: Price + Direct Quick Add Button */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div>
                <Price price={product.price} compareAtPrice={product.compareAtPrice} size="md" />
                <p className="text-[0.7rem] text-subtle">الدفع عند الاستلام داخل العراق</p>
              </div>
              <div className="w-full sm:w-auto sm:min-w-36">
                <QuickAddButton
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
        );
      })}
    </div>
  );
}
