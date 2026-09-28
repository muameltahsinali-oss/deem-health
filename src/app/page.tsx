"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  PhoneCall,
  CheckCircle,
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  Star,
  Search,
  Sparkles,
  Heart,
  ChevronDown,
  ArrowRight,
  Menu,
} from "lucide-react";

// Governorate delivery rates across Iraq
const GOVERNORATES = [
  { code: "BG", name: "بغداد", fee: 4000 },
  { code: "BS", name: "البصرة", fee: 5000 },
  { code: "ER", name: "أربيل", fee: 5000 },
  { code: "SU", name: "السليمانية", fee: 5000 },
  { code: "DH", name: "دهوك", fee: 5000 },
  { code: "NJ", name: "النجف الأشرف", fee: 5000 },
  { code: "KR", name: "كربلاء المقدسة", fee: 5000 },
  { code: "BB", name: "بابل (الحلة)", fee: 5000 },
  { code: "NN", name: "نينوى (الموصل)", fee: 5000 },
  { code: "KRK", name: "كركوك", fee: 5000 },
  { code: "DQ", name: "ذي قار (الناصرية)", fee: 5000 },
  { code: "MS", name: "ميسان (العمارة)", fee: 5000 },
  { code: "WS", name: "واسط (الكوت)", fee: 5000 },
  { code: "QD", name: "القادسية (الديوانية)", fee: 5000 },
  { code: "MT", name: "المثنى (السماوة)", fee: 5000 },
  { code: "AN", name: "الأنبار (الرمادي/الفلوجة)", fee: 5000 },
  { code: "DY", name: "ديالى (بعقوبة)", fee: 5000 },
  { code: "SD", name: "صلاح الدين (تكريت)", fee: 5000 },
];

// Product catalog
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  image: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "مستخلص البابونج النقي (Nutriplus Chamomile)",
    category: "صحة النوم والاسترخاء",
    price: 25000,
    originalPrice: 32000,
    image: "/images/lifestyle-kitchen.jpg",
    badge: "الأكثر طلباً",
    rating: 5,
    reviewsCount: 38,
    description: "مستخلص طبيعي مركز لتعزيز جودة النوم الهادئ، وتخفيف التوتر، ودعم الجهاز الهضمي.",
  },
  {
    id: "prod-2",
    name: "قهوة الهندباء مع الكولاجين البحري",
    category: "العناية بالبشرة والرشاقة",
    price: 28000,
    originalPrice: 35000,
    image: "/images/lifestyle-table.jpg",
    badge: "حصري",
    rating: 5,
    reviewsCount: 44,
    description: "مزيج غني بخلاصة الهندباء والكولاجين البحري الطبيعي لدعم نضارة البشرة وتعزيز الطاقة الحيوية.",
  },
  {
    id: "prod-3",
    name: "مكمل ريشارج اليومي (Recharge Vitality Formula)",
    category: "الطاقة والنشاط البدني",
    price: 29000,
    originalPrice: 38000,
    image: "/images/lifestyle-car.jpg",
    badge: "خصم 24%",
    rating: 5,
    reviewsCount: 29,
    description: "تركيبة متوازنة من الفيتامينات والمعادن الأساسية لإعادة شحن طاقتك ونشاطك اليومي بدون إرهاق.",
  },
  {
    id: "prod-4",
    name: "مجموعة الفيتامينات المتكاملة Multivitamin Pro",
    category: "المناعة والصحة العامة",
    price: 24000,
    originalPrice: 30000,
    image: "/images/lifestyle-kitchen.jpg",
    badge: "توفير",
    rating: 4.9,
    reviewsCount: 52,
    description: "تحتوي على الزنك وفيتامين C وفيتامين D3 لدعم جهاز المناعة ومقاومة التعب اليومي.",
  },
  {
    id: "prod-5",
    name: "أوميغا 3 النقي عالي التركيز (Omega-3 Ultra)",
    category: "صحة القلب والذاكرة",
    price: 26000,
    originalPrice: 34000,
    image: "/images/lifestyle-table.jpg",
    badge: "نقاء معتمد",
    rating: 5,
    reviewsCount: 31,
    description: "أحماض دهنية أوميغا 3 نقية خالية من الزئبق لدعم صحة القلب ونشاط الذاكرة والتركيز الذهني.",
  },
  {
    id: "prod-6",
    name: "مغنيسيوم جلايسينات المغلف (Magnesium Glycinate)",
    category: "استرخاء العضلات والمفاصل",
    price: 23000,
    originalPrice: 28000,
    image: "/images/lifestyle-car.jpg",
    badge: "سريع الامتصاص",
    rating: 4.8,
    reviewsCount: 19,
    description: "صيغة مغنيسيوم لطيفة على المعدة وسريعة الامتصاص لراحة العضلات وجودة النوم العميق.",
  },
];

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // Checkout form
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState(GOVERNORATES[0].code);
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedGov = GOVERNORATES.find((g) => g.code === governorate) || GOVERNORATES[0];
  const deliveryFee = subtotal > 60000 ? 0 : selectedGov.fee; // Free shipping over 60,000 IQD
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Coupon handler
  const handleApplyCoupon = () => {
    setCouponError("");
    const cleaned = couponInput.trim().toUpperCase();
    if (cleaned === "DEEM10" || cleaned === "WELCOME10") {
      const discount = Math.round(subtotal * 0.1);
      setCouponDiscount(discount);
      setAppliedCoupon(cleaned);
    } else if (cleaned === "DEEM5000") {
      setCouponDiscount(5000);
      setAppliedCoupon(cleaned);
    } else {
      setCouponError("رمز الكوبون غير صحيح أو منتهي الصلاحية");
    }
  };

  // Checkout submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      alert("يرجى ملء جميع الحقول الإلزامية (الاسم، الهاتف، العنوان)");
      return;
    }

    // Iraqi phone validation (starts with 07 and is 11 digits)
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^07\d{9}$/.test(cleanPhone)) {
      alert("يرجى إدخال رقم هاتف عراقي صحيح مكوّن من 11 رقماً يبدأ بـ 07");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone: cleanPhone,
          governorate: selectedGov.name,
          governorateCode: selectedGov.code,
          district,
          address,
          notes,
          subtotal,
          discountTotal: couponDiscount,
          shippingFee: deliveryFee,
          total,
          items: cart.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setOrderSuccess({ orderNumber: data.orderNumber });
        setCart([]);
      } else {
        alert(data.error || "حدث خطأ أثناء إتمام الطلب، يرجى المحاولة مرة أخرى.");
      }
    } catch {
      alert("تعذر الاتصال بالخادم، يرجى المحاولة بعد قليل أو التواصل عبر الواتساب.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered products
  const categories = ["الكل", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory;
    const matchesSearch =
      p.name.includes(searchQuery) ||
      p.description.includes(searchQuery) ||
      p.category.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#cbafd9] selection:text-[#200b2c]">
      {/* Top Banner Notice */}
      <div className="bg-[#200b2c] text-[#ffd068] text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-[#3b1b52]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Sparkles className="size-4 animate-pulse text-[#ffd068]" />
          <span>توصيل سريع لكافة محافظات العراق · الدفع عند الاستلام · شحن مجاني للطلبات فوق 60,000 د.ع</span>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ede5f2] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center">
              <Image
                src="/brand/deem-logo.svg"
                alt="ديم هيلث - Deem Health"
                width={170}
                height={55}
                priority
                className="h-11 w-auto object-contain"
              />
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#200b2c]">
            <a href="#products" className="hover:text-[#8545b3] transition-colors">
              المنتجات
            </a>
            <a href="#why-us" className="hover:text-[#8545b3] transition-colors">
              لماذا ديم هيلث؟
            </a>
            <a href="#faq" className="hover:text-[#8545b3] transition-colors">
              الأسئلة الشائعة
            </a>
            <a
              href="https://wa.me/9647700000000?text=مرحباً%20ديم%20هيلث،%20أود%20الاستفسار%20عن%20منتجاتكم"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <PhoneCall className="size-4" />
              <span>استشارة صيدلانية مجانية</span>
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-[#f1e9f7] hover:bg-[#e2d2ec] text-[#200b2c] transition-all cursor-pointer flex items-center justify-center"
              aria-label="سلة التسوق"
            >
              <ShoppingBag className="size-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#200b2c] text-[#ffd068] text-xs font-bold rounded-full size-5 flex items-center justify-center border-2 border-white shadow-xs">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#f1e9f7] text-[#200b2c]"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#ede5f2] bg-white px-4 py-4 space-y-3">
            <a
              href="#products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-[#200b2c]"
            >
              المنتجات
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-[#200b2c]"
            >
              لماذا ديم هيلث؟
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-[#200b2c]"
            >
              الأسئلة الشائعة
            </a>
            <a
              href="https://wa.me/9647700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium py-2 text-emerald-700"
            >
              <PhoneCall className="size-4" />
              <span>تواصل واتساب صيدلاني</span>
            </a>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f9f5fc] via-[#f1e9f7]/40 to-white py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-[#f1e9f7] border border-[#cbafd9]/50 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#51276f]">
                  <Sparkles className="size-4 text-[#ffd068] fill-[#ffd068]" />
                  <span>متجر الفيتامينات والمكملات الغذائية الأصلي داخل العراق</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#200b2c] tracking-tight leading-tight">
                  صحتك وعافيتك تبدأ من{" "}
                  <span className="text-[#6a3490] underline decoration-[#ffd068] decoration-wavy decoration-3">
                    اختيار نقي وموثوق
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-[#6b5575] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  نوفّر لك أفضل المكملات الغذائية والفيتامينات العالمية المعتمدة لتعزيز طاقتك، حماية مناعتك، ورعاية
                  صحتك وصحة عائلتك — مع خدمة الدفع عند الاستلام والتوصيل السريع لجميع محافظات العراق الـ 18.
                </p>

                {/* Primary CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href="#products"
                    className="px-8 py-4 rounded-xl bg-[#200b2c] text-[#ffd068] font-bold text-base hover:bg-[#3b1b52] shadow-lg shadow-[#200b2c]/15 transition-all hover:scale-102 active:scale-98 flex items-center gap-2"
                  >
                    <span>تسوق المنتجات الآن</span>
                    <ArrowRight className="size-5 rotate-180" />
                  </a>

                  <a
                    href="https://wa.me/9647700000000?text=مرحباً%20ديم%20هيلث،%20أرغب%20في%20استشارة%20بخصوص%20المكملات"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-4 rounded-xl bg-white border border-[#cbafd9] text-[#200b2c] font-semibold text-base hover:bg-[#f9f5fc] transition-all flex items-center gap-2 shadow-xs"
                  >
                    <PhoneCall className="size-5 text-emerald-600" />
                    <span>استشر صيدلي ديم هيلث</span>
                  </a>
                </div>

                {/* Trust Metrics Bar */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#ede5f2] text-center max-w-lg mx-auto lg:mx-0">
                  <div className="p-2">
                    <p className="text-2xl font-bold text-[#200b2c]">100%</p>
                    <p className="text-xs text-[#6b5575] mt-1 font-medium">منتجات أصلية مفحوصة</p>
                  </div>
                  <div className="p-2 border-x border-[#ede5f2]">
                    <p className="text-2xl font-bold text-[#200b2c]">18 محافظة</p>
                    <p className="text-xs text-[#6b5575] mt-1 font-medium">تغطية توصيل شاملة</p>
                  </div>
                  <div className="p-2">
                    <p className="text-2xl font-bold text-[#200b2c]">COD</p>
                    <p className="text-xs text-[#6b5575] mt-1 font-medium">الدفع عند باب بيتك</p>
                  </div>
                </div>
              </div>

              {/* Hero Image Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative backdrop shapes */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#b090c3]/30 to-[#ffd068]/20 rounded-3xl blur-2xl -z-10" />

                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white aspect-4/3">
                    <Image
                      src="/images/lifestyle-kitchen.jpg"
                      alt="نمط حياة صحي مع ديم هيلث"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  {/* Floating floating guarantee pill */}
                  <div className="absolute -bottom-6 -right-6 sm:bottom-4 sm:right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-[#ede5f2] flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#200b2c]">ضمان الجودة والأصالة</p>
                      <p className="text-xs text-[#6b5575]">تخزين طبي وحفظ سليم</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / Why Us Section */}
        <section id="why-us" className="py-16 bg-white border-y border-[#ede5f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#200b2c]">
                لماذا يثق الآلاف بمتجر ديم هيلث؟
              </h2>
              <p className="text-sm sm:text-base text-[#6b5575] mt-2">
                نحن لا نبيع المكملات فقط، بل نضمن لك أعلى معايير الأمان الطبي ومصدر المنتج الموثوق.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#f9f5fc] p-6 rounded-2xl border border-[#ede5f2] transition-all hover:shadow-md">
                <div className="size-12 rounded-xl bg-[#200b2c] text-[#ffd068] flex items-center justify-center mb-4">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-[#200b2c]">أصالة مضمونة 100%</h3>
                <p className="text-sm text-[#6b5575] mt-2 leading-relaxed">
                  جميع مكملاتنا مستوردة من علامات موثوقة ومحفوظة وفق معايير درجات الحرارة الطبية المناسبة.
                </p>
              </div>

              <div className="bg-[#f9f5fc] p-6 rounded-2xl border border-[#ede5f2] transition-all hover:shadow-md">
                <div className="size-12 rounded-xl bg-[#200b2c] text-[#ffd068] flex items-center justify-center mb-4">
                  <Truck className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-[#200b2c]">شحن سريع لـ 18 محافظة</h3>
                <p className="text-sm text-[#6b5575] mt-2 leading-relaxed">
                  توصيل خلال 24-48 ساعة داخل بغداد وباقي المحافظات مع شحن مجاني للطلبات الكبيرة.
                </p>
              </div>

              <div className="bg-[#f9f5fc] p-6 rounded-2xl border border-[#ede5f2] transition-all hover:shadow-md">
                <div className="size-12 rounded-xl bg-[#200b2c] text-[#ffd068] flex items-center justify-center mb-4">
                  <Tag className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-[#200b2c]">الدفع عند الاستلام</h3>
                <p className="text-sm text-[#6b5575] mt-2 leading-relaxed">
                  تسوق بأمان تام بدون بطاقات بنكية، ادفع نقداً لمندوب التوصيل بعد استلام طلبك وفحصه.
                </p>
              </div>

              <div className="bg-[#f9f5fc] p-6 rounded-2xl border border-[#ede5f2] transition-all hover:shadow-md">
                <div className="size-12 rounded-xl bg-[#200b2c] text-[#ffd068] flex items-center justify-center mb-4">
                  <PhoneCall className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-[#200b2c]">استشارة طبية مجانية</h3>
                <p className="text-sm text-[#6b5575] mt-2 leading-relaxed">
                  فريقنا الصيدلاني جاهز للإجابة عن أسئلتكم ومساعدتكم في اختيار الجرعة والمكمل الأنسب.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section id="products" className="py-16 md:py-20 bg-[#fbf9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-sm font-bold text-[#8545b3]">قائمتنا المختارة</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#200b2c] mt-1">
                  أفضل المكملات والفيتامينات الأكثر طلباً
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="ابحث عن منتج، فيتامين، كولاجين..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#ede5f2] rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#8545b3] text-[#200b2c]"
                />
                <Search className="size-4 text-[#6b5575] absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#200b2c] text-[#ffd068] shadow-md shadow-[#200b2c]/10"
                      : "bg-white text-[#6b5575] hover:bg-[#f1e9f7] border border-[#ede5f2]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#ede5f2] overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-300 group"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-4/3 bg-[#f9f5fc] overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.badge && (
                        <span className="absolute top-3 right-3 bg-[#200b2c]/90 text-[#ffd068] text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-xs font-medium text-[#8545b3]">{product.category}</span>
                      <h3 className="text-base sm:text-lg font-bold text-[#200b2c] mt-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#6b5575] mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className="flex text-[#f6bb3a]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="size-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-[#6b5575]">({product.reviewsCount} تقييم)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="p-5 pt-0 border-t border-[#f1e9f7] mt-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg sm:text-xl font-extrabold text-[#200b2c]">
                          {product.price.toLocaleString()} د.ع
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-zinc-400 line-through">
                            {product.originalPrice.toLocaleString()} د.ع
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium">متوفر في المخزن</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2.5 rounded-xl bg-[#200b2c] text-[#ffd068] text-xs sm:text-sm font-bold hover:bg-[#3b1b52] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="size-4" />
                        <span>أضف للسلة</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#ede5f2]">
                <p className="text-base text-[#6b5575]">لم نتمكن من العثور على أي منتج يطابق بحثك.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("الكل");
                  }}
                  className="mt-4 px-4 py-2 text-sm text-[#8545b3] font-bold underline"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Brand Story & Lifestyle Section */}
        <section className="py-16 bg-gradient-to-r from-[#200b2c] to-[#3b1b52] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-sm font-bold text-[#ffd068] tracking-wider uppercase">
                  عن متجر ديم هيلث
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                  نحن نؤمن بأن الاستثمار في صحتك هو أثمن ما تملكه
                </h2>
                <p className="text-sm sm:text-base text-[#e2d2ec] leading-relaxed">
                  تأسست «ديم هيلث» لسد الفجوة في سوق المكملات الغذائية في العراق، حيث واجه الكثيرون صعوبة في تمييز
                  المنتجات الأصلية من المقلدة. نحن نختار شركاءنا بعناية فائقة ونلتزم بشروط التخزين والنقل المعتمدة
                  دولياً لضمان وصول كل كبسولة أو مستخلص إلى يدك بكامل فاعليته وأمانه.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <p className="text-2xl font-bold text-[#ffd068]">+5,000</p>
                    <p className="text-xs text-white/80 mt-1">طلب تم توصيله بنجاح</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <p className="text-2xl font-bold text-[#ffd068]">99.4%</p>
                    <p className="text-xs text-white/80 mt-1">نسبة رضا الزبائن في العراق</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <Image
                  src="/images/lifestyle-table.jpg"
                  alt="مكملات ديم هيلث في الحياة اليومية"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#8545b3] tracking-widest uppercase">
                الأسئلة الشائعة
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#200b2c] mt-1">
                كل ما تحتاج معرفته قبل الطلب
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "كيف أتأكد أن مكملات ديم هيلث أصلية وليست مقلدة؟",
                  a: "جميع منتجاتنا مستوردة مباشرة من الوكلاء والشركات المصنعة الأصلية، وتحمل الباركود ورقم التشغيلة (Batch Number) المعتمد، كما نوفر فحص وتخزين طبي صارم.",
                },
                {
                  q: "كم تستغرق مدة التوصيل؟ وما هي كلفة الشحن؟",
                  a: "يستغرق التوصيل داخل بغداد 24 ساعة فقط (أجرة 4,000 د.ع)، ولكافة المحافظات الأخرى 24-48 ساعة (أجرة 5,000 د.ع). التوصيل مجاني تماماً لأي طلب يتجاوز 60,000 د.ع.",
                },
                {
                  q: "هل أحتاج لبطاقة مصرفية أو حساب للدفع؟",
                  a: "أبداً! نوفر خدمة الدفع عند الاستلام (Cash On Delivery) فقط. تدفع للمندوب عند وصول الطلب إلى باب بيتك وفحصه.",
                },
                {
                  q: "كيف أستفيد من الاستشارة الصيدلانية المجانية؟",
                  a: "يمكنك الضغط على زر الواتساب في أي وقت للتحدث مع فريقنا الصيدلاني، لمساعدتك في معرفة التداخلات الدوائية والجرعة المناسبة لصحتك.",
                },
              ].map((item, idx) => (
                <details
                  key={idx}
                  className="group bg-[#f9f5fc] p-5 rounded-2xl border border-[#ede5f2] open:bg-white open:shadow-xs transition-all"
                >
                  <summary className="flex items-center justify-between font-bold text-[#200b2c] cursor-pointer text-sm sm:text-base list-none">
                    <span>{item.q}</span>
                    <ChevronDown className="size-5 text-[#8545b3] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-[#6b5575] leading-relaxed border-t border-[#ede5f2] pt-3">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Shopping Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#ede5f2]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-5 text-[#200b2c]" />
                  <h3 className="text-lg font-bold text-[#200b2c]">سلة المشتريات</h3>
                  <span className="text-xs bg-[#f1e9f7] text-[#200b2c] font-bold px-2 py-0.5 rounded-full">
                    {totalItemCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="size-12 text-[#cbafd9] mx-auto mb-3" />
                  <p className="text-base font-semibold text-[#200b2c]">سلتك فارغة حالياً</p>
                  <p className="text-xs text-[#6b5575] mt-1">تصفح منتجات ديم هيلث وأضف ما يناسبك</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-[#200b2c] text-[#ffd068] text-xs font-bold"
                  >
                    متابعة التسوق
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#ede5f2] mt-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-4 flex gap-3 items-center">
                      <div className="relative size-16 rounded-xl overflow-hidden bg-[#f9f5fc] shrink-0 border border-[#ede5f2]">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#200b2c] truncate">{item.product.name}</h4>
                        <p className="text-xs font-semibold text-[#8545b3] mt-0.5">
                          {item.product.price.toLocaleString()} د.ع
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="size-6 rounded-md bg-[#f1e9f7] hover:bg-[#e2d2ec] flex items-center justify-center text-[#200b2c]"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="size-6 rounded-md bg-[#f1e9f7] hover:bg-[#e2d2ec] flex items-center justify-center text-[#200b2c]"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer & Checkout Action */}
            {cart.length > 0 && (
              <div className="pt-6 border-t border-[#ede5f2] space-y-4">
                {/* Coupon input */}
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="كوبون خصم (مثال: DEEM10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 border border-[#ede5f2] rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:border-[#8545b3]"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#f1e9f7] hover:bg-[#e2d2ec] text-[#200b2c] text-xs font-bold rounded-xl cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-emerald-600 font-medium">تم تطبيق الكوبون بنجاح!</p>
                  )}
                  {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                </div>

                {/* Subtotals */}
                <div className="space-y-1.5 text-xs text-[#6b5575]">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold text-[#200b2c]">{subtotal.toLocaleString()} د.ع</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>خصم الكوبون:</span>
                      <span className="font-bold">-{couponDiscount.toLocaleString()} د.ع</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>التوصيل:</span>
                    <span>يُحسب في الخطوة التالية</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#200b2c] text-[#ffd068] font-bold text-sm hover:bg-[#3b1b52] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#200b2c]/15"
                >
                  <span>متابعة إتمام الطلب (الدفع عند الاستلام)</span>
                  <ArrowRight className="size-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Express Checkout Modal (COD Iraq) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#ede5f2] overflow-hidden my-8 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#200b2c] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffd068]">
                  إتمام الطلب — الدفع عند الاستلام
                </h3>
                <p className="text-xs text-[#e2d2ec]">توصيل لجميع محافظات العراق الـ 18</p>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setOrderSuccess(null);
                }}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* If Order Success */}
            {orderSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="size-8" />
                </div>
                <h4 className="text-xl font-bold text-[#200b2c]">تم استلام طلبك بنجاح!</h4>
                <p className="text-sm text-[#6b5575] leading-relaxed">
                  شكراً لاختيارك ديم هيلث. رقم طلبك هو{" "}
                  <span className="font-mono font-bold text-[#200b2c] bg-[#f1e9f7] px-2 py-0.5 rounded">
                    {orderSuccess.orderNumber}
                  </span>
                  . سيتصل بك مندوبنا قريباً لتأكيد الموعد والتسليم.
                </p>

                <div className="pt-4 flex flex-col gap-2">
                  <a
                    href={`https://wa.me/9647700000000?text=مرحباً%20ديم%20هيلث،%20قمت%20بالطلب%20رقم%20${orderSuccess.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="size-4" />
                    <span>تأكيد ومتابعة الطلب عبر واتساب</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setOrderSuccess(null);
                    }}
                    className="w-full py-2.5 rounded-xl border border-[#ede5f2] text-xs font-semibold text-[#6b5575]"
                  >
                    إغلاق والعودة للمتجر
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-[#200b2c] mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: علي محمد حسن"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-[#ede5f2] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8545b3]"
                  />
                </div>

                {/* Iraqi Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-[#200b2c] mb-1">
                    رقم الهاتف العراقي (11 رقم) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="0770XXXXXXX أو 0780XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-[#ede5f2] rounded-xl px-3.5 py-2.5 text-sm text-right focus:outline-none focus:border-[#8545b3]"
                  />
                </div>

                {/* Governorate selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#200b2c] mb-1">
                      المحافظة <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full border border-[#ede5f2] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8545b3] bg-white cursor-pointer"
                    >
                      {GOVERNORATES.map((g) => (
                        <option key={g.code} value={g.code}>
                          {g.name} ({g.fee === 0 ? "مجاناً" : `${g.fee.toLocaleString()} د.ع`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#200b2c] mb-1">
                      المنطقة / القضاء <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: المنصور، الكرادة، الزبير"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full border border-[#ede5f2] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8545b3]"
                    />
                  </div>
                </div>

                {/* Address Details */}
                <div>
                  <label className="block text-xs font-bold text-[#200b2c] mb-1">
                    العنوان التفصيلي (أقرب نقطة دالة) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="الشارع، رقم الزقاق، مجاور صيدلية أو مدرسة..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-[#ede5f2] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8545b3]"
                  />
                </div>

                {/* Order Summary Box */}
                <div className="p-3.5 rounded-xl bg-[#f9f5fc] border border-[#ede5f2] space-y-1 text-xs">
                  <div className="flex justify-between text-[#6b5575]">
                    <span>قيمة المكملات:</span>
                    <span className="font-bold text-[#200b2c]">{subtotal.toLocaleString()} د.ع</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>خصم الكوبون:</span>
                      <span className="font-bold">-{couponDiscount.toLocaleString()} د.ع</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6b5575]">
                    <span>أجرة التوصيل ({selectedGov.name}):</span>
                    <span className="font-bold text-[#200b2c]">
                      {deliveryFee === 0 ? "مجاناً (عرض ديم)" : `${deliveryFee.toLocaleString()} د.ع`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#200b2c] pt-2 border-t border-[#ede5f2]">
                    <span>المبلغ الكلي المطلوب عند الاستلام:</span>
                    <span className="text-base text-[#6a3490]">{total.toLocaleString()} د.ع</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[#200b2c] text-[#ffd068] font-bold text-base hover:bg-[#3b1b52] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#200b2c]/15 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جارٍ تأكيد الطلب...</span>
                  ) : (
                    <>
                      <span>تأكيد الطلب والدفع عند الاستلام</span>
                      <CheckCircle className="size-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#200b2c] text-white border-t border-[#3b1b52] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-2">
              <Image
                src="/brand/deem-logo.svg"
                alt="ديم هيلث"
                width={150}
                height={50}
                className="h-10 w-auto invert brightness-200"
              />
              <p className="text-xs sm:text-sm text-[#e2d2ec] max-w-md leading-relaxed">
                متجر عراقي متخصص في توفير أرقى المكملات الغذائية والفيتامينات العالمية المعتمدة لتعزيز الصحة والنشاط
                والعافية، مع ضمان الأصالة وخدمة التوصيل السريع والدفع عند الاستلام.
              </p>
              <div className="flex items-center gap-3 text-xs text-[#ffd068]">
                <ShieldCheck className="size-4" />
                <span>مرخص ومعتمد من قبل متخصصين في الرعاية الصحية</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-[#ffd068] mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#e2d2ec]">
                <li>
                  <a href="#products" className="hover:text-white transition-colors">
                    جميع المنتجات
                  </a>
                </li>
                <li>
                  <a href="#why-us" className="hover:text-white transition-colors">
                    لماذا ديم هيلث؟
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    الأسئلة الشائعة
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/9647700000000" className="hover:text-white transition-colors">
                    تواصل واتساب
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact & Info */}
            <div>
              <h4 className="text-sm font-bold text-[#ffd068] mb-4">خدمة العملاء</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#e2d2ec]">
                <li>العراق — بغداد وجميع المحافظات</li>
                <li>ساعات العمل: 9:00 صباحاً – 10:00 مساءً</li>
                <li>واتساب: 009647700000000</li>
                <li>الدفع: نقد عند الاستلام (COD)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#cbafd9]">
            <p>© {new Date().getFullYear()} ديم هيلث (Deem Health). جميع الحقوق محفوظة داخل العراق.</p>
            <p>صُمم وطُوّر لتقديم تجربة تسوق طبية موثوقة وفائقة السرعة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
