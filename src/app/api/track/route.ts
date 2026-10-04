import { after, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { BROWSER_RELAYED_EVENTS } from "@/features/tracking/events";
import { sendServerEvent } from "@/server/tracking/capi";
import { getTrackingConfig } from "@/server/tracking/config";
import { rateLimit } from "@/server/rate-limit";
import { clientIpFromHeaders, isSameOrigin } from "@/server/request";
import { env } from "@/server/env";

const contentSchema = z.object({
  id: z.string().max(64),
  quantity: z.number().int().min(1).max(999),
  item_price: z.number().min(0).max(100_000_000),
});

/** Only browser-originated funnel events are accepted here. Purchase is server-only (order creation). */
const trackSchema = z.object({
  name: z.enum(BROWSER_RELAYED_EVENTS),
  eventId: z.string().min(8).max(100),
  value: z.number().min(0).max(1_000_000_000).optional(),
  currency: z.literal("IQD").optional(),
  contentIds: z.array(z.string().max(64)).max(50).optional(),
  contents: z.array(contentSchema).max(50).optional(),
  contentName: z.string().max(200).optional(),
  contentCategory: z.string().max(100).optional(),
  numItems: z.number().int().min(0).max(999).optional(),
  url: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const ip = clientIpFromHeaders(request.headers);
  if (!rateLimit(`track:${ip ?? "unknown"}`, 120, 60_000).ok) return new NextResponse(null, { status: 429 });

  const cfg = await getTrackingConfig();
  if (!cfg.enabled || !cfg.pixelId || !cfg.capiAccessToken) return new NextResponse(null, { status: 204 });

  const parsed = trackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const e = parsed.data;

  // Only accept source URLs on our own site
  let sourceUrl: string | null = null;
  if (e.url) {
    try {
      const u = new URL(e.url);
      if (u.origin === new URL(env.appUrl).origin || u.host === request.headers.get("host")) sourceUrl = u.toString();
    } catch {
      sourceUrl = null;
    }
  }

  const jar = await cookies();
  const userAgent = request.headers.get("user-agent");
  const fbp = jar.get("_fbp")?.value ?? null;
  const fbc = jar.get("_fbc")?.value ?? null;

  after(() =>
    sendServerEvent({
      name: e.name,
      eventId: e.eventId,
      eventSourceUrl: sourceUrl,
      user: { ip, userAgent, fbp, fbc, countryCode: "iq" },
      customData: {
        currency: e.currency,
        value: e.value,
        contentIds: e.contentIds,
        contents: e.contents,
        contentName: e.contentName,
        contentCategory: e.contentCategory,
        numItems: e.numItems,
      },
    }),
  );
  return new NextResponse(null, { status: 202 });
}
