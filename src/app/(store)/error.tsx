"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { t } from "@/i18n";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<AlertIcon size={26} />}
        title={t.errors.title}
        description={t.errors.text}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>{t.common.retry}</Button>
            <ButtonLink href="/" variant="outline">
              {t.common.backHome}
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
