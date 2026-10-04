import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "dh_admin_session";

/**
 * Next.js 16 "proxy" (formerly middleware). Fast, optimistic gate for /admin/*:
 * requests without a session cookie are redirected to the login page.
 * The session itself is verified against the database in every admin layout,
 * page and server action via requireAdmin() — this is only the first line.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const next = `${pathname}${search}`;
    if (next.startsWith("/admin") && next !== "/admin") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
