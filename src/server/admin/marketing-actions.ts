"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { encryptSecret } from "@/server/crypto";
import { invalidateTrackingConfig } from "@/server/tracking/config";
import { verifyCapiConnection } from "@/server/tracking/capi";

export type TrackingFormState = { ok?: boolean; error?: string; message?: string };

const schema = z.object({
  trackingEnabled: z.boolean(),
  metaPixelId: z.union([z.literal(""), z.string().regex(/^\d{8,20}$/, "معرف البكسل أرقام فقط (عادة 15–16 رقماً)")]),
  testEventCode: z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9]{4,30}$/, "رمز الاختبار غير صالح")]),
  capiAccessToken: z.string().trim().max(1000),
  clearToken: z.boolean(),
});

export async function saveTrackingAction(_prev: TrackingFormState, formData: FormData): Promise<TrackingFormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    trackingEnabled: formData.get("trackingEnabled") === "on",
    metaPixelId: String(formData.get("metaPixelId") ?? "").trim(),
    testEventCode: String(formData.get("testEventCode") ?? "").trim(),
    capiAccessToken: String(formData.get("capiAccessToken") ?? ""),
    clearToken: formData.get("clearToken") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  const d = parsed.data;

  const tokenUpdate: { capiAccessTokenEnc?: string | null; capiTokenLast4?: string | null } = {};
  if (d.clearToken) {
    tokenUpdate.capiAccessTokenEnc = null;
    tokenUpdate.capiTokenLast4 = null;
  } else if (d.capiAccessToken) {
    if (d.capiAccessToken.length < 20) return { error: "رمز Conversions API قصير جداً — تأكد من نسخه كاملاً." };
    if (!env.encryptionKey) {
      return { error: "لا يمكن حفظ الرمز: متغير APP_ENCRYPTION_KEY غير مضبوط على الخادم. أضفه ثم أعد المحاولة (أو ضع الرمز في META_CAPI_ACCESS_TOKEN)." };
    }
    try {
      tokenUpdate.capiAccessTokenEnc = encryptSecret(d.capiAccessToken, env.encryptionKey);
      tokenUpdate.capiTokenLast4 = d.capiAccessToken.slice(-4);
    } catch (err) {
      return { error: err instanceof Error ? `تعذّر تشفير الرمز: ${err.message}` : "تعذّر تشفير الرمز" };
    }
  }

  const data = {
    trackingEnabled: d.trackingEnabled,
    metaPixelId: d.metaPixelId || null,
    testEventCode: d.testEventCode || null,
    ...tokenUpdate,
  };
  await db.trackingConfiguration.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  invalidateTrackingConfig();
  revalidatePath("/", "layout");
  revalidatePath("/admin/marketing");
  return { ok: true, message: "تم حفظ إعدادات التتبع" };
}

export async function testCapiConnectionAction(_prev: TrackingFormState): Promise<TrackingFormState> {
  await requireAdmin();
  invalidateTrackingConfig();
  const res = await verifyCapiConnection();
  return res.ok ? { ok: true, message: res.message } : { error: res.message };
}
