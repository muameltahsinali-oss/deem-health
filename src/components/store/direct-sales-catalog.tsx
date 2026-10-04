"use client";

import { useState } from "react";
import type { ProductCardData } from "@/server/catalog";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/cn";

type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

export function DirectSalesCatalog({
  products,
  categories,
  lowStockThreshold = 10,
}: {
  products: ProductCardData[];
  categories: CategoryFilter[];
  lowStockThreshold?: number;
}) {
  const [selectedTab, setSelectedTab] = useState<string>("all");

  const filteredProducts = products.filter((p) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "bestsellers") return p.bestSeller;
    if (selectedTab === "sale") return p.compareAtPrice && p.compareAtPrice > p.price;
    return p.categoryId === selectedTab || p.slug.includes(selectedTab);
  });

  const tabs = [
    { id: "all", label: `جميع المنتجات (${products.length})` },
    { id: "bestsellers", label: "🔥 الأكثر طلباً ومبيعاً" },
    { id: "sale", label: "⚡ عروض التوفير" },
    ...categories.map((c) => ({
      id: c.id,
      label: c.name,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Category Pills Navigation */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-plum-950 text-paper shadow-sm scale-[1.02]"
                  : "bg-paper border border-line text-ink hover:border-plum-950/30 hover:bg-lavender-50",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.map((p, idx) => (
          <ProductCard
            key={p.id}
            product={p}
            priority={idx < 4}
            lowStockThreshold={lowStockThreshold}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-line bg-paper p-12 text-center">
          <p className="text-muted">لا توجد منتجات مطابقة لهذا القسم حالياً.</p>
        </div>
      )}
    </div>
  );
}
