import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CashIcon, CheckCircleIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { SummaryRow } from "@/components/store/cart-view";
import { PurchaseTracker } from "@/components/tracking/purchase-tracker";
import { db } from "@/server/db";
import { formatIQD } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.success.title,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

export default async function OrderSuccessPage({ params }: PageProps) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();

  const order = await db.order.findUnique({
    where: { accessToken: token },
    include: { items: true },
  });
  if (!order) notFound();

  const contents = order.items.map((i) => ({ id: i.productId ?? i.sku, quantity: i.quantity, item_price: i.unitPrice }));

  return (
    <div className="container-page max-w-3xl py-8 sm:py-14">
      <div className="rounded-2xl bg-lavender-100 p-6 text-center sm:p-10">
        <CheckCircleIcon size={52} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-bold text-plum-950 sm:text-3xl">{t.success.title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-plum-900 sm:text-base">{t.success.text}</p>
        <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-xl bg-paper px-6 py-4 shadow-soft">
          <span className="text-xs text-subtle">{t.success.orderNumber}</span>
          <span className="mt-1 text-xl font-bold tracking-wide text-plum-950 tabular-nums" dir="ltr">
            {order.orderNumber}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted">{t.success.keepNumber}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs text-subtle">{t.success.status}</p>
          <Badge tone="lavender" className="mt-2">
            {t.orderStatus[order.status]}
          </Badge>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs text-subtle">{t.success.payment}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-plum-950">
            <CashIcon size={18} /> {t.checkout.cod}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs text-subtle">التاريخ</p>
          <p className="mt-2 text-sm font-medium text-plum-950">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="text-sm font-semibold text-plum-950">{t.success.customer}</h2>
          <p className="mt-3 text-sm text-plum-950">{order.customerName}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted" dir="ltr">
            <PhoneIcon size={15} /> {order.customerPhone}
          </p>
        </section>
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="text-sm font-semibold text-plum-950">{t.success.delivery}</h2>
          <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
            <PinIcon size={16} className="mt-1 shrink-0" />
            <span>
              {order.governorateName} — {order.district}
              <br />
              {order.address}
            </span>
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold text-plum-950">{t.success.items}</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-lavender-50">
                {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="flex-1 text-sm text-plum-950">
                {item.productName} <span className="text-subtle">× {item.quantity}</span>
              </span>
              <span className="text-sm font-medium tabular-nums">{formatIQD(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-3 border-t border-line pt-4">
          <SummaryRow label={t.cart.subtotal} value={formatIQD(order.subtotal)} />
          {order.discountTotal > 0 && (
            <SummaryRow label={`${t.cart.discount}${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${formatIQD(order.discountTotal)}`} tone="success" />
          )}
          <SummaryRow label={t.cart.shipping} value={order.shippingFee === 0 ? t.common.free : formatIQD(order.shippingFee)} />
          <div className="border-t border-line pt-3">
            <SummaryRow label={`${t.cart.total} — ${t.checkout.cod}`} value={formatIQD(order.total)} strong />
          </div>
        </dl>
      </section>

      <div className="mt-8 text-center">
        <ButtonLink href="/shop" size="lg">
          {t.cart.continueShopping}
        </ButtonLink>
      </div>

      <PurchaseTracker
        orderNumber={order.orderNumber}
        eventId={order.purchaseEventId}
        value={order.total}
        currency={order.currency}
        contents={contents}
      />
    </div>
  );
}
