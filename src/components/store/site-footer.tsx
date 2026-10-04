import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CashIcon, FacebookIcon, InstagramIcon, PhoneIcon, TruckIcon, WhatsappIcon } from "@/components/icons";
import { t } from "@/i18n";
import type { Settings } from "@/server/settings";
import { whatsappLink } from "@/server/settings";
import { getCurrentYear } from "@/lib/dates";

export function SiteFooter({ categories, settings }: { categories: Array<{ name: string; slug: string }>; settings: Settings }) {
  const wa = whatsappLink(settings.whatsapp);
  const year = getCurrentYear();
  return (
    <footer className="mt-20 bg-plum-950 text-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="h-11 w-auto text-paper" />
          <p className="mt-5 max-w-xs text-sm leading-7 text-paper/80">
            متجر ديم هيلث المعتمد للمكملات الغذائية والفيتامينات الأصلية في العراق. الدفع عند الاستلام بعد المعاينة، وشحن سريع لكافة المحافظات.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-paper/80">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 px-3 py-1.5">
              <CashIcon size={15} className="text-sun-300" /> {t.footer.cod}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 px-3 py-1.5">
              <TruckIcon size={15} className="text-sun-300" /> {t.trust.deliveryTitle}
            </span>
          </div>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="text-sm font-semibold text-sun-300">
            {t.footer.shop}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-paper/75">
            <li>
              <Link href="/shop" className="hover:text-paper">
                {t.nav.allProducts}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-paper">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop?sale=1" className="hover:text-paper">
                {t.nav.offers}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="text-sm font-semibold text-sun-300">
            {t.footer.help}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-paper/75">
            <li>
              <Link href="/#faq" className="hover:text-paper">
                {t.footer.faq}
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-paper">
                {t.cart.title}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-sun-300">{t.footer.contact}</h2>
          <ul className="mt-4 space-y-3 text-sm text-paper/75">
            {settings.contactPhone && (
              <li>
                <a href={`tel:${settings.contactPhone}`} className="inline-flex items-center gap-2 hover:text-paper" dir="ltr">
                  <PhoneIcon size={16} /> {settings.contactPhone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-paper">
                  <WhatsappIcon size={16} /> واتساب
                </a>
              </li>
            )}
            {settings.address && <li>{settings.address}</li>}
          </ul>
          <div className="mt-5 flex gap-2">
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-full border border-paper/15 hover:bg-paper/10"
              >
                <InstagramIcon size={18} />
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid size-10 place-items-center rounded-full border border-paper/15 hover:bg-paper/10"
              >
                <FacebookIcon size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-paper/55 sm:flex-row">
          <p>{t.footer.rights(year)}</p>
          <p dir="ltr" className="tracking-wide">
            Deem <span className="text-sun-300">health</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-plum-950 text-paper">
      <p className="container-page flex h-9 items-center justify-center gap-2 text-center text-xs sm:text-[0.8rem]">
        <span className="inline-block size-1.5 rounded-full bg-sun-300" aria-hidden="true" />
        {text}
      </p>
    </div>
  );
}
