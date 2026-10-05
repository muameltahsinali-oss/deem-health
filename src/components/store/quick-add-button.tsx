"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { useAddToCart, type AddableProduct } from "@/features/cart/use-add-to-cart";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export function QuickAddButton({ product, className }: { product: AddableProduct; className?: string }) {
  const add = useAddToCart();
  const soldOut = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add(product, 1);
      }}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors active:scale-[0.98]",
        soldOut
          ? "cursor-not-allowed bg-plum-50 text-subtle"
          : "bg-plum-950 text-paper hover:bg-plum-800",
        className,
      )}
      aria-label={soldOut ? `${product.name} — ${t.product.outOfStock}` : `${t.product.quickAdd}: ${product.name}`}
    >
      {soldOut ? (
        t.product.outOfStock
      ) : (
        <>
          <PlusIcon size={16} />
          {t.product.addToCart}
        </>
      )}
    </button>
  );
}

export function CardBuyActions({ product, className }: { product: AddableProduct; className?: string }) {
  const router = useRouter();
  const add = useAddToCart();
  const soldOut = product.stock <= 0;

  function directBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (add(product, 1, { silent: true })) {
      router.push("/checkout");
    }
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    add(product, 1);
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <button
        type="button"
        disabled={soldOut}
        onClick={directBuy}
        className={cn(
          "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]",
          soldOut
            ? "cursor-not-allowed bg-lavender-100 text-subtle"
            : "bg-sun-300 text-plum-950 hover:bg-sun-400 shadow-xs",
        )}
      >
        {soldOut ? t.product.outOfStock : "اطلب الآن"}
      </button>
      {!soldOut && (
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full text-xs font-medium text-plum-900 bg-lavender-100 hover:bg-lavender-200 transition-colors"
        >
          <PlusIcon size={14} />
          {t.product.addToCart}
        </button>
      )}
    </div>
  );
}
