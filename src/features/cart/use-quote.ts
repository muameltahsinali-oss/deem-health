"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClientQuote } from "@/features/checkout/quote-types";
import type { CartItem } from "./cart-store";
import { cartActions } from "./cart-store";

type State = { quote: ClientQuote | null; loading: boolean; error: boolean };

/**
 * Fetches the authoritative quote for the current cart (debounced, stale responses ignored)
 * and refreshes the cart's display snapshots with current server prices.
 */
export function useQuote(items: CartItem[], couponCode: string | null, governorateCode: string | null, enabled = true) {
  const [state, setState] = useState<State>({ quote: null, loading: true, error: false });
  const [nonce, setNonce] = useState(0);
  const requestId = useRef(0);

  const key = useMemo(
    () => JSON.stringify({ items: items.map((i) => [i.productId, i.quantity]), couponCode, governorateCode }),
    [items, couponCode, governorateCode],
  );

  useEffect(() => {
    if (!enabled) return;
    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (items.length === 0) {
        if (id === requestId.current) setState({ quote: null, loading: false, error: false });
        return;
      }
      if (id === requestId.current) setState((s) => ({ ...s, loading: true, error: false }));
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            couponCode,
            governorateCode,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const quote = (await res.json()) as ClientQuote;
        if (id !== requestId.current) return;
        setState({ quote, loading: false, error: false });
        cartActions.syncSnapshots(
          quote.lines
            .filter((l) => l.issue !== "UNAVAILABLE" || l.name)
            .map((l) => ({ productId: l.productId, price: l.unitPrice, compareAtPrice: l.compareAtPrice, name: l.name, image: l.image })),
        );
      } catch (err) {
        if ((err as Error).name === "AbortError" || id !== requestId.current) return;
        setState((s) => ({ ...s, loading: false, error: true }));
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `key` captures items/coupon/governorate; nonce forces a retry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, enabled]);

  return { ...state, retry: () => setNonce((n) => n + 1) };
}
