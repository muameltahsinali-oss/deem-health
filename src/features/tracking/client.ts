"use client";

import { newEventId, isBrowserRelayedEvent, type TrackPayload } from "./events";

/**
 * Single entry point for ALL browser tracking. Components never call fbq directly.
 *
 *  trackEvent({ name: "AddToCart", value, currency, contents })
 *
 * – fires the Meta Pixel event with an `eventID`
 * – for ViewContent / AddToCart / InitiateCheckout, relays the same event_id to /api/track,
 *   which sends it to the Conversions API (Meta deduplicates the pair)
 * – suppresses accidental duplicates (e.g. React re-mounts) within a short window
 * Purchase is sent from the server at order creation; the confirmation page fires the browser
 * half with the server-generated event id (see PurchaseTracker).
 */

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: unknown;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    __dhTracking?: { pixelId: string | null; serverRelay: boolean };
  }
}

let config: { pixelId: string | null; serverRelay: boolean } | null = null;

/** Called by <MetaPixel> during render (before any child effect fires). Idempotent. */
export function configureTracking(next: { pixelId: string | null; serverRelay: boolean }) {
  config = next;
  if (typeof window !== "undefined") window.__dhTracking = next;
}

/** Installs the official fbq stub + fbevents.js on first use, then `init`s the pixel. */
function ensurePixel(): FbqFn | null {
  if (typeof window === "undefined" || !config?.pixelId) return null;
  if (window.fbq) return window.fbq;
  const queue: unknown[] = [];
  const fbq = function (...args: unknown[]) {
    if (typeof fbq.callMethod === "function") (fbq.callMethod as (...a: unknown[]) => void)(...args);
    else queue.push(args);
  } as FbqFn;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = queue;
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", config.pixelId);
  return fbq;
}

const recent = new Map<string, number>();
const DEDUPE_WINDOW_MS = 2000;
const DEDUPED_EVENTS = new Set(["PageView", "ViewContent", "Search", "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead"]);

function isDuplicate(payload: TrackPayload): boolean {
  if (!DEDUPED_EVENTS.has(payload.name)) return false;
  const key = `${payload.name}|${payload.eventId ?? ""}|${(payload.contentIds ?? []).join(",")}|${payload.searchString ?? ""}`;
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  return last !== undefined && now - last < DEDUPE_WINDOW_MS;
}

export function pixelParams(payload: TrackPayload): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (payload.value !== undefined) params.value = payload.value;
  if (payload.currency) params.currency = payload.currency;
  if (payload.contentIds?.length) {
    params.content_ids = payload.contentIds;
    params.content_type = "product";
  }
  if (payload.contents?.length) {
    params.contents = payload.contents;
    params.content_type = "product";
  }
  if (payload.contentName) params.content_name = payload.contentName;
  if (payload.contentCategory) params.content_category = payload.contentCategory;
  if (payload.numItems !== undefined) params.num_items = payload.numItems;
  if (payload.searchString) params.search_string = payload.searchString;
  return params;
}

export function trackEvent(payload: TrackPayload): string | null {
  if (typeof window === "undefined") return null;
  const cfg = config;
  if (!cfg?.pixelId) return null; // tracking disabled or not configured
  if (isDuplicate(payload)) return null;

  const eventId = payload.eventId ?? newEventId(payload.name.toLowerCase());

  try {
    ensurePixel()?.("track", payload.name, pixelParams(payload), { eventID: eventId });
  } catch {
    // Pixel blocked by an extension — server relay below still works
  }

  if (cfg.serverRelay && isBrowserRelayedEvent(payload.name)) {
    const body = JSON.stringify({ ...payload, eventId, url: window.location.href });
    try {
      const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
      if (!sent) {
        void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      // never let tracking break the UI
    }
  }
  return eventId;
}

export function trackPageView() {
  try {
    ensurePixel()?.("track", "PageView");
  } catch {
    /* ignore */
  }
}
