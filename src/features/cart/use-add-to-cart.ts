"use client";

import { useCallback } from "react";
import { cartActions, type CartItem } from "./cart-store";
import { trackEvent } from "@/features/tracking/client";
import { useToast } from "@/components/ui/toast";
import { t } from "@/i18n";

export type AddableProduct = Omit<CartItem, "quantity"> & { stock: number; categoryName?: string };

/** Adds to cart + AddToCart tracking + feedback toast. Single implementation for card, PDP and sticky bar. */
export function useAddToCart() {
  const { toast } = useToast();
  return useCallback(
    (product: AddableProduct, quantity = 1, options?: { silent?: boolean }) => {
      if (product.stock <= 0) return false;
      const { stock, categoryName, ...item } = product;
      cartActions.add(item, quantity, stock);
      trackEvent({
        name: "AddToCart",
        value: product.price * quantity,
        currency: "IQD",
        contentIds: [product.productId],
        contents: [{ id: product.productId, quantity, item_price: product.price }],
        contentName: product.name,
        contentCategory: categoryName,
      });
      if (!options?.silent) toast(t.product.addedToCart, { action: { label: t.cart.title, href: "/cart" } });
      return true;
    },
    [toast],
  );
}
