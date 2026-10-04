import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { clientIpFromHeaders, isSameOrigin } from "@/server/request";

const schema = z.object({
  id: z.string().regex(/^[A-Za-z0-9._-]{8,80}$/),
  landingPath: z.string().max(300).nullish(),
  referrer: z.string().max(300).nullish(),
  utmSource: z.string().max(200).nullish(),
});

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|lighthouse|headless|preview/i;

/** Registers a first-party browsing session (used for the conversion-rate KPI). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });
  const ip = clientIpFromHeaders(request.headers) ?? "unknown";
  if (!rateLimit(`session:${ip}`, 30, 60 * 60_000).ok) return new NextResponse(null, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  await db.storeSession.createMany({
    data: [
      {
        id: parsed.data.id,
        landingPath: parsed.data.landingPath ?? null,
        referrer: parsed.data.referrer ?? null,
        utmSource: parsed.data.utmSource ?? null,
      },
    ],
    skipDuplicates: true,
  });
  return new NextResponse(null, { status: 204 });
}
