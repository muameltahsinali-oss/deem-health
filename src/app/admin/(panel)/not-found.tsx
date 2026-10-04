import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function AdminNotFound() {
  return (
    <EmptyState
      title="العنصر غير موجود"
      description="ربما تم حذفه أو أن الرابط غير صحيح."
      action={<ButtonLink href="/admin/dashboard">العودة للرئيسية</ButtonLink>}
    />
  );
}
