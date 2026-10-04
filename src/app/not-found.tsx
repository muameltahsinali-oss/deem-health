import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { t } from "@/i18n";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-lavender-100 px-4">
      <div className="text-center">
        <Link href="/" className="inline-block text-plum-950" aria-label={t.common.home}>
          <Logo className="mx-auto h-10 w-auto" />
        </Link>
        <p className="mt-10 text-7xl font-bold text-plum-950 tabular-nums">404</p>
        <h1 className="mt-4 text-2xl font-bold text-plum-950">{t.errors.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.errors.notFoundText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">{t.common.backHome}</ButtonLink>
          <ButtonLink href="/shop" variant="light">
            {t.common.shopNow}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
