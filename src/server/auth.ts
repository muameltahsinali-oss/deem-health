import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { env } from "./env";
import { randomToken, sha256 } from "./crypto";

export const ADMIN_SESSION_COOKIE = "dh_admin_session";

export async function createAdminSession(adminId: string, meta: { ip: string | null; userAgent: string | null }) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + env.adminSessionDays * 24 * 60 * 60 * 1000);
  await db.adminSession.create({
    data: {
      tokenHash: sha256(token),
      adminId,
      expiresAt,
      ip: meta.ip?.slice(0, 100) ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistic cleanup of expired sessions
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export const getCurrentAdmin = cache(async () => {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    select: { expiresAt: true, admin: { select: { id: true, email: true, name: true } } },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.admin;
});

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

/** Use at the top of every admin page, layout and server action. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(ADMIN_SESSION_COOKIE);
}
