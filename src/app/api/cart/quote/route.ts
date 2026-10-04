import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/features/checkout/schemas";
import { buildQuote } from "@/server/checkout/quote";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { clientIpFromHeaders } from "@/server/request";

/** Read-only, authoritative price quote for the cart and checkout UI. */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers) ?? "unknown";
  const limited = rateLimit(`quote:${ip}`, 120, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const json = await request.json().catch(() => null);
  const parsed = quoteRequestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const quote = await buildQuote(db, parsed.data);
  // Internal coupon id is not needed by the client
  const coupon = quote.coupon?.applied
    ? { code: quote.coupon.code, applied: true as const, discount: quote.coupon.discount }
    : quote.coupon;
  return NextResponse.json({ ...quote, coupon }, { headers: { "Cache-Control": "no-store" } });
}
