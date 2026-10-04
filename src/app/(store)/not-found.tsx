import { SearchIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { t } from "@/i18n";

/** Shown inside the storefront shell when a product, category or order does not exist. */
export default function StoreNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<SearchIcon size={26} />}
        title={t.errors.notFoundTitle}
        description={t.errors.notFoundText}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop">{t.common.shopNow}</ButtonLink>
            <ButtonLink href="/" variant="outline">
              {t.common.backHome}
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
