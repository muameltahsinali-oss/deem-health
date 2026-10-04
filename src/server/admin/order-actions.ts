"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { addOrderNote, changeOrderStatus, changePaymentStatus, OrderUpdateError } from "@/server/orders/admin-orders";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/features/orders/status";

export type ActionResult = { ok?: boolean; error?: string; message?: string };

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
});

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  // Stock may have changed (cancellation) → storefront availability
  revalidatePath("/", "layout");
}

export async function updateOrderStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: "اختر حالة صحيحة." };
  try {
    await changeOrderStatus(parsed.data.orderId, parsed.data.status, admin.id, parsed.data.note);
  } catch (err) {
    if (err instanceof OrderUpdateError) {
      return { error: err.code === "NOT_FOUND" ? "الطلب غير موجود." : "لا يمكن الانتقال إلى هذه الحالة من الحالة الحالية." };
    }
    throw err;
  }
  refresh(parsed.data.orderId);
  return { ok: true, message: "تم تحديث حالة الطلب" };
}

export async function updatePaymentStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), paymentStatus: z.enum(PAYMENT_STATUSES) })
    .safeParse({ orderId: formData.get("orderId"), paymentStatus: formData.get("paymentStatus") });
  if (!parsed.success) return { error: "اختر حالة دفع صحيحة." };
  try {
    await changePaymentStatus(parsed.data.orderId, parsed.data.paymentStatus, admin.id);
  } catch (err) {
    if (err instanceof OrderUpdateError) return { error: "الطلب غير موجود." };
    throw err;
  }
  refresh(parsed.data.orderId);
  return { ok: true, message: "تم تحديث حالة الدفع" };
}

export async function addOrderNoteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), message: z.string().trim().min(1).max(1000) })
    .safeParse({ orderId: formData.get("orderId"), message: formData.get("message") });
  if (!parsed.success) return { error: "اكتب ملاحظة أولاً." };
  await addOrderNote(parsed.data.orderId, parsed.data.message, admin.id);
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, message: "تمت إضافة الملاحظة" };
}
