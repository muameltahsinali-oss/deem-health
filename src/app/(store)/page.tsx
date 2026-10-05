import Image from "next/image";
import Link from "next/link";
import { CashIcon, ChevronLeftIcon, ShieldIcon, StarIcon, TruckIcon, WhatsappIcon } from "@/components/icons";
import { Rating } from "@/components/ui/price";
import { DirectSalesCatalog } from "@/components/store/direct-sales-catalog";
import { CategoryCard } from "@/components/store/category-card";
import { WhatsappCta } from "@/components/store/whatsapp-cta";
import { getActiveCategories, getHomeData } from "@/server/catalog";
import { getStoreSettings, whatsappLink } from "@/server/settings";
import { formatIQD } from "@/lib/format";
import { CardBuyActions } from "@/components/store/quick-add-button";

export const revalidate = 120;

export default async function HomePage() {
  const [home, categories, settings] = await Promise.all([
    getHomeData(),
    getActiveCategories(),
    getStoreSettings(),
  ]);

  const wa = whatsappLink(settings.whatsapp, "مرحباً ديم هيلث، أود الاستفسار والطلب");
  const { allProducts, reviews, reviewSummary } = home;

  // Key spotlights for high-converting sales heroes
  const acvProduct = allProducts.find((p) => p.slug === "apple-cider-vinegar-gummies") || allProducts[0];
  const shakeProduct = allProducts.find((p) => p.slug === "nutriplus-meal-replacement-shake") || allProducts[1];

  const trustGuarantees = [
    {
      icon: <CashIcon size={24} className="text-plum-950" />,
      title: "معاينة الطلب عند الاستلام",
      desc: "افحص طلبك وتأكد من سلامة المنتج قبل الاستلام بكل طمأنينة.",
    },
    {
      icon: <TruckIcon size={24} className="text-plum-950" />,
      title: "توصيل سريع لكافة العراق",
      desc: "شحن لباب بيتك في بغداد وجميع المحافظات خلال 24 إلى 48 ساعة.",
    },
    {
      icon: <ShieldIcon size={24} className="text-plum-950" />,
      title: "منتجات أصلية ومضمونة 100%",
      desc: "منتجات نتروبلس وفارمسي المعتمدة بختم الجودة والباركود الأصلي.",
    },
    {
      icon: <span className="text-xl">🎁</span>,
      title: "شحن مجاني للطلبات",
      desc: "توصيل مجاني تلقائياً عند طلبك بقيمة 75,000 د.ع أو أكثر.",
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14 pb-12">
      {/* ───────── Top Sales Announcement Bar ───────── */}
      <section className="bg-plum-950 text-paper py-3 sm:py-3.5 border-b border-paper/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-2 rounded-full bg-sun-400 animate-ping" />
            <span>🔥 عروض حصرية لفترة محدودة | توصيل سريع لكافة محافظات العراق</span>
          </div>
          <div className="flex items-center gap-4 text-paper/80">
            <span className="hidden md:inline">🚚 شحن سريع لباب البيت</span>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sun-300 hover:text-sun-200 font-semibold">
                <WhatsappIcon size={14} />
                للطلب السريع عبر واتساب
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Direct Promotional Sales Spotlight (Hero Replacement) ───────── */}
      <section className="container-page">
        <div className="rounded-3xl bg-linear-to-b from-lavender-100 via-lavender-50 to-paper p-5 sm:p-8 lg:p-10 border border-lavender-200 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-300 px-3.5 py-1 text-xs font-bold text-plum-950 mb-3">
              ⚡ مكملات وفيتامينات أصلية 100%
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-[2.6rem] font-bold text-plum-950 tracking-tight leading-tight">
              متجر Deem Health للمكملات الأصلية
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              وجهتك الموثوقة لأفضل المكملات الغذائية والفيتامينات الطبيعية الأصلية مع توصيل سريع لباب بيتك في جميع المحافظات.
            </p>
          </div>

          {/* Dual Flash Deal Cards for instant direct conversion */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Spotlight 1: ACV Gummies */}
            {acvProduct && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-sun-300 bg-paper p-4 sm:p-6 shadow-md transition-all hover:shadow-lg flex flex-col sm:flex-row gap-5 items-center">
                <div className="absolute top-3 start-3 z-10">
                  <span className="rounded-full bg-sun-300 px-3 py-1 text-xs font-bold text-plum-950 shadow-xs">
                    وفر 17% · الأكثر طلباً
                  </span>
                </div>
                <div className="relative size-44 sm:size-48 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
                  <Image
                    src={acvProduct.image || "/images/products/apple-cider-vinegar-gummies-1.jpg"}
                    alt={acvProduct.name}
                    fill
                    priority
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2.5 text-start w-full">
                  <span className="text-xs font-medium text-subtle">{acvProduct.categoryName}</span>
                  <h3 className="text-base sm:text-lg font-bold text-plum-950 leading-snug">
                    <Link href={`/product/${acvProduct.slug}`} className="hover:underline">
                      {acvProduct.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted line-clamp-2">{acvProduct.shortDescription}</p>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-bold text-plum-950 tabular-nums">{formatIQD(acvProduct.price)}</span>
                    {acvProduct.compareAtPrice && (
                      <span className="text-xs text-subtle line-through tabular-nums">{formatIQD(acvProduct.compareAtPrice)}</span>
                    )}
                  </div>
                  <div className="pt-2">
                    <CardBuyActions
                      product={{
                        productId: acvProduct.id,
                        slug: acvProduct.slug,
                        name: acvProduct.name,
                        image: acvProduct.image,
                        price: acvProduct.price,
                        compareAtPrice: acvProduct.compareAtPrice,
                        categoryId: acvProduct.categoryId,
                        categoryName: acvProduct.categoryName,
                        stock: acvProduct.stock,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spotlight 2: Shake */}
            {shakeProduct && (
              <div className="relative overflow-hidden rounded-2xl border border-line bg-paper p-4 sm:p-6 shadow-sm transition-all hover:shadow-lg flex flex-col sm:flex-row gap-5 items-center">
                <div className="absolute top-3 start-3 z-10">
                  <span className="rounded-full bg-plum-950 px-3 py-1 text-xs font-bold text-paper shadow-xs">
                    وجبة متكاملة · 20g بروتين
                  </span>
                </div>
                <div className="relative size-44 sm:size-48 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
                  <Image
                    src={shakeProduct.image || "/images/products/nutriplus-meal-replacement-shake-1.png"}
                    alt={shakeProduct.name}
                    fill
                    priority
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2.5 text-start w-full">
                  <span className="text-xs font-medium text-subtle">{shakeProduct.categoryName}</span>
                  <h3 className="text-base sm:text-lg font-bold text-plum-950 leading-snug">
                    <Link href={`/product/${shakeProduct.slug}`} className="hover:underline">
                      {shakeProduct.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted line-clamp-2">{shakeProduct.shortDescription}</p>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-bold text-plum-950 tabular-nums">{formatIQD(shakeProduct.price)}</span>
                    {shakeProduct.compareAtPrice && (
                      <span className="text-xs text-subtle line-through tabular-nums">{formatIQD(shakeProduct.compareAtPrice)}</span>
                    )}
                  </div>
                  <div className="pt-2">
                    <CardBuyActions
                      product={{
                        productId: shakeProduct.id,
                        slug: shakeProduct.slug,
                        name: shakeProduct.name,
                        image: shakeProduct.image,
                        price: shakeProduct.price,
                        compareAtPrice: shakeProduct.compareAtPrice,
                        categoryId: shakeProduct.categoryId,
                        categoryName: shakeProduct.categoryName,
                        stock: shakeProduct.stock,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Conversion Guarantees ───────── */}
      <section className="container-page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {trustGuarantees.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start gap-3 rounded-2xl border border-line bg-paper p-4 sm:p-5 shadow-2xs">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun-300">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-plum-950">{item.title}</h4>
                <p className="mt-1 text-[0.75rem] sm:text-xs leading-5 text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Full Sales Product Catalog With Instant Category Filters ───────── */}
      <section id="products" className="container-page scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-sun-400" />
              <p className="text-xs font-bold text-plum-700 uppercase tracking-wider">المتجر الفوري</p>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-plum-950 mt-1">
              جميع المنتجات المتوفرة للطلب الفوري
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            انقر على أي منتج لمعاينة زواياه المتعددة واطلبه بكل سهولة.
          </p>
        </div>

        <DirectSalesCatalog
          products={allProducts}
          categories={categories}
          lowStockThreshold={settings.lowStockThreshold}
        />
      </section>

      {/* ───────── Shop by Category Quick Grid ───────── */}
      <section className="container-page">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-plum-950">تصفح حسب القسم</h3>
            <p className="text-xs sm:text-sm text-muted">مجموعات مصنفة حسب احتياجك الصحي واليومي</p>
          </div>
          <Link href="/shop" className="text-xs sm:text-sm font-semibold text-plum-950 hover:underline flex items-center gap-1">
            عرض كل الأقسام
            <ChevronLeftIcon size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((c, i) => (
            <CategoryCard key={c.id} category={c} index={i} />
          ))}
        </div>
      </section>

      {/* ───────── Customer Social Proof (Direct Buyer Reviews) ───────── */}
      {reviews.length > 0 && (
        <section className="container-page">
          <div className="rounded-3xl border border-line bg-lavender-50/60 p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-plum-700 uppercase tracking-wider">تجارب حقيقية</span>
                <h3 className="text-xl sm:text-2xl font-bold text-plum-950 mt-1">ماذا يقول زبائننا في العراق؟</h3>
              </div>
              {reviewSummary.count > 0 && (
                <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-2 border border-line shadow-xs">
                  <span className="text-2xl font-bold text-plum-950 tabular-nums">{reviewSummary.average.toFixed(1)}</span>
                  <div>
                    <Rating value={reviewSummary.average} showCount={false} size={14} />
                    <span className="block text-[0.7rem] text-subtle font-medium">تقييم ممتاز ({reviewSummary.count} تقييم حقيقي)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="flex flex-col rounded-2xl border border-line bg-paper p-5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-plum-950">{r.authorName}</span>
                    <div className="flex text-sun-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} size={13} filled={i < r.rating} className={i < r.rating ? undefined : "text-line"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-xs sm:text-sm leading-6 text-ink">«{r.comment}»</p>
                  <Link
                    href={`/product/${r.product.slug}`}
                    className="mt-4 flex items-center gap-2.5 rounded-xl bg-lavender-50 p-2 pe-3 transition-colors hover:bg-lavender-100"
                  >
                    {r.product.image && (
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-paper">
                        <Image src={r.product.image} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-plum-950">{r.product.name}</span>
                    <ChevronLeftIcon size={14} className="shrink-0 text-subtle" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Fast Order WhatsApp Callout ───────── */}
      {wa && (
        <section className="container-page">
          <div className="rounded-3xl bg-linear-to-r from-plum-950 to-plum-900 text-paper p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-center sm:text-start">
              <span className="inline-block rounded-full bg-sun-300 px-3 py-1 text-xs font-bold text-plum-950">
                طلب مباشر وسريع
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">تفضل الطلب أو الاستفسار مباشرة عبر واتساب؟</h3>
              <p className="text-xs sm:text-sm text-paper/80 max-w-lg">
                فريق خدمة العملاء جاهز لمساعدتك في اختيار المنتج المناسب وتثبيت طلبك خلال دقائق.
              </p>
            </div>
            <div className="shrink-0">
              <WhatsappCta href={wa} label="تواصل واطلب عبر واتساب" source="home_bottom" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
