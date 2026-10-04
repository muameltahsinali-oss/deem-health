import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getActiveShippingRates } from "@/server/settings";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.checkout.title,
  robots: { index: false, follow: false },
};

// Shipping fees must always be current
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const governorates = await getActiveShippingRates();
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-plum-950 sm:mb-8 sm:text-3xl">{t.checkout.title}</h1>
      <CheckoutForm governorates={governorates} />
    </div>
  );
}
