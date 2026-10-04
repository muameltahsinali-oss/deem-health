/**
 * Product media mapping and multi-angle product photography configurations.
 * Contains high-resolution, photorealistic studio renders matching the real
 * Nutriplus / Deem Health products from multiple perspectives:
 * 1. Primary product hero shot
 * 2. In-use / open packaging / key ingredients shot
 * 3. Minimalist luxury pedestal / lifestyle environment shot
 */

export type ProductMediaEntry = {
  primary: string;
  secondary: string;
  all: Array<{ url: string; alt: string }>;
};

export const PRODUCT_MEDIA: Record<string, ProductMediaEntry> = {
  "apple-cider-vinegar-gummies": {
    primary: "/images/products/apple-cider-vinegar-gummies-1.jpg",
    secondary: "/images/products/apple-cider-vinegar-gummies-2.jpg",
    all: [
      { url: "/images/products/apple-cider-vinegar-gummies-1.jpg", alt: "جلاتين خل التفاح الناسف للشحوم - الواجهة الأمامية" },
      { url: "/images/products/apple-cider-vinegar-gummies-2.jpg", alt: "جلاتين خل التفاح - زاوية تفصيلية مع حبات الجلاتين والرخام" },
      { url: "/images/products/apple-cider-vinegar-gummies-3.jpg", alt: "جلاتين خل التفاح - مع شرائح التفاح الأخضر وحبوب الرمان" },
    ],
  },
  "nutriplus-meal-replacement-shake": {
    primary: "/images/products/nutriplus-meal-replacement-shake-1.png",
    secondary: "/images/products/nutriplus-meal-replacement-shake-2.jpg",
    all: [
      { url: "/images/products/nutriplus-meal-replacement-shake-1.png", alt: "نتروبلس ميلك شيك بديل الوجبة - عبوة الشيك مع الشيكر" },
      { url: "/images/products/nutriplus-meal-replacement-shake-2.jpg", alt: "نتروبلس ميلك شيك - زاوية الشيكر ومسحوق الشوكولاتة والمكيال" },
      { url: "/images/products/nutriplus-meal-replacement-shake-3.jpg", alt: "نتروبلس ميلك شيك - لقطة استوديو فاخرة مع حليب اللوز والشوكولاتة" },
    ],
  },
  "nutriplus-chamomile-extract": {
    primary: "/images/products/nutriplus-chamomile-extract-1.jpg",
    secondary: "/images/products/nutriplus-chamomile-extract-2.jpg",
    all: [
      { url: "/images/products/nutriplus-chamomile-extract-1.jpg", alt: "مستخلص البابونج نتروبلس سيرينيتي - الواجهة الأمامية" },
      { url: "/images/products/nutriplus-chamomile-extract-2.jpg", alt: "مستخلص البابونج - العبوة مفتوحة مع أظرف الشاي وكوب الأعشاب والليمون" },
      { url: "/images/products/nutriplus-chamomile-extract-3.jpg", alt: "مستخلص البابونج - لقطة علوية مسطحة مع زهور البابونج والليمون الطبيعي" },
    ],
  },
  "nutriplus-chicory-coffee-collagen": {
    primary: "/images/products/nutriplus-chicory-coffee-collagen-1.png",
    secondary: "/images/products/nutriplus-chicory-coffee-collagen-2.jpg",
    all: [
      { url: "/images/products/nutriplus-chicory-coffee-collagen-1.png", alt: "قهوة الهندباء بالكولاجين نتروبلس - الواجهة الأمامية للكيس" },
      { url: "/images/products/nutriplus-chicory-coffee-collagen-2.jpg", alt: "قهوة الهندباء بالكولاجين - مع فنجان قهوة كريمية وحبوب البن وجذور الهندباء" },
      { url: "/images/products/nutriplus-chicory-coffee-collagen-3.jpg", alt: "قهوة الهندباء بالكولاجين - لقطة ديكور فاخرة مع أزهار الهندباء الزرقاء" },
    ],
  },
  "nutriplus-hydrolyzed-collagen-capsules": {
    primary: "/images/products/nutriplus-hydrolyzed-collagen-capsules-1.png",
    secondary: "/images/products/nutriplus-hydrolyzed-collagen-capsules-2.jpg",
    all: [
      { url: "/images/products/nutriplus-hydrolyzed-collagen-capsules-1.png", alt: "كبسول الكولاجين المتحلل مائياً - العبوة الأمامية" },
      { url: "/images/products/nutriplus-hydrolyzed-collagen-capsules-2.jpg", alt: "كبسول الكولاجين - العبوة مفتوحة مع الكبسولات وبرتقال فيتامين سي الطازج" },
      { url: "/images/products/nutriplus-hydrolyzed-collagen-capsules-3.jpg", alt: "كبسول الكولاجين - لقطة جمالية مع تموجات الماء وبتلات الورد" },
    ],
  },
  "nutriplus-recharge": {
    primary: "/images/products/nutriplus-recharge-1.jpg",
    secondary: "/images/products/nutriplus-recharge-2.jpg",
    all: [
      { url: "/images/products/nutriplus-recharge-1.jpg", alt: "ريشارج مكمل الطاقة والنشاط نتروبلس - الواجهة الأمامية" },
      { url: "/images/products/nutriplus-recharge-2.jpg", alt: "ريشارج مكمل الطاقة - مع كأس عصير منعش مثلج وأظرف الطاقة" },
      { url: "/images/products/nutriplus-recharge-3.jpg", alt: "ريشارج مكمل الطاقة - تكوين هندسي فاخر مع شرائح البرتقال والخزامى" },
    ],
  },
  "nutriplus-liquid-collagen-shots": {
    primary: "/images/products/nutriplus-liquid-collagen-shots-1.jpg",
    secondary: "/images/products/nutriplus-liquid-collagen-shots-2.jpg",
    all: [
      { url: "/images/products/nutriplus-liquid-collagen-shots-1.jpg", alt: "نتروبلس كولاجين السائل شوتات 5500 - الواجهة الأمامية" },
      { url: "/images/products/nutriplus-liquid-collagen-shots-2.jpg", alt: "شوتات الكولاجين السائل - العبوة الفاخرة مفتوحة تضم 15 قنينة مع التوت والخزامى" },
      { url: "/images/products/nutriplus-liquid-collagen-shots-3.jpg", alt: "شوتات الكولاجين السائل - قنينة شوت مفردة على قاعدة حجرية مع التوت البري" },
    ],
  },
  "daily-multivitamin": {
    primary: "/images/products/daily-multivitamin-1.webp",
    secondary: "/images/products/daily-multivitamin-2.webp",
    all: [
      { url: "/images/products/daily-multivitamin-1.webp", alt: "فيتامينات متعددة يومية - الواجهة الأمامية" },
      { url: "/images/products/daily-multivitamin-2.webp", alt: "فيتامينات متعددة يومية - صورة إضافية" },
    ],
  },
  "magnesium-glycinate-400": {
    primary: "/images/products/magnesium-glycinate-400-1.webp",
    secondary: "/images/products/magnesium-glycinate-400-2.webp",
    all: [
      { url: "/images/products/magnesium-glycinate-400-1.webp", alt: "مغنيسيوم جلايسينات 400 ملغ" },
      { url: "/images/products/magnesium-glycinate-400-2.webp", alt: "مغنيسيوم جلايسينات 400 ملغ - صورة إضافية" },
    ],
  },
  "omega-3-fish-oil-1000": {
    primary: "/images/products/omega-3-fish-oil-1000-1.webp",
    secondary: "/images/products/omega-3-fish-oil-1000-2.webp",
    all: [
      { url: "/images/products/omega-3-fish-oil-1000-1.webp", alt: "أوميغا 3 زيت السمك 1000 ملغ" },
      { url: "/images/products/omega-3-fish-oil-1000-2.webp", alt: "أوميغا 3 زيت السمك 1000 ملغ - صورة إضافية" },
    ],
  },
  "iron-vitamin-syrup": {
    primary: "/images/products/iron-vitamin-syrup-1.webp",
    secondary: "/images/products/iron-vitamin-syrup-2.webp",
    all: [
      { url: "/images/products/iron-vitamin-syrup-1.webp", alt: "شراب الحديد والفيتامينات" },
      { url: "/images/products/iron-vitamin-syrup-2.webp", alt: "شراب الحديد والفيتامينات - صورة إضافية" },
    ],
  },
  "vitamin-c-1000": {
    primary: "/images/products/vitamin-c-1000-1.webp",
    secondary: "/images/products/vitamin-c-1000-2.webp",
    all: [
      { url: "/images/products/vitamin-c-1000-1.webp", alt: "فيتامين سي 1000 ملغ" },
      { url: "/images/products/vitamin-c-1000-2.webp", alt: "فيتامين سي 1000 ملغ - صورة إضافية" },
    ],
  },
  "vitamin-b12-1000": {
    primary: "/images/products/vitamin-b12-1000-1.webp",
    secondary: "/images/products/vitamin-b12-1000-2.webp",
    all: [
      { url: "/images/products/vitamin-b12-1000-1.webp", alt: "فيتامين ب12 1000 ميكروغرام" },
      { url: "/images/products/vitamin-b12-1000-2.webp", alt: "فيتامين ب12 1000 ميكروغرام - صورة إضافية" },
    ],
  },
  "marine-collagen-peptides": {
    primary: "/images/products/marine-collagen-peptides-1.webp",
    secondary: "/images/products/marine-collagen-peptides-2.webp",
    all: [
      { url: "/images/products/marine-collagen-peptides-1.webp", alt: "كولاجين بحري ببتيدات" },
      { url: "/images/products/marine-collagen-peptides-2.webp", alt: "كولاجين بحري ببتيدات - صورة إضافية" },
    ],
  },
  "zinc-50": {
    primary: "/images/products/zinc-50-1.webp",
    secondary: "/images/products/zinc-50-2.webp",
    all: [
      { url: "/images/products/zinc-50-1.webp", alt: "زنك 50 ملغ" },
      { url: "/images/products/zinc-50-2.webp", alt: "زنك 50 ملغ - صورة إضافية" },
    ],
  },
  "honey-ginseng-tonic": {
    primary: "/images/products/honey-ginseng-tonic-1.webp",
    secondary: "/images/products/honey-ginseng-tonic-2.webp",
    all: [
      { url: "/images/products/honey-ginseng-tonic-1.webp", alt: "مقوٍّ عام بالعسل والجنسنغ" },
      { url: "/images/products/honey-ginseng-tonic-2.webp", alt: "مقوٍّ عام بالعسل والجنسنغ - صورة إضافية" },
    ],
  },
  "vitamin-d3-5000": {
    primary: "/images/products/vitamin-d3-5000-1.webp",
    secondary: "/images/products/vitamin-d3-5000-2.webp",
    all: [
      { url: "/images/products/vitamin-d3-5000-1.webp", alt: "فيتامين د3 5000 وحدة دولية" },
      { url: "/images/products/vitamin-d3-5000-2.webp", alt: "فيتامين د3 5000 وحدة دولية - صورة إضافية" },
    ],
  },
  "green-tea-extract": {
    primary: "/images/products/green-tea-extract-1.webp",
    secondary: "/images/products/green-tea-extract-2.webp",
    all: [
      { url: "/images/products/green-tea-extract-1.webp", alt: "مستخلص الشاي الأخضر" },
      { url: "/images/products/green-tea-extract-2.webp", alt: "مستخلص الشاي الأخضر - صورة إضافية" },
    ],
  },
  "l-carnitine-liquid-3000": {
    primary: "/images/products/l-carnitine-liquid-3000-1.webp",
    secondary: "/images/products/l-carnitine-liquid-3000-2.webp",
    all: [
      { url: "/images/products/l-carnitine-liquid-3000-1.webp", alt: "إل-كارنيتين سائل 3000" },
      { url: "/images/products/l-carnitine-liquid-3000-2.webp", alt: "إل-كارنيتين سائل 3000 - صورة إضافية" },
    ],
  },
};

/**
 * Returns complete gallery images for a given product slug, ensuring all
 * generated high-resolution angles are available even if the database only has a single URL.
 */
export function resolveProductGalleryImages(
  slug: string,
  existingImages: Array<{ id: string; url: string; alt: string | null }>,
  productName: string,
): Array<{ id: string; url: string; alt: string | null }> {
  const media = PRODUCT_MEDIA[slug];
  const seenUrls = new Set<string>();
  const result: Array<{ id: string; url: string; alt: string | null }> = [];

  // 1. If curated multi-angle photography exists for this product, add all angles first
  if (media?.all?.length) {
    for (let i = 0; i < media.all.length; i++) {
      const item = media.all[i];
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        result.push({
          id: `${slug}-angle-${i + 1}`,
          url: item.url,
          alt: item.alt || productName,
        });
      }
    }
  }

  // 2. Add valid database images (filtering out broken /api/uploads/ in serverless)
  for (const img of existingImages) {
    if (img.url && !img.url.startsWith("/api/uploads/") && !seenUrls.has(img.url)) {
      seenUrls.add(img.url);
      result.push(img);
    }
  }

  return result.length > 0 ? result : existingImages;
}

/**
 * Resolves primary and secondary images for product cards and quick previews.
 * Prefers curated studio photography and filters out broken upload links.
 */
export function resolveProductCardImages(
  slug: string,
  dbImages: Array<{ url: string; alt: string | null }>,
): { image: string | null; secondaryImage: string | null } {
  const media = PRODUCT_MEDIA[slug];
  // 1. If curated studio photography exists, always prioritize it
  if (media?.primary) {
    return {
      image: media.primary,
      secondaryImage: media.secondary || null,
    };
  }

  // 2. Otherwise use valid database images (excluding non-existent /api/uploads/ in serverless)
  const validImages = dbImages.filter((img) => img.url && !img.url.startsWith("/api/uploads/"));
  const primary = validImages[0]?.url || dbImages[0]?.url || null;
  const secondary = validImages[1]?.url || dbImages[1]?.url || null;
  return { image: primary, secondaryImage: secondary };
}
