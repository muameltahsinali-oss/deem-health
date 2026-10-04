import { after, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { orderRequestSchema } from "@/features/checkout/schemas";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/features/attribution/shared";
import { createOrder, OrderError } from "@/server/orders/create-order";
import { sendServerEvent } from "@/server/tracking/capi";
import { splitFullName } from "@/server/tracking/capi-payload";
import { rateLimit } from "@/server/rate-limit";
import { clientIpFromHeaders, isSameOrigin } from "@/server/request";
import { env } from "@/server/env";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent");
  const limited = rateLimit(`order:${ip ?? "unknown"}`, 8, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  const json = await request.json().catch(() => null);
  const parsed = orderRequestSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "validation", fieldErrors }, { status: 422 });
  }

  const jar = await cookies();
  const attribution = parseAttribution(jar.get(ATTRIBUTION_COOKIE)?.value);

  try {
    const order = await createOrder(parsed.data, { ip, userAgent, attribution });

    // Stock changed — refresh the cached product pages so availability is current.
    for (const line of order.lines) revalidatePath(`/product/${line.slug}`);

    // Conversions API Purchase — from the real business event, after the transaction committed.
    // Uses the same event_id the confirmation page gives to the browser Pixel → deduplicated by Meta.
    const fbp = jar.get("_fbp")?.value ?? null;
    const fbc = jar.get("_fbc")?.value ?? null;
    const { firstName, lastName } = splitFullName(order.customer.name);
    after(async () => {
      await sendServerEvent({
        name: "Purchase",
        eventId: order.purchaseEventId,
        orderId: order.id,
        eventSourceUrl: `${env.appUrl}/checkout`,
        user: {
          phone: order.customer.phone,
          firstName,
          lastName,
          city: order.customer.district,
          state: order.customer.governorateName,
          countryCode: "iq",
          externalId: order.customerId,
          ip,
          userAgent,
          fbp,
          fbc,
        },
        customData: {
          currency: order.currency,
          value: order.total,
          orderId: order.orderNumber,
          contentIds: order.lines.map((l) => l.productId),
          contents: order.lines.map((l) => ({ id: l.productId, quantity: l.quantity, item_price: l.unitPrice })),
          numItems: order.lines.reduce((n, l) => n + l.quantity, 0),
        },
      });
    });

    return NextResponse.json(
      {
        orderNumber: order.orderNumber,
        token: order.accessToken,
        purchaseEventId: order.purchaseEventId,
        total: order.total,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        {
          error: err.code,
          couponError: err.details.couponError ?? null,
          minOrderAmount: err.details.minOrderAmount ?? null,
          lines: err.details.quote?.lines.map((l) => ({ productId: l.productId, issue: l.issue, available: l.stock })) ?? [],
        },
        { status: 409 },
      );
    }
    console.error("[orders] create failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
