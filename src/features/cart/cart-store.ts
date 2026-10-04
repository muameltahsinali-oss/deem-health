"use client";

import { useSyncExternalStore } from "react";

/**
 * Client cart persisted in localStorage (guest checkout — no account required).
 * The cart only stores what to buy + a display snapshot. Authoritative prices, stock,
 * discounts and shipping always come from the server (/api/cart/quote, order creation).
 */
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryId?: string | null;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  couponCode: string | null;
  updatedAt: number;
  /** false until localStorage has been read on the client */
  ready: boolean;
};

const STORAGE_KEY = "dh_cart_v1";
const SERVER_STATE: CartState = { items: [], couponCode: null, updatedAt: 0, ready: false };
const emptyClientState = (): CartState => ({ items: [], couponCode: null, updatedAt: 0, ready: true });
export const MAX_LINE_QUANTITY = 20;

let state: CartState = SERVER_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyClientState();
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (!parsed || !Array.isArray(parsed.items)) return emptyClientState();
    const items = parsed.items
      .filter((i): i is CartItem => Boolean(i && typeof i.productId === "string" && typeof i.quantity === "number"))
      .map((i) => ({ ...i, quantity: Math.min(Math.max(1, Math.floor(i.quantity)), MAX_LINE_QUANTITY) }));
    return {
      items,
      couponCode: typeof parsed.couponCode === "string" ? parsed.couponCode : null,
      updatedAt: parsed.updatedAt ?? 0,
      ready: true,
    };
  } catch {
    return emptyClientState();
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = read();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      state = read();
      emit();
    }
  });
}

function emit() {
  for (const l of listeners) l();
}

function commit(next: Pick<CartState, "items" | "couponCode">) {
  state = { ...next, updatedAt: Date.now(), ready: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, couponCode: state.couponCode, updatedAt: state.updatedAt }));
  } catch {
    // storage full / disabled — cart still works for this page view
  }
  emit();
}

function subscribe(listener: () => void) {
  ensureHydrated();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartState {
  ensureHydrated();
  return state;
}

function getServerSnapshot(): CartState {
  return SERVER_STATE;
}

export const cartActions = {
  add(item: Omit<CartItem, "quantity">, quantity = 1, maxQuantity = MAX_LINE_QUANTITY) {
    ensureHydrated();
    const existing = state.items.find((i) => i.productId === item.productId);
    const limit = Math.min(maxQuantity, MAX_LINE_QUANTITY);
    const items = existing
      ? state.items.map((i) =>
          i.productId === item.productId ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, limit) } : i,
        )
      : [...state.items, { ...item, quantity: Math.min(quantity, limit) }];
    commit({ items, couponCode: state.couponCode });
  },
  setQuantity(productId: string, quantity: number) {
    ensureHydrated();
    const q = Math.min(Math.max(1, Math.floor(quantity)), MAX_LINE_QUANTITY);
    commit({ items: state.items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i)), couponCode: state.couponCode });
  },
  remove(productId: string) {
    ensureHydrated();
    commit({ items: state.items.filter((i) => i.productId !== productId), couponCode: state.couponCode });
  },
  /** Refresh display snapshots (price/name/image) from a server quote without touching quantities. */
  syncSnapshots(updates: Array<Pick<CartItem, "productId" | "price" | "compareAtPrice" | "name" | "image">>) {
    ensureHydrated();
    let changed = false;
    const items = state.items.map((i) => {
      const u = updates.find((x) => x.productId === i.productId);
      if (!u) return i;
      if (u.price === i.price && u.compareAtPrice === i.compareAtPrice && u.name === i.name && u.image === i.image) return i;
      changed = true;
      return { ...i, ...u };
    });
    if (changed) commit({ items, couponCode: state.couponCode });
  },
  setCoupon(code: string | null) {
    ensureHydrated();
    commit({ items: state.items, couponCode: code });
  },
  clear() {
    ensureHydrated();
    commit({ items: [], couponCode: null });
  },
};

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const displaySubtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { ...cart, count, displaySubtotal };
}
