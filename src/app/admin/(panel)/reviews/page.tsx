import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { MessageIcon } from "@/components/icons";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Rating } from "@/components/ui/price";
import { moderateReviewAction } from "@/server/admin/review-actions";
import { db } from "@/server/db";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/cn";

export const metadata = { title: "التقييمات" };

const TABS = [
  { key: "PENDING", label: "بانتظار المراجعة" },
  { key: "APPROVED", label: "منشورة" },
  { key: "REJECTED", label: "مرفوضة" },
] as const;

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function ReviewsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = TABS.find((t) => t.key === sp.status)?.key ?? "PENDING";
  const reviews = await db.review.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { id: true, name: true, slug: true } } },
  });

  return (
    <>
      <PageHeader title="التقييمات" description="تقييمات العملاء لا تظهر في المتجر إلا بعد الموافقة عليها." />
      <nav aria-label="حالة التقييم" className="mb-4 flex gap-1.5">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/reviews?status=${tab.key}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              status === tab.key ? "border-plum-950 bg-plum-950 text-paper" : "border-line bg-paper text-muted hover:text-plum-950",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <EmptyState icon={<MessageIcon size={24} />} title="لا توجد تقييمات هنا" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.authorName}</span>
                  <Rating value={r.rating} showCount={false} size={13} />
                </div>
                <span className="text-xs text-subtle">{formatDateTime(r.createdAt)}</span>
              </div>
              <Link href={`/admin/products/${r.product.id}`} className="mt-1 block text-xs text-lavender-600 hover:underline">
                {r.product.name}
              </Link>
              <p className="mt-3 text-sm leading-7 text-muted">{r.comment}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {r.status !== "APPROVED" && (
                  <ActionForm action={moderateReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="APPROVED" />
                    <SubmitButton size="sm">نشر</SubmitButton>
                  </ActionForm>
                )}
                {r.status !== "REJECTED" && (
                  <ActionForm action={moderateReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <SubmitButton size="sm" variant="secondary">
                      {r.status === "APPROVED" ? "إخفاء" : "رفض"}
                    </SubmitButton>
                  </ActionForm>
                )}
                <ActionForm action={moderateReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <SubmitButton size="sm" variant="danger-ghost">
                    حذف
                  </SubmitButton>
                </ActionForm>
                {r.status === "APPROVED" && <Badge tone="success">منشور</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
