import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { clientIpFromHeaders, isSameOrigin } from "@/server/request";

const schema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  authorName: z.string().trim().min(2).max(40),
  comment: z.string().trim().min(5).max(600),
  website: z.string().max(0).optional(), // honeypot must stay empty
});

/** Customer review submission — stored as PENDING until approved in Admin → Reviews. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientIpFromHeaders(request.headers) ?? "unknown";
  if (!rateLimit(`review:${ip}`, 5, 60 * 60_000).ok) {
    return NextResponse.json({ error: "طلبات كثيرة. حاول لاحقاً." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "يرجى التحقق من الاسم والتعليق." }, { status: 422 });

  const product = await db.product.findFirst({ where: { id: parsed.data.productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });

  // Strip control characters / tags defensively (content is rendered as text by React anyway)
  const clean = (s: string) =>
    Array.from(s.replace(/[<>]/g, ""))
      .map((ch) => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? " " : ch))
      .join("")
      .trim();
  await db.review.create({
    data: {
      productId: product.id,
      rating: parsed.data.rating,
      authorName: clean(parsed.data.authorName),
      comment: clean(parsed.data.comment),
      status: "PENDING",
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
