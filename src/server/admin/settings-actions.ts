"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";

export type SettingsFormState = { ok?: boolean; error?: string; message?: string };

const optionalText = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "الرابط يجب أن يبدأ بـ https://")
  .transform((v) => v || null);
const optionalInt = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+$/.test(v), "أدخل رقماً صحيحاً")
  .transform((v) => (v === "" ? null : Number(v)));

const storeSchema = z.object({
  storeName: z.string().trim().min(2).max(60),
  contactPhone: optionalText(30),
  whatsapp: optionalText(30),
  contactEmail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "بريد إلكتروني غير صالح")
    .transform((v) => v || null),
  address: optionalText(200),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
  freeShippingThreshold: optionalInt,
  maxQuantityPerItem: z.coerce.number().int().min(1).max(100),
  announcementEnabled: z.boolean(),
  announcementText: optionalText(160),
});

export async function saveStoreSettingsAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? "");
  const parsed = storeSchema.safeParse({
    storeName: get("storeName"),
    contactPhone: get("contactPhone"),
    whatsapp: get("whatsapp"),
    contactEmail: get("contactEmail"),
    address: get("address"),
    instagramUrl: get("instagramUrl"),
    facebookUrl: get("facebookUrl"),
    lowStockThreshold: get("lowStockThreshold") || "5",
    freeShippingThreshold: get("freeShippingThreshold"),
    maxQuantityPerItem: get("maxQuantityPerItem") || "10",
    announcementEnabled: formData.get("announcementEnabled") === "on",
    announcementText: get("announcementText"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  await db.storeSettings.upsert({ where: { id: 1 }, create: { id: 1, ...parsed.data }, update: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "تم حفظ الإعدادات" };
}

export async function saveShippingRatesAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();
  const rates = await db.shippingRate.findMany({ select: { id: true, name: true } });
  const updates: Array<{ id: string; fee: number; active: boolean }> = [];
  for (const r of rates) {
    const raw = String(formData.get(`fee_${r.id}`) ?? "").trim();
    if (!/^\d+$/.test(raw) || Number(raw) > 1_000_000) return { error: `أجرة التوصيل لـ ${r.name} غير صالحة` };
    updates.push({ id: r.id, fee: Number(raw), active: formData.get(`active_${r.id}`) === "on" });
  }
  if (!updates.some((u) => u.active)) return { error: "يجب تفعيل محافظة واحدة على الأقل." };
  await db.$transaction(updates.map((u) => db.shippingRate.update({ where: { id: u.id }, data: { fee: u.fee, active: u.active } })));
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true, message: "تم حفظ أجور التوصيل" };
}
