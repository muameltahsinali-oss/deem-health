"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BagIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useAddToCart, type AddableProduct } from "@/features/cart/use-add-to-cart";
import { trackEvent } from "@/features/tracking/client";
import { formatIQD } from "@/lib/format";
import { t } from "@/i18n";

type Props = {
  product: AddableProduct & { sku: string };
  maxQuantity: number;
  lowStockThreshold: number;
};

export function ProductPurchase({ product, maxQuantity, lowStockThreshold }: Props) {
  const router = useRouter();
  const add = useAddToCart();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const limit = Math.max(1, Math.min(maxQuantity, product.stock));

  // ViewContent — once per product view (dedupe inside trackEvent guards re-mounts)
  useEffect(() => {
    trackEvent({
      name: "ViewContent",
      value: product.price,
      currency: "IQD",
      contentIds: [product.productId],
      contents: [{ id: product.productId, quantity: 1, item_price: product.price }],
      contentName: product.name,
      contentCategory: product.categoryName,
    });
  }, [product.productId, product.price, product.name, product.categoryName]);

  function buyNow() {
    if (add(product, qty, { silent: true })) router.push("/checkout");
  }

  const stockLine = soldOut ? (
    <p className="flex items-center gap-2 text-sm font-medium text-danger">
      <span className="size-2 rounded-full bg-danger" /> {t.product.outOfStock}
    </p>
  ) : product.stock <= lowStockThreshold ? (
    <p className="flex items-center gap-2 text-sm font-medium text-warning">
      <span className="size-2 rounded-full bg-sun-400" /> {t.product.lowStock} — {t.product.onlyLeft(product.stock)}
    </p>
  ) : (
    <p className="flex items-center gap-2 text-sm font-medium text-success">
      <span className="size-2 rounded-full bg-success" /> {t.product.inStock}
    </p>
  );

  return (
    <>
      <div className="space-y-5">
        {stockLine}
        {!soldOut && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">{t.product.quantity}</span>
            <QuantityStepper value={qty} onChange={setQty} max={limit} />
            {qty >= limit && limit < product.stock && <span className="text-xs text-subtle">{t.product.maxQty(limit)}</span>}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={() => add(product, qty)} disabled={soldOut} className="w-full">
            <BagIcon size={20} />
            {soldOut ? t.product.outOfStock : t.product.addToCart}
          </Button>
          {!soldOut && (
            <Button size="lg" variant="accent" onClick={buyNow} className="w-full">
              {t.product.buyNow}
            </Button>
          )}
        </div>
      </div>

      {/* Sticky mobile purchase bar */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{product.name}</p>
              <p className="font-semibold text-plum-950 tabular-nums">{formatIQD(product.price * qty)}</p>
            </div>
            <Button onClick={() => add(product, qty)} className="shrink-0">
              <BagIcon size={18} />
              {t.product.addToCart}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
