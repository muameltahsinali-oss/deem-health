"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BagIcon, CashIcon, CheckCircleIcon, ShieldIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { CouponForm, SummaryRow } from "@/components/store/cart-view";
import { cartActions, useCart } from "@/features/cart/cart-store";
import { useQuote } from "@/features/cart/use-quote";
import { checkoutFormSchema, type CheckoutFormValues } from "@/features/checkout/schemas";
import { enabledPaymentMethods } from "@/features/checkout/payment-methods";
import { trackEvent } from "@/features/tracking/client";
import { formatIQD } from "@/lib/format";
import { t } from "@/i18n";

type Governorate = { governorateCode: string; name: string; fee: number };

const REMEMBER_KEY = "dh_checkout_contact_v1";

function loadRemembered(): Partial<CheckoutFormValues> {
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormValues>) : {};
  } catch {
    return {};
  }
}

export function CheckoutForm({ governorates }: { governorates: Governorate[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const cart = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const placed = useRef(false);
  const initiated = useRef(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", governorateCode: "", district: "", address: "", notes: "" },
  });
  const { register, handleSubmit, formState, watch, setError, reset } = form;
  const errors = formState.errors;
  const governorateCode = watch("governorateCode");

  // Prefill returning customers (stored only on this device after a successful order)
  useEffect(() => {
    const saved = loadRemembered();
    if (Object.keys(saved).length) reset({ fullName: "", phone: "", governorateCode: "", district: "", address: "", notes: "", ...saved });
  }, [reset]);

  const { quote, loading, error: quoteError, retry } = useQuote(cart.items, cart.couponCode, governorateCode || null, cart.ready);

  // InitiateCheckout — once, when the checkout opens with items
  useEffect(() => {
    if (!cart.ready || initiated.current || cart.items.length === 0) return;
    initiated.current = true;
    trackEvent({
      name: "InitiateCheckout",
      value: cart.displaySubtotal,
      currency: "IQD",
      contentIds: cart.items.map((i) => i.productId),
      contents: cart.items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.price })),
      numItems: cart.count,
    });
  }, [cart.ready, cart.items, cart.displaySubtotal, cart.count]);

  async function onSubmit(values: CheckoutFormValues) {
    if (submitting || placed.current) return;
    setServerError(null);
    if (quote?.hasIssues) {
      setServerError(t.checkout.stockProblem);
      return;
    }
    setSubmitting(true);
    trackEvent({
      name: "AddPaymentInfo",
      value: quote?.total ?? cart.displaySubtotal,
      currency: "IQD",
      contentIds: cart.items.map((i) => i.productId),
      contentName: "COD",
    });

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: values,
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: cart.couponCode,
          paymentMethod: "COD",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        orderNumber?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (res.status === 201 && data.token) {
        placed.current = true;
        setRedirecting(true);
        try {
          const { fullName, phone, governorateCode: g, district, address } = values;
          window.localStorage.setItem(REMEMBER_KEY, JSON.stringify({ fullName, phone, governorateCode: g, district, address }));
        } catch {
          /* ignore */
        }
        router.replace(`/order-success/${data.token}`);
        cartActions.clear();
        return;
      }

      if (res.status === 422 && data.fieldErrors) {
        for (const [path, message] of Object.entries(data.fieldErrors)) {
          const field = path.replace(/^customer\./, "") as keyof CheckoutFormValues;
          if (field in checkoutFormSchema.shape) setError(field, { message });
        }
        setServerError(t.checkout.fixErrors);
      } else if (data.error === "STOCK") {
        setServerError(t.checkout.stockProblem);
        retry();
      } else if (data.error === "NOT_DELIVERABLE") {
        setError("governorateCode", { message: t.checkout.notDeliverable });
      } else if (data.error === "COUPON") {
        setServerError(t.coupon.NOT_FOUND);
        retry();
      } else if (res.status === 429) {
        setServerError(t.errors.rateLimited);
      } else {
        setServerError(t.checkout.failed);
      }
      toast(t.checkout.failed, { tone: "error" });
    } catch {
      setServerError(t.checkout.failed);
      toast(t.checkout.failed, { tone: "error" });
    } finally {
      if (!placed.current) setSubmitting(false);
    }
  }

  if (!cart.ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <Skeleton className="h-[32rem] rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="grid min-h-80 place-items-center rounded-xl border border-line bg-paper p-10 text-center">
        <div>
          <CheckCircleIcon size={40} className="mx-auto text-success" />
          <p className="mt-4 font-medium text-plum-950">{t.success.title}</p>
          <p className="mt-1 text-sm text-muted">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<BagIcon size={26} />}
        title={t.cart.empty}
        description={t.checkout.emptyCart}
        action={<ButtonLink href="/shop">{t.cart.continueShopping}</ButtonLink>}
      />
    );
  }

  const selectedGov = governorates.find((g) => g.governorateCode === governorateCode);
  const payment = enabledPaymentMethods()[0];
  const describedBy = (name: keyof CheckoutFormValues, hint = false) =>
    errors[name] ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <section aria-labelledby="contact-title" className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <h2 id="contact-title" className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-plum-950">
            <span className="grid size-7 place-items-center rounded-full bg-plum-950 text-xs text-paper">1</span>
            {t.checkout.contact}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="fullName" label={t.checkout.fullName} error={errors.fullName?.message}>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder={t.checkout.fullNamePh}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={describedBy("fullName")}
                {...register("fullName")}
              />
            </Field>
            <Field id="phone" label={t.checkout.phone} error={errors.phone?.message} hint={t.checkout.phoneHint}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder={t.checkout.phonePh}
                className="text-end"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy("phone", true)}
                {...register("phone")}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="delivery-title" className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <h2 id="delivery-title" className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-plum-950">
            <span className="grid size-7 place-items-center rounded-full bg-plum-950 text-xs text-paper">2</span>
            {t.checkout.delivery}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="governorateCode"
              label={t.checkout.governorate}
              error={errors.governorateCode?.message}
              hint={selectedGov ? `${t.cart.shipping}: ${selectedGov.fee === 0 ? t.common.free : formatIQD(selectedGov.fee)}` : undefined}
            >
              <Select
                id="governorateCode"
                aria-invalid={Boolean(errors.governorateCode)}
                aria-describedby={describedBy("governorateCode", Boolean(selectedGov))}
                {...register("governorateCode")}
              >
                <option value="">{t.checkout.chooseGovernorate}</option>
                {governorates.map((g) => (
                  <option key={g.governorateCode} value={g.governorateCode}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="district" label={t.checkout.district} error={errors.district?.message}>
              <Input
                id="district"
                autoComplete="address-level2"
                placeholder={t.checkout.districtPh}
                aria-invalid={Boolean(errors.district)}
                aria-describedby={describedBy("district")}
                {...register("district")}
              />
            </Field>
            <Field id="address" label={t.checkout.address} error={errors.address?.message} className="sm:col-span-2">
              <Textarea
                id="address"
                rows={2}
                autoComplete="street-address"
                placeholder={t.checkout.addressPh}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={describedBy("address")}
                {...register("address")}
              />
            </Field>
            <Field id="notes" label={t.checkout.notes} optional error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="notes" rows={2} placeholder={t.checkout.notesPh} {...register("notes")} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="payment-title" className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <h2 id="payment-title" className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-plum-950">
            <span className="grid size-7 place-items-center rounded-full bg-plum-950 text-xs text-paper">3</span>
            {t.checkout.payment}
          </h2>
          <div role="radiogroup" aria-labelledby="payment-title">
            <div
              role="radio"
              aria-checked="true"
              tabIndex={0}
              className="flex items-center gap-4 rounded-lg border-2 border-plum-950 bg-lavender-50 p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sun-300 text-plum-950">
                <CashIcon size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-medium text-plum-950">{payment?.label ?? t.checkout.cod}</span>
                <span className="block text-sm text-muted">{payment?.description ?? t.checkout.codText}</span>
              </span>
              <CheckCircleIcon size={22} className="text-plum-950" />
            </div>
          </div>
        </section>
      </div>

      <aside aria-labelledby="order-summary" className="space-y-5 rounded-xl border border-line bg-paper p-5 lg:sticky lg:top-28">
        <h2 id="order-summary" className="text-lg font-semibold text-plum-950">
          {t.cart.summary} <span className="text-sm font-normal text-subtle">({t.cart.items(cart.count)})</span>
        </h2>
        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {cart.items.map((item) => {
            const line = quote?.lines.find((l) => l.productId === item.productId);
            return (
              <li key={item.productId} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-lavender-50">
                  {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -top-1 -end-1 grid size-5 place-items-center rounded-full bg-plum-950 text-[0.65rem] text-paper">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm text-plum-950">{item.name}</span>
                  {line?.issue && <span className="block text-xs text-danger">{t.cart.itemUnavailable}</span>}
                </span>
                <span className="text-sm font-medium tabular-nums">{formatIQD((line?.unitPrice ?? item.price) * item.quantity)}</span>
              </li>
            );
          })}
        </ul>

        <CouponForm couponCode={cart.couponCode} quote={quote} />

        {quoteError ? (
          <Alert tone="danger">
            {t.errors.title}{" "}
            <button type="button" className="underline" onClick={retry}>
              {t.common.retry}
            </button>
          </Alert>
        ) : !quote || loading ? (
          <div className="space-y-3 border-t border-line pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <dl className="space-y-3 border-t border-line pt-4">
            <SummaryRow label={t.cart.subtotal} value={formatIQD(quote.subtotal)} />
            {quote.discount > 0 && <SummaryRow label={t.cart.discount} value={`− ${formatIQD(quote.discount)}`} tone="success" />}
            <SummaryRow
              label={t.cart.shipping}
              value={quote.shipping === null ? t.cart.shippingAtCheckout : quote.shipping === 0 ? t.common.free : formatIQD(quote.shipping)}
              tone={quote.shipping === 0 ? "success" : undefined}
            />
            <SummaryRow label={t.checkout.payment} value={t.checkout.cod} />
            <div className="border-t border-line pt-3">
              <SummaryRow label={t.cart.total} value={formatIQD(quote.total)} strong />
            </div>
          </dl>
        )}

        {serverError && <Alert tone="danger">{serverError}</Alert>}
        {quote?.governorate && !quote.governorate.deliverable && <Alert tone="warning">{t.checkout.notDeliverable}</Alert>}

        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={Boolean(quote?.hasIssues)}>
          {submitting ? t.checkout.placing : `${t.checkout.placeOrder}${quote && quote.shipping !== null ? ` · ${formatIQD(quote.total)}` : ""}`}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-subtle">
          <ShieldIcon size={14} /> {t.checkout.secure}
        </p>
      </aside>
    </form>
  );
}
