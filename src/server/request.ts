import "server-only";
import { headers } from "next/headers";

export function clientIpFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? null;
}

export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  return { ip: clientIpFromHeaders(h), userAgent: h.get("user-agent") };
}

/**
 * Same-origin check for route handlers that mutate state (CSRF defence in depth).
 * Server Actions already enforce this in Next.js.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin navigations/fetches from older browsers may omit it
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
