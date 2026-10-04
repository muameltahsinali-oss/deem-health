"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { configureTracking, trackPageView } from "@/features/tracking/client";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);
  const url = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (last.current === url) return; // one PageView per URL (guards StrictMode double effects)
    last.current = url;
    trackPageView();
  }, [url]);
  return null;
}

/**
 * Meta Pixel for the storefront. The Pixel ID comes from Admin → Marketing & Tracking
 * (or NEXT_PUBLIC_META_PIXEL_ID) — never hardcoded. The fbq base code is installed lazily by
 * src/features/tracking/client.ts; PageView fires on first load and every client navigation.
 */
export function MetaPixel({ pixelId, serverRelay }: { pixelId: string | null; serverRelay: boolean }) {
  const safeId = pixelId ? pixelId.replace(/[^0-9]/g, "") || null : null;
  // Configure synchronously so child effects (ViewContent, PageView…) already see it.
  if (typeof window !== "undefined") configureTracking({ pixelId: safeId, serverRelay: Boolean(safeId) && serverRelay });
  if (!safeId) return null;
  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${safeId}&ev=PageView&noscript=1`} />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
