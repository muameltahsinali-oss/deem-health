/**
 * ════════════════════════════════════════════════════════════════════════
 *  CATALOG — mostly DEMO placeholder data for development, plus the first
 *  real Nutriplus products (`real: true`).
 *  Demo product copy is deliberately generic and makes NO medical/health claims.
 *  Real product copy uses ONLY the supplier/owner-provided information — do not add
 *  benefits, doses, usage or warnings that were not provided. Their price and stock are
 *  PLACEHOLDERS (see PLACEHOLDER_PRICE) until set from the admin.
 *  Images live in /public/images/products/<slug>-1.webp (generated placeholders).
 * ════════════════════════════════════════════════════════════════════════
 */

export type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

export type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  brand: string;
  /** null = unknown (hidden on the product page until filled in from the admin) */
  netContent: string | null;
  weightGrams: number | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  featured?: boolean;
  bestSeller?: boolean;
  shortDescription: string;
  description: string;
  benefits: string[];
  ingredients: string | null;
  usage: string | null;
  /** Defaults to STANDARD_WARNING; null = no warnings tab (not provided by the supplier yet) */
  warnings?: string | null;
  /**
   * Real catalog product (not demo). Seeded without fake demo reviews/ratings.
   * Its price and stock are PLACEHOLDERS until they are set from the admin.
   */
  real?: boolean;
  /** days ago the product was "created" (for newest sorting) */
  ageDays: number;
};

export const DEMO_BRAND = "علامة تجريبية";
export const NUTRIPLUS_BRAND = "نتروبلس (Nutriplus)";

/**
 * TEMPORARY price for real products whose price has not been provided yet.
 * NOT a real price — replace it from Admin → Products before launch.
 */
export const PLACEHOLDER_PRICE = 25000;
/** TEMPORARY stock so the products can be ordered in development — set real stock from the admin. */
export const PLACEHOLDER_STOCK = 20;

export const STANDARD_WARNING =
  "مكمل غذائي وليس بديلاً عن نظام غذائي متوازن ونمط حياة صحي. لا تتجاوز الجرعة المذكورة على العبوة. استشر الطبيب أو الصيدلاني قبل الاستخدام في حال الحمل أو الرضاعة أو وجود حالة صحية أو تناول أدوية. يحفظ بعيداً عن متناول الأطفال في مكان بارد وجاف.";

export const STANDARD_FAQ = [
  {
    q: "هل يمكنني الدفع عند الاستلام؟",
    a: "نعم، جميع الطلبات تُدفع نقداً عند الاستلام، ولا حاجة لأي بطاقة مصرفية.",
  },
  {
    q: "هل هذا المنتج مناسب لي؟",
    a: "تختلف الاحتياجات من شخص لآخر. ننصح باستشارة الطبيب أو الصيدلاني قبل البدء بأي مكمل غذائي.",
  },
  {
    q: "كيف أحفظ المنتج؟",
    a: "يُحفظ في مكان بارد وجاف بعيداً عن أشعة الشمس المباشرة، مع إحكام غلق العبوة بعد الاستخدام.",
  },
];

export const categories: SeedCategory[] = [
  { slug: "vitamins", name: "فيتامينات", description: "فيتامينات يومية بتركيزات وأشكال مختلفة.", sortOrder: 1 },
  { slug: "supplements", name: "مكملات غذائية", description: "معادن وأحماض دهنية ومكملات متنوعة.", sortOrder: 2 },
  { slug: "weight-loss", name: "العناية بالوزن", description: "منتجات تكمّل نظامك الغذائي وروتينك الرياضي.", sortOrder: 3 },
  { slug: "tonics", name: "مقويات", description: "شرابات ومقويات عامة للاستخدام اليومي.", sortOrder: 4 },
];

export const products: SeedProduct[] = [
  // ───────── 1. العناية بالوزن ─────────
  {
    slug: "nutriplus-meal-replacement-shake",
    sku: "NP-SHAKE",
    name: "نتروبلس ميلك شيك بديل الوجبة",
    categorySlug: "weight-loss",
    brand: NUTRIPLUS_BRAND,
    netContent: "مسحوق ميلك شيك بديل الوجبة",
    weightGrams: 500,
    price: 25000,
    compareAtPrice: null,
    stock: 50,
    featured: true,
    bestSeller: true,
    real: true,
    shortDescription: "سعرات يومية يحتاجها الجسم بدون زيادة بالوزن، مع 20 غرام بروتين و27 فيتامين ومعدن أساسي وخالٍ من الغلوتين.",
    description:
      "نتروبلس ميلك شيك بديل الوجبة يمنحك السعرات اليومية التي يحتاجها الجسم بدون أي زيادة في الوزن.\n\nيحتوي على 27 فيتامين ومعدن أساسي لدعم طاقة وصحة الجسم، مع 20 غرام بروتين نقي بالكمية اليومية المحددة. يتميز بأنه خالٍ من الغلوتين ويناسب حتى الأشخاص النباتيين.",
    benefits: [
      "سعرات يومية يحتاجها الجسم بدون زيادة بالوزن",
      "يحتوي على 27 فيتامين ومعدن أساسي",
      "قيمة البروتين بالكمية اليومية المحددة 20g",
      "خالٍ من الغلوتين ويناسب حتى النباتيين",
      "بديل وجبة عملي وصحي متكامل",
    ],
    ingredients: "مزيج بروتين نباتي عالي القيمة، 27 فيتامين ومعدن أساسي، ألياف غذائية، نكهات طبيعية، خالٍ من الغلوتين.",
    usage: "يُخلط مكيال من المسحوق مع الماء أو الحليب كبديل لوجبة واحدة يومياً.",
    warnings: null,
    ageDays: 2,
  },

  // ───────── 2. مكملات غذائية ─────────
  {
    slug: "apple-cider-vinegar-gummies",
    sku: "NP-ACV-GUMMIES",
    name: "جلاتين خل التفاح الناسف للشحوم",
    categorySlug: "supplements",
    brand: NUTRIPLUS_BRAND,
    netContent: "60 قطعة جلاتين نباتي",
    weightGrams: 180,
    price: 25000,
    compareAtPrice: 30000,
    stock: 60,
    featured: true,
    bestSeller: true,
    real: true,
    shortDescription: "منتج طبيعي ناسف للشحوم بخل التفاح وبودرة التفاح الأخضر والرمان والشوندر، محلى بالاستيفيا ويعدل السكر التراكمي.",
    description:
      "جلاتين خل التفاح الناسف للشحوم هو منتج طبيعي 100% يتكون من خل التفاح وبودرة التفاح الأخضر وبودرة الرمان وبودرة الشوندر ومحلى بالاستيفيا الطبيعية.\n\nالجلاتين المستخدم نباتي بالكامل كون منتجات فارمسي مناسبة للنباتيين.\n\nيساعد على تعديل السكر التراكمي، يحسن عمل الجهاز الهضمي، ويقضي على النفخة تماماً. يحتوي على مجموعة فيتامينات حيوية من ضمنها فيتامين B12 والفوليك أسيد.",
    benefits: [
      "الناسف للشحوم ومنتج طبيعي 100%",
      "يتكون من خل التفاح وبودرة التفاح الأخضر وبودرة الرمان وبودرة الشوندر ومحلى بالاستيفيا",
      "الجلاتين المستخدم نباتي كون منتجات فارمسي مناسبة للنباتيين",
      "يعدل السكر التراكمي ويحسن عمل الجهاز الهضمي ويقضي على النفخة",
      "يحتوي على مجموعة فيتامينات من ضمنها B12 والفوليك أسيد",
    ],
    ingredients: "خل التفاح الطبيعي، بودرة التفاح الأخضر، بودرة الرمان، بودرة الشوندر، محلى الاستيفيا، بكتين جلاتين نباتي، فيتامين B12، حمض الفوليك.",
    usage: "قطعتان يومياً للمضغ.",
    warnings: null,
    ageDays: 1,
  },

  // ───────── 3. مقويات ─────────
  {
    slug: "nutriplus-liquid-collagen-shots",
    sku: "NP-COLLAGEN-LIQUID",
    name: "نتروبلس كولاجين السائل - شوتات الكولاجين",
    categorySlug: "tonics",
    brand: NUTRIPLUS_BRAND,
    netContent: "شوتات سائلة جاهزة للشرب",
    weightGrams: 300,
    price: 25000,
    compareAtPrice: null,
    stock: 40,
    featured: true,
    bestSeller: false,
    real: true,
    shortDescription: "شوتات كولاجين سائلة بنسبة 5500 مع البايوتين وفيتامينات B وإنزيم Q10، جاهز للشرب وغير مؤذٍ للمعدة، للأعمار 35-50 سنة.",
    description:
      "نتروبلس كولاجين السائل (شوتات الكولاجين) بنسبة كولاجين 5500 المركزة، يناسب الفئة العمرية من 35 إلى 50 سنة.\n\nجاهز للشرب مباشرة وغير مؤذٍ للمعدة، مخصص لنضارة البشرة والأظافر والشعر.\n\nأهم المكونات المضافة مع الكولاجين: البايوتين المتوفر فيه سريع الامتصاص أكثر من الكبسول، مدمج مع عدة عناصر من ضمنها مجموعة الـ B لتحقيق أقصى استفادة للشعر، ويحتوي على Q10 إنزيم الأنوثة والجمال.",
    benefits: [
      "نسبة الكولاجين 5500 المركزة",
      "يناسب الفئة العمرية 35-50 سنة",
      "جاهز للشرب وغير مؤذٍ للمعدة",
      "لنضارة البشرة والأظافر والشعر",
      "بايوتين سريع الامتصاص مدمج مع مجموعة فيتامينات B لأقصى استفادة للشعر",
      "يحتوي على Q10 إنزيم الأنوثة والجمال",
    ],
    ingredients: "كولاجين متحلل سائل (5500)، بايوتين سريع الامتصاص، فيتامينات B المركبة، إنزيم Q10، نكهة طبيعية.",
    usage: "شوت واحد يومياً للشرب مباشرة.",
    warnings: null,
    ageDays: 3,
  },

  // ───────── 4. فيتامينات ─────────
  {
    slug: "nutriplus-hydrolyzed-collagen-capsules",
    sku: "NP-COLLAGEN-CAPS",
    name: "كبسول الكولاجين المتحلل مائياً",
    categorySlug: "vitamins",
    brand: NUTRIPLUS_BRAND,
    netContent: "كبسولات ببتيدات الكولاجين",
    weightGrams: 90,
    price: 25000,
    compareAtPrice: null,
    stock: 45,
    featured: true,
    bestSeller: false,
    real: true,
    shortDescription: "كولاجين متحلل مائياً مقسم إلى ببتيدات صغيرة سريعة الامتصاص مع فيتامين C النقي المضاد للأكسدة، للأعمار 25-35 سنة.",
    description:
      "كبسول الكولاجين المتحلل مائياً مناسب للأعمار من 25 إلى 35 سنة لنضارة البشرة والشعر والأظافر.\n\nيكون مقسماً إلى ببتيدات صغيرة الجزيئات ليكون سهل وسريع الامتصاص في الجسم.\n\nيحتوي على فيتامين C النقي المضاد للأكسدة والذي يساعد على امتصاص الكولاجين بأعلى فاعلية.",
    benefits: [
      "كولاجين متحلل مائياً مقسم إلى ببتيدات صغيرة الجزيئات سهلة وسريعة الامتصاص",
      "مناسب للأعمار من 25-35 سنة لنضارة البشرة والشعر والأظافر",
      "يحتوي على فيتامين C النقي المضاد للأكسدة",
      "يساعد على امتصاص الكولاجين بأقصى فاعلية",
      "كبسولات خفيفة وسهلة البلع",
    ],
    ingredients: "ببتيدات كولاجين متحلل مائياً، فيتامين C نقي مضاد للأكسدة، غلاف كبسولة جيلاتيني نباتي.",
    usage: "كبسولتان يومياً مع الماء.",
    warnings: null,
    ageDays: 4,
  },

  // ───────── 5. مستخلص البابونج ─────────
  {
    slug: "nutriplus-chamomile-extract",
    sku: "NP-CHAMOMILE",
    name: "مستخلص البابونج",
    categorySlug: "supplements",
    brand: NUTRIPLUS_BRAND,
    netContent: "مشروب شاي الأعشاب سريع التحضير",
    weightGrams: 100,
    price: 25000,
    compareAtPrice: null,
    stock: 50,
    featured: true,
    bestSeller: false,
    real: true,
    shortDescription: "شاي بمستخلص البابونج والمليسة والشاي الأخضر ونكهة الليمون الطبيعية، لتهدئة الأعصاب وتحسين جودة النوم ودعم الهضم، خالي من السكر المضاف.",
    description:
      "مشروب شاي الأعشاب من سلسلة نتروبلس (Nutriplus) يجمع بين مستخلص البابونج، مستخلص المليسة، ومستخلص الشاي الأخضر بنكهة الليمون الطبيعية المنعشة.\n\nيساهم مستخلص البابونج في تخفيف التوتر والدعم في تحسين جودة النوم، بينما تساهم المليسة في تهدئة الأعصاب وتخفيف القلق وتحسين المزاج. كما يوفر مستخلص الشاي الأخضر مضادات أكسدة قوية ويحد من الإجهاد اليومي ويساعد على التنحيف.\n\nيتميز بأنه خالي من السكر المضاف أو الصبغات الاصطناعية (حسب معايير سلسلة Nutriplus)، ويعد خياراً مثالياً كبديل للمشروبات المنبهة أو المحلاة.",
    benefits: [
      "الاسترخاء وتهدئة الأعصاب: يقلل من حدة التوتر والإجهاد النفسي والبدني بعد يوم عمل طويل",
      "تحسين جودة النوم: يساعد على تهيئة الجسم والعقل للنوم العميق والمريح عند تناوله مساءً",
      "دعم الجهاز الهضمي: بفضل خواص البابونج والمليسة، يساعد على تخفيف الانتفاخ والمغص والتقلصات الهضمية الخفيفة",
      "مشروب منعش وخفيف: يحتوي على نكهة الليمون الطبيعية مما يجعله خياراً ممتازاً كبديل للمشروبات المنبهة أو المحلاة",
      "مستخلص الشاي الأخضر للحد من الإجهاد اليومي وتوفير مضادات أكسدة ويساعد على التنحيف",
      "خالٍ من السكر المضاف أو الصبغات الاصطناعية (حسب معايير سلسلة Nutriplus)",
    ],
    ingredients: "مستخلص البابونج، مستخلص المليسة، مستخلص الشاي الأخضر، نكهة الليمون الطبيعية. خالي من السكر المضاف أو الصبغات الاصطناعية.",
    usage: "يُفرغ كيس أو مكيال في كوب من الماء الساخن ويُحرّك جيداً، ويُفضل تناوله مساءً قبل النوم أو بعد يوم عمل طويل.",
    warnings: null,
    ageDays: 5,
  },

  // ───────── 6. قهوة الهندباء بالكولاجين ─────────
  {
    slug: "nutriplus-chicory-coffee-collagen",
    sku: "NP-CHICORY-COLLAGEN",
    name: "قهوة الهندباء بالكولاجين",
    categorySlug: "weight-loss",
    brand: NUTRIPLUS_BRAND,
    netContent: "قهوة عشبة الهندباء سريعة التحضير",
    weightGrams: 100,
    price: 25000,
    compareAtPrice: null,
    stock: 50,
    featured: true,
    bestSeller: false,
    real: true,
    shortDescription: "قهوة صحية بعشبة الهندباء مضاف إليها 15% كولاجين ومدعمة بـ B12، تساعد على التنحيف ونضارة البشرة وتعزيز الهضم وطرد الكولسترول الضار.",
    description:
      "قهوة الهندباء بالكولاجين من نتروبلس (Nutriplus) هي البديل الصحي والذكي للقهوة التقليدية، تجمع بين فوائد عشبة الهندباء النقية ونسبة 15% كولاجين للحفاظ على رونق ونضارة البشرة عند نزول الوزن.\n\nتساعد بفاعلية على التنحيف وطرد الكولسترول الضار من الجسم ودعم صحة الكبد. كما أنها معززة للجهاز الهضمي دون أي أعراض جانبية مزعجة مثل الإسهال، ومدعمة بفيتامين B12 الحيوي لدعم طاقة ونشاط الجسم.",
    benefits: [
      "مضاف إليها 15% كولاجين للحفاظ على رونق ونضارة البشرة عند نزول الوزن",
      "تساعد بفاعلية على التنحيف",
      "معززة للجهاز الهضمي بدون الأعراض المزعجة مثل الإسهال",
      "تساعد على طرد الكولسترول الضار",
      "مدعمة بفيتامين B12 لدعم طاقة الجسم والأعصاب",
      "تدعم صحة ووظائف الكبد",
    ],
    ingredients: "عشبة الهندباء النقية، كولاجين متحلل (15%)، فيتامين B12.",
    usage: "تُذاب ملعقة صغيرة في فنجان من الماء الساخن أو الحليب، وتُحرّك جيداً. يمكن تناولها 1-2 مرة يومياً.",
    warnings: null,
    ageDays: 6,
  },

  // ───────── 7. ريشارج ─────────
  {
    slug: "nutriplus-recharge",
    sku: "NP-RECHARGE",
    name: "ريشارج",
    categorySlug: "tonics",
    brand: NUTRIPLUS_BRAND,
    netContent: "مكمل غذائي للطاقة والنشاط",
    weightGrams: 150,
    price: 25000,
    compareAtPrice: null,
    stock: 45,
    featured: true,
    bestSeller: false,
    real: true,
    shortDescription: "مكمل الطاقة والنشاط من نتروبلس بالغوارانا والتاورين وفيتامين C والبايوتين ومجموعة B، يقلل الشهية ويحوّل الدهون العنيدة إلى طاقة.",
    description:
      "ريشارج (Recharge) من مجموعة مكملات نتروبلس المتطورة مخصص لدعم طاقة ونشاط الجسم على مدار اليوم.\n\nيعمل بفاعلية على تقليل الشهية والمساعدة في تحويل الدهون العنيدة إلى طاقة حيوية بفضل تركيبته الغنية التي تحتوي على عشبة الغوارانا المنشطة، فيتامين C، البايوتين، الفوليك أسيد ومجموعة فيتامينات B، بالإضافة إلى إنزيم التاورين لدعم الأداء البدني والذهني.",
    benefits: [
      "طاقة ونشاط للجسم طوال اليوم",
      "يقلل من الشهية ويساعد على ضبط الوزن",
      "يحول الدهون العنيدة إلى طاقة حيوية",
      "يحتوي على عشبة الغوارانا الطبيعية المنشطة",
      "مدعم بفيتامين C والبايوتين لصحة ونضارة البشرة والشعر",
      "يحتوي على الفوليك أسيد ومجموعة فيتامينات B لدعم وظائف الجسم الحيوية",
      "معزز بإنزيم التاورين لتحسين القدرة والتحمل",
    ],
    ingredients: "مستخلص عشبة الغوارانا، إنزيم التاورين، فيتامين C، بايوتين، فوليك أسيد (حمض الفوليك)، مجموعة فيتامينات B.",
    usage: "تُؤخذ الجرعة المحددة يومياً صباحاً أو قبل النشاط البدني مع كأس من الماء.",
    warnings: null,
    ageDays: 7,
  },
];

export const demoCoupons = [
  { code: "WELCOME10", type: "PERCENTAGE" as const, value: 10, minOrderAmount: 20000, usageLimit: 500, description: "خصم 10% للطلب الأول — تجريبي" },
  { code: "DEEM5000", type: "FIXED" as const, value: 5000, minOrderAmount: 40000, usageLimit: null, description: "خصم 5,000 د.ع للطلبات فوق 40,000 — تجريبي" },
  { code: "EXPIRED20", type: "PERCENTAGE" as const, value: 20, minOrderAmount: 0, usageLimit: null, description: "كود منتهي الصلاحية للاختبار", expired: true },
];

export const demoCustomers = [
  { name: "زينب علي", phone: "07701234567", governorate: "BGD", district: "الكرادة", address: "محلة 901، زقاق 12، دار 5، قرب جامع الكرادة" },
  { name: "محمد حسين", phone: "07811234567", governorate: "BSR", district: "العشار", address: "شارع الكويت، قرب مجمع البصرة التجاري" },
  { name: "سارة أحمد", phone: "07501234567", governorate: "ERB", district: "عينكاوة", address: "شارع 100، بناية 7، شقة 3" },
  { name: "علي كريم", phone: "07721234567", governorate: "NJF", district: "حي الأمير", address: "قرب ساحة ثورة العشرين، دار 44" },
  { name: "نور الهدى جاسم", phone: "07901234567", governorate: "BGD", district: "المنصور", address: "شارع 14 رمضان، قرب مطعم الساعة" },
  { name: "حسن عباس", phone: "07731234567", governorate: "KRB", district: "حي العباس", address: "زقاق 3، دار 18" },
  { name: "مريم فاضل", phone: "07821234567", governorate: "BBL", district: "الحلة", address: "حي الجامعة، قرب الجامعة، دار 9" },
  { name: "أحمد سعد", phone: "07511234567", governorate: "NIN", district: "الموصل - الجانب الأيسر", address: "حي الزهور، شارع 20، دار 15" },
];

export const demoReviewAuthors = ["زينب", "أم علي", "حسن", "سارة", "مصطفى", "نور", "رسل", "كرار", "هبة", "علي"];
export const demoReviewComments = [
  "التوصيل كان سريعاً والتغليف ممتاز.",
  "المنتج مطابق للوصف والتاريخ حديث.",
  "تعامل راقٍ، اتصلوا بي لتأكيد الطلب قبل الإرسال.",
  "ثاني مرة أطلب منهم، الأسعار مناسبة.",
  "العبوة كبيرة وتكفي مدة طويلة.",
  "الطعم مقبول وسهل الاستخدام.",
  "وصل الطلب خلال يومين إلى المحافظة.",
];
