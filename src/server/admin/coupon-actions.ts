"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { normalizeCouponCode } from "@/features/pricing/rules";
import { parseBaghdadDayKey, addDays } from "@/lib/dates";

export type CouponFormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

const schema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .transform(normalizeCouponCode)
      .pipe(z.string().min(3, "الكود 3 أحرف على الأقل").max(30).regex(/^[A-Z0-9_-]+$/, "أحرف لاتينية وأرقام فقط")),
    type: z.enum(["FIXED", "PERCENTAGE"]),
    value: z.coerce.number().int("أدخل رقماً صحيحاً").min(1, "القيمة يجب أن تكون أكبر من صفر"),
    minOrderAmount: z.coerce.number().int().min(0).max(100_000_000),
    usageLimit: z.union([z.literal(""), z.coerce.number().int().min(1)]),
    expiresOn: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    active: z.boolean(),
    description: z.string().trim().max(200),
  })
  .refine((v) => v.type !== "PERCENTAGE" || v.value <= 100, { message: "النسبة بين 1 و 100", path: ["value"] });

export async function saveCouponAction(_prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    code: String(formData.get("code") ?? ""),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderAmount: formData.get("minOrderAmount") || 0,
    usageLimit: String(formData.get("usageLimit") ?? ""),
    expiresOn: String(formData.get("expiresOn") ?? ""),
    active: formData.get("active") === "on",
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { error: Object.values(fieldErrors)[0] ?? "يرجى تصحيح الحقول.", fieldErrors };
  }
  const { id, expiresOn, usageLimit, ...rest } = parsed.data;
  const clash = await db.coupon.findFirst({ where: { code: rest.code, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) return { error: "هذا الكود مستخدم مسبقاً." };

  // Valid through the end of the chosen Baghdad day
  const startOfDay = expiresOn ? parseBaghdadDayKey(expiresOn) : null;
  const data = {
    ...rest,
    description: rest.description || null,
    usageLimit: usageLimit === "" ? null : usageLimit,
    expiresAt: startOfDay ? addDays(startOfDay, 1) : null,
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  revalidatePath("/admin/coupons");
  return { ok: true, message: id ? "تم حفظ الكوبون" : "تم إنشاء الكوبون" };
}

export async function toggleCouponAction(_prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const coupon = await db.coupon.findUnique({ where: { id }, select: { active: true } });
  if (!coupon) return { error: "الكوبون غير موجود." };
  await db.coupon.update({ where: { id }, data: { active: !coupon.active } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: coupon.active ? "تم إيقاف الكوبون" : "تم تفعيل الكوبون" };
}

export async function deleteCouponAction(_prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await db.couponUsage.count({ where: { couponId: id } });
  if (used > 0) {
    await db.coupon.update({ where: { id }, data: { active: false } });
    revalidatePath("/admin/coupons");
    return { ok: true, message: "الكوبون مستخدم في طلبات سابقة، لذلك تم إيقافه بدلاً من حذفه" };
  }
  await db.coupon.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/coupons");
  return { ok: true, message: "تم حذف الكوبون" };
}
