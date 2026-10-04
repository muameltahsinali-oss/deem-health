"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertIcon, BagIcon, TagIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/primitives";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cartActions, useCart } from "@/features/cart/cart-store";
import { useQuote } from "@/features/cart/use-quote";
import type { ClientQuote } from "@/features/checkout/quote-types";
import { formatIQD } from "@/lib/format";
import { t } from "@/i18n";

export function couponErrorMessage(quote: ClientQuote | null): string | null {
  const c = quote?.coupon;
  if (!c || c.applied) return null;
  if (c.error === "MIN_ORDER_NOT_MET") return t.coupon.MIN_ORDER_NOT_MET(formatIQD(c.minOrderAmount ?? 0));
  return t.coupon[c.error];
}

export function CouponForm({ couponCode, quote }: { couponCode: string | null; quote: ClientQuote | null }) {
  const [value, setValue] = useState("");
  const { toast } = useToast();
  const applied = quote?.coupon?.applied ? quote.coupon : null;
  const error = couponErrorMessage(quote);
  const pending = useRef<string | null>(null);

  // "Coupon applied" feedback only right after the customer submits a code
  useEffect(() => {
    if (applied && pending.current === applied.code) {
      pending.current = null;
      toast(t.cart.couponApplied);
    }
  }, [applied, toast]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = value.trim();
    if (!code) return;
    pending.current = code.toUpperCase().replace(/\s+/g, "");
    cartActions.setCoupon(pending.current);
    setValue("");
  }

  if (couponCode && applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-success-soft px-3.5 py-2.5 text-sm text-success">
        <span className="flex items-center gap-2 font-medium" dir="ltr">
          <TagIcon size={16} /> {applied.code}
        </span>
        <button
          type="button"
          onClick={() => {
            cartActions.setCoupon(null);
            toast(t.cart.removeCoupon, { tone: "info" });
          }}
          className="text-xs underline"
        >
          {t.cart.removeCoupon}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label htmlFor="coupon" className="text-sm font-medium text-plum-950">
        {t.cart.coupon}
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.cart.couponPlaceholder}
          dir="ltr"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-paper px-4 text-sm uppercase placeholder:normal-case focus:border-plum-950 focus:outline-none focus:ring-2 focus:ring-lavender-300"
          aria-invalid={Boolean(couponCode && error)}
          aria-describedby={couponCode && error ? "coupon-error" : undefined}
        />
        <Button type="submit" variant="secondary" disabled={!value.trim()}>
          {t.cart.applyCoupon}
        </Button>
      </div>
      {couponCode && error && (
        <p id="coupon-error" role="alert" className="flex items-center justify-between gap-2 text-sm text-danger">
          <span>
            {error} <span dir="ltr">({couponCode})</span>
          </span>
          <button type="button" className="text-xs underline" onClick={() => cartActions.setCoupon(null)}>
            {t.cart.removeCoupon}
          </button>
        </p>
      )}
    </form>
  );
}

export function SummaryRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "success" }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold text-plum-950" : "text-sm text-muted"}`}>
      <dt>{label}</dt>
      <dd className={`tabular-nums ${tone === "success" ? "text-success" : ""}`}>{value}</dd>
    </div>
  );
}

export function CartView() {
  const cart = useCart();
  const { toast } = useToast();
  const { quote, loading, error, retry } = useQuote(cart.items, cart.couponCode, null, cart.ready);

  if (!cart.ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<BagIcon size={26} />}
        title={t.cart.empty}
        description={t.cart.emptyText}
        action={<ButtonLink href="/shop">{t.cart.continueShopping}</ButtonLink>}
      />
    );
  }

  const lineFor = (productId: string) => quote?.lines.find((l) => l.productId === productId);
  const threshold = quote?.freeShippingThreshold ?? null;
  const afterDiscount = quote ? quote.subtotal - quote.discount : 0;
  const remainingForFree = threshold ? threshold - afterDiscount : null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <section aria-label={t.cart.title}>
        {quote?.hasIssues && (
          <Alert tone="warning" className="mb-4">
            {t.checkout.stockProblem}
          </Alert>
        )}
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {cart.items.map((item) => {
            const line = lineFor(item.productId);
            const unavailable = line?.issue === "UNAVAILABLE";
            const maxQty = line ? Math.max(1, Math.min(line.stock, quote?.maxQuantityPerItem ?? 20)) : 20;
            return (
              <li key={item.productId} className="flex gap-4 p-4 sm:p-5">
                <Link href={`/product/${item.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-lavender-50 sm:size-24">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-plum-950 hover:underline sm:text-base">
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        cartActions.remove(item.productId);
                        toast(t.cart.removed, { tone: "info" });
                      }}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-subtle hover:bg-danger-soft hover:text-danger"
                      aria-label={`${t.cart.remove}: ${item.name}`}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-muted tabular-nums">{formatIQD(line?.unitPrice ?? item.price)}</p>
                  {unavailable ? (
                    <p className="flex items-center gap-1.5 text-sm text-danger">
                      <AlertIcon size={16} /> {t.cart.itemUnavailable}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={maxQty}
                        onChange={(q) => cartActions.setQuantity(item.productId, q)}
                      />
                      <span className="font-semibold text-plum-950 tabular-nums">
                        {formatIQD((line?.unitPrice ?? item.price) * item.quantity)}
                      </span>
                    </div>
                  )}
                  {line?.issue === "QTY_ADJUSTED" && (
                    <p className="flex items-center justify-between gap-2 text-xs text-warning">
                      {t.cart.qtyAdjusted(line.quantity)}
                      <button type="button" className="underline" onClick={() => cartActions.setQuantity(item.productId, line.quantity)}>
                        {t.common.save}
                      </button>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-plum-950 hover:underline">
          ← {t.cart.continueShopping}
        </Link>
      </section>

      <aside aria-labelledby="summary-title" className="space-y-5 rounded-xl border border-line bg-paper p-5 lg:sticky lg:top-28">
        <h2 id="summary-title" className="text-lg font-semibold text-plum-950">
          {t.cart.summary}
        </h2>
        <CouponForm couponCode={cart.couponCode} quote={quote} />
        {error ? (
          <Alert tone="danger">
            {t.errors.title}{" "}
            <button type="button" className="underline" onClick={retry}>
              {t.common.retry}
            </button>
          </Alert>
        ) : !quote || loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <dl className="space-y-3 border-t border-line pt-4">
            <SummaryRow label={t.cart.subtotal} value={formatIQD(quote.subtotal)} />
            {quote.discount > 0 && <SummaryRow label={t.cart.discount} value={`− ${formatIQD(quote.discount)}`} tone="success" />}
            <SummaryRow label={t.cart.shipping} value={t.cart.shippingAtCheckout} />
            <div className="border-t border-line pt-3">
              <SummaryRow label={t.cart.total} value={formatIQD(quote.subtotal - quote.discount)} strong />
            </div>
          </dl>
        )}
        {remainingForFree !== null && quote && (
          <p className="flex items-center gap-2 rounded-lg bg-sun-50 px-3 py-2.5 text-xs text-plum-900">
            <TruckIcon size={16} className="shrink-0" />
            {remainingForFree > 0 ? t.cart.freeShippingHint(formatIQD(remainingForFree)) : t.cart.freeShippingUnlocked}
          </p>
        )}
        <ButtonLink
          href="/checkout"
          size="lg"
          className={`w-full ${quote?.hasIssues ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={quote?.hasIssues || undefined}
        >
          {t.cart.checkout}
        </ButtonLink>
      </aside>
    </div>
  );
}
