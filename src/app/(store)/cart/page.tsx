import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.cart.title,
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-plum-950 sm:mb-8 sm:text-3xl">{t.cart.title}</h1>
      <CartView />
    </div>
  );
}
