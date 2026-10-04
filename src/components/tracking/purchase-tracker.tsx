"use client";

import { useEffect } from "react";
import { trackEvent } from "@/features/tracking/client";

/**
 * Browser half of the Purchase event. The server already sent Purchase via the Conversions API
 * at order creation with the same `eventId`, so Meta deduplicates the pair.
 * A per-order flag in localStorage prevents re-firing on refresh/revisit.
 */
export function PurchaseTracker(props: {
  orderNumber: string;
  eventId: string;
  value: number;
  currency: string;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
}) {
  const { orderNumber, eventId, value, currency, contents } = props;
  useEffect(() => {
    const key = `dh_purchase_${orderNumber}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      // storage unavailable → still fire once for this view; server dedup covers duplicates
    }
    trackEvent({
      name: "Purchase",
      eventId,
      value,
      currency,
      contentIds: contents.map((c) => c.id),
      contents,
      numItems: contents.reduce((n, c) => n + c.quantity, 0),
    });
  }, [orderNumber, eventId, value, currency, contents]);
  return null;
}
