import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/admin-ui";
import { PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Select, Textarea } from "@/components/ui/input";
import { SummaryRow } from "@/components/store/cart-view";
import { addOrderNoteAction, updateOrderStatusAction, updatePaymentStatusAction } from "@/server/admin/order-actions";
import { allowedNextStatuses, PAYMENT_STATUSES } from "@/features/orders/status";
import { describeSource } from "@/features/attribution/shared";
import { db } from "@/server/db";
import { whatsappLink } from "@/server/settings";
import { formatIQD, formatNumber } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/i18n";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: o ? `طلب ${o.orderNumber}` : "طلب غير موجود" };
}

const EVENT_LABELS: Record<string, string> = {
  CREATED: "إنشاء الطلب",
  STATUS_CHANGED: "تغيير الحالة",
  PAYMENT_CHANGED: "تغيير حالة الدفع",
  NOTE: "ملاحظة داخلية",
  STOCK_RESTORED: "إرجاع المخزون",
  STOCK_RESERVED: "حجز المخزون",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { id: true, _count: { select: { orders: true } } } },
      events: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } },
    },
  });
  if (!order) notFound();

  const next = allowedNextStatuses(order.status);
  const wa = whatsappLink(order.customerPhone, `مرحباً ${order.customerName}، بخصوص طلبك ${order.orderNumber} من ديم هيلث`);
  const statusLabel = (type: string, s: string | null) => {
    if (!s) return "";
    if (type === "PAYMENT_CHANGED") return s in t.paymentStatus ? t.paymentStatus[s as keyof typeof t.paymentStatus] : s;
    return s in t.orderStatus ? t.orderStatus[s as keyof typeof t.orderStatus] : s;
  };
  const hasAttribution = order.utmSource || order.utmCampaign || order.fbclid || order.landingPage;

  return (
    <>
      <PageHeader
        title={`طلب ${order.orderNumber}`}
        description={formatDateTime(order.createdAt)}
        actions={
          <ButtonLink href="/admin/orders" variant="outline" size="sm">
            → كل الطلبات
          </ButtonLink>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <span className="text-sm text-muted">· {t.checkout.cod}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="المنتجات" description={`${formatNumber(order.items.reduce((n, i) => n + i.quantity, 0))} قطعة`} />
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-lavender-50">
                    {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`} className="font-medium text-plum-950 hover:underline">
                        {item.productName}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.productName}</span>
                    )}
                    <p className="text-xs text-subtle" dir="ltr">
                      {item.sku}
                    </p>
                  </div>
                  <span className="text-sm text-muted tabular-nums">
                    {formatIQD(item.unitPrice)} × {item.quantity}
                  </span>
                  <span className="w-28 text-end font-medium tabular-nums">{formatIQD(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-line px-5 py-4">
              <SummaryRow label="المجموع الفرعي" value={formatIQD(order.subtotal)} />
              {order.discountTotal > 0 && <SummaryRow label={`الخصم${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${formatIQD(order.discountTotal)}`} tone="success" />}
              <SummaryRow label={`التوصيل (${order.governorateName})`} value={order.shippingFee === 0 ? "مجاني" : formatIQD(order.shippingFee)} />
              <div className="border-t border-line pt-2.5">
                <SummaryRow label="المبلغ المطلوب تحصيله" value={formatIQD(order.total)} strong />
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="سجل الطلب" description="كل التغييرات والملاحظات الداخلية" />
            <div className="p-5">
              <ActionForm action={addOrderNoteAction} resetOnSuccess className="mb-6">
                <input type="hidden" name="orderId" value={order.id} />
                <label htmlFor="note" className="sr-only">
                  ملاحظة داخلية
                </label>
                <Textarea id="note" name="message" rows={2} placeholder="أضف ملاحظة داخلية (لا تظهر للعميل)…" required maxLength={1000} />
                <div className="mt-2 flex justify-end">
                  <SubmitButton size="sm" variant="secondary">
                    إضافة ملاحظة
                  </SubmitButton>
                </div>
              </ActionForm>
              <ol className="relative space-y-5 border-s border-line ps-5">
                {order.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -start-[1.6rem] top-1 size-2.5 rounded-full border-2 border-paper bg-plum-600" aria-hidden="true" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-plum-950">
                        {EVENT_LABELS[e.type] ?? e.type}
                        {e.toStatus && (
                          <span className="font-normal text-muted">
                            {" "}
                            {e.fromStatus ? `${statusLabel(e.type, e.fromStatus)} ← ` : ""}
                            {statusLabel(e.type, e.toStatus)}
                          </span>
                        )}
                      </p>
                      <time className="text-xs text-subtle" dateTime={e.createdAt.toISOString()}>
                        {formatDateTime(e.createdAt)}
                      </time>
                    </div>
                    {e.message && <p className={`mt-1 text-sm leading-6 ${e.type === "NOTE" ? "rounded-lg bg-sun-50 p-2.5 text-plum-950" : "text-muted"}`}>{e.message}</p>}
                    {e.admin && <p className="mt-0.5 text-xs text-subtle">بواسطة {e.admin.name || e.admin.email}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="تحديث الحالة" />
            <div className="space-y-5 p-5">
              {next.length === 0 ? (
                <p className="text-sm text-muted">هذا الطلب في حالته النهائية ({t.orderStatus[order.status]}).</p>
              ) : (
                <ActionForm action={updateOrderStatusAction} className="space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <label htmlFor="status" className="text-sm font-medium">
                    الحالة الجديدة
                  </label>
                  <Select id="status" name="status" defaultValue={next[0]}>
                    {next.map((s) => (
                      <option key={s} value={s}>
                        {t.orderStatus[s]}
                      </option>
                    ))}
                  </Select>
                  <Textarea name="note" rows={2} placeholder="ملاحظة (اختياري) — مثل: تم التأكيد هاتفياً" maxLength={500} aria-label="ملاحظة" />
                  {next.includes("CANCELLED") && (
                    <p className="text-xs leading-5 text-subtle">عند الإلغاء تُعاد الكميات إلى المخزون تلقائياً ويُحرَّر كود الخصم.</p>
                  )}
                  <SubmitButton className="w-full">تحديث الحالة</SubmitButton>
                </ActionForm>
              )}
              <ActionForm action={updatePaymentStatusAction} className="space-y-3 border-t border-line pt-5">
                <input type="hidden" name="orderId" value={order.id} />
                <label htmlFor="paymentStatus" className="text-sm font-medium">
                  حالة الدفع
                </label>
                <div className="flex gap-2">
                  <Select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus} className="flex-1">
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t.paymentStatus[s]}
                      </option>
                    ))}
                  </Select>
                  <SubmitButton variant="secondary">حفظ</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="العميل"
              action={
                <ButtonLink href={`/admin/customers/${order.customer.id}`} variant="ghost" size="sm">
                  الملف ({order.customer._count.orders} طلب)
                </ButtonLink>
              }
            />
            <div className="space-y-3 p-5 text-sm">
              <p className="font-medium text-plum-950">{order.customerName}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1.5 text-plum-950" dir="ltr">
                  <PhoneIcon size={15} /> {order.customerPhone}
                </a>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-success">
                    <WhatsappIcon size={15} /> واتساب
                  </a>
                )}
              </div>
              <p className="flex items-start gap-2 leading-6 text-muted">
                <PinIcon size={16} className="mt-1 shrink-0" />
                <span>
                  {order.governorateName} — {order.district}
                  <br />
                  {order.address}
                </span>
              </p>
              {order.notes && <p className="rounded-lg bg-sun-50 p-3 leading-6 text-plum-950">ملاحظة العميل: {order.notes}</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="مصدر الطلب" />
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-subtle">المصدر</dt>
                <dd className="text-end font-medium">{describeSource(order)}</dd>
              </div>
              {hasAttribution && (
                <>
                  {[
                    ["utm_source", order.utmSource],
                    ["utm_medium", order.utmMedium],
                    ["utm_campaign", order.utmCampaign],
                    ["utm_content", order.utmContent],
                    ["utm_term", order.utmTerm],
                    ["fbclid", order.fbclid ? `${order.fbclid.slice(0, 16)}…` : null],
                    ["صفحة الدخول", order.landingPage],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-subtle" dir="ltr">
                          {k}
                        </dt>
                        <dd className="truncate text-end" dir="ltr">
                          {v}
                        </dd>
                      </div>
                    ))}
                </>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
