"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";

export type ReviewActionState = { ok?: boolean; error?: string; message?: string };

async function recomputeRating(productId: string) {
  const agg = await db.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const product = await db.product.update({
    where: { id: productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all },
    select: { slug: true },
  });
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/");
}

export async function moderateReviewAction(_prev: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const review = await db.review.findUnique({ where: { id }, select: { productId: true } });
  if (!review) return { error: "التقييم غير موجود." };

  if (decision === "delete") {
    await db.review.delete({ where: { id } });
  } else if (decision === "APPROVED" || decision === "REJECTED") {
    await db.review.update({ where: { id }, data: { status: decision } });
  } else {
    return { error: "إجراء غير معروف." };
  }
  await recomputeRating(review.productId);
  revalidatePath("/admin/reviews");
  const messages: Record<string, string> = { APPROVED: "تم نشر التقييم", REJECTED: "تم رفض التقييم", delete: "تم حذف التقييم" };
  return { ok: true, message: messages[decision] };
}
