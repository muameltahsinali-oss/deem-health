/**
 * Tracking vocabulary shared by browser and server. Import-safe everywhere (no secrets).
 */
export const META_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
] as const;

export type MetaEventName = (typeof META_EVENTS)[number];

/**
 * Events the browser also relays to /api/track so the server can send them through the
 * Conversions API with the SAME event_id (Meta deduplicates Pixel + CAPI on event_name + event_id).
 * Purchase is intentionally NOT here: it is sent server-side from the real order creation only.
 */
export const BROWSER_RELAYED_EVENTS = ["ViewContent", "AddToCart", "InitiateCheckout"] as const;
export type BrowserRelayedEvent = (typeof BROWSER_RELAYED_EVENTS)[number];

export function isBrowserRelayedEvent(name: string): name is BrowserRelayedEvent {
  return (BROWSER_RELAYED_EVENTS as readonly string[]).includes(name);
}

export type TrackContent = { id: string; quantity: number; item_price: number };

export type TrackPayload = {
  name: MetaEventName;
  /** Provide to share an id with a server-side event; generated otherwise. */
  eventId?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contents?: TrackContent[];
  contentName?: string;
  contentCategory?: string;
  numItems?: number;
  searchString?: string;
};

/** Random, collision-resistant event id. Works in non-secure contexts too (LAN testing). */
export function newEventId(prefix: string): string {
  let id: string;
  const c: Crypto | undefined = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (c && typeof c.randomUUID === "function") {
    id = c.randomUUID();
  } else if (c && typeof c.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
  return `${prefix}.${id}`;
}

/** Deterministic Purchase event id for an order — used by both Pixel and CAPI. */
export function purchaseEventIdFor(orderToken: string): string {
  return `purchase.${orderToken}`;
}
