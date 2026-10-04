"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { createAdminSession, destroyAdminSession } from "@/server/auth";
import { verifyPassword, hashPassword } from "@/server/crypto";
import { rateLimit } from "@/server/rate-limit";
import { getRequestMeta } from "@/server/request";

export type LoginState = { error?: string; email?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
  next: z.string().max(300).optional(),
});

// Precomputed lazily; used to keep timing similar when the email does not exist
let dummyHash: Promise<string> | null = null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const emailRaw = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور.", email: emailRaw };

  const meta = await getRequestMeta();
  const ipKey = meta.ip ?? "unknown";
  const limitIp = rateLimit(`login-ip:${ipKey}`, 20, 15 * 60_000);
  const limitAccount = rateLimit(`login-acct:${parsed.data.email}`, 8, 15 * 60_000);
  if (!limitIp.ok || !limitAccount.ok) {
    return { error: "محاولات كثيرة. انتظر بضع دقائق ثم حاول مجدداً.", email: emailRaw };
  }

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  let valid = false;
  if (admin) {
    valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  } else {
    dummyHash ??= hashPassword("timing-equaliser-not-a-password");
    await verifyPassword(parsed.data.password, await dummyHash);
  }
  if (!admin || !valid) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", email: emailRaw };

  await createAdminSession(admin.id, meta);
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const next = parsed.data.next;
  redirect(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/dashboard");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
