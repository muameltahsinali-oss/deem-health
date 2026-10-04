"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EmptyState
      icon={<AlertIcon size={24} />}
      title="حدث خطأ أثناء تحميل الصفحة"
      description={error.digest ? `رمز الخطأ: ${error.digest}` : "حاول مرة أخرى. إذا تكرر الخطأ تحقق من اتصال قاعدة البيانات."}
      action={<Button onClick={reset}>إعادة المحاولة</Button>}
    />
  );
}
