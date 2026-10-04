import { Skeleton } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ التحميل…</span>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 rounded-xl" />
    </div>
  );
}
