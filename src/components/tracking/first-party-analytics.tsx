"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_DAYS,
  attributionFromUrl,
  parseAttribution,
  referralAttribution,
  serializeAttribution,
  SESSION_COOKIE,
  SESSION_TTL_MINUTES,
} from "@/features/attribution/shared";
import { newEventId } from "@/features/tracking/events";

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

/**
 * First-party marketing attribution + visit sessions (no third-party dependency):
 *  – stores utm_* / fbclid from the landing URL in `dh_attr` (30 days, last campaign touch wins)
 *  – creates the `_fbc` click-id cookie from fbclid if the Pixel hasn't already
 *  – starts a 30-minute rolling session (`dh_sid`) and registers it once for conversion-rate KPIs
 */
export function FirstPartyAnalytics() {
  const pathname = usePathname();

  // Keep the session alive while the visitor navigates client-side
  useEffect(() => {
    try {
      const sid = readCookie(SESSION_COOKIE);
      if (sid) writeCookie(SESSION_COOKIE, sid, SESSION_TTL_MINUTES * 60);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const referrer = document.referrer || null;

      const campaign = attributionFromUrl(url, referrer);
      const existing = parseAttribution(readCookie(ATTRIBUTION_COOKIE));
      const next = campaign ?? (existing ? null : referralAttribution(url, referrer));
      if (next) writeCookie(ATTRIBUTION_COOKIE, serializeAttribution(next), ATTRIBUTION_MAX_AGE_DAYS * 86400);

      if (campaign?.fbclid && !readCookie("_fbc")) {
        writeCookie("_fbc", `fb.1.${Date.now()}.${campaign.fbclid}`, 90 * 86400);
      }

      let sid = readCookie(SESSION_COOKIE);
      const isNewSession = !sid;
      if (!sid) sid = newEventId("s").slice(2);
      writeCookie(SESSION_COOKIE, sid, SESSION_TTL_MINUTES * 60); // rolling expiry

      if (isNewSession && !/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) {
        const body = JSON.stringify({
          id: sid,
          landingPath: (url.pathname + url.search).slice(0, 300),
          referrer: referrer?.slice(0, 300) ?? null,
          utmSource: next?.utmSource ?? existing?.utmSource ?? null,
        });
        if (!navigator.sendBeacon?.("/api/sessions", new Blob([body], { type: "application/json" }))) {
          void fetch("/api/sessions", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
        }
      }
    } catch {
      // analytics must never break the storefront
    }
  }, []);

  return null;
}
