import { Skeleton } from "@/components/ui/spinner";

export default function StoreLoading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ التحميل…</span>
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line bg-paper">
            <Skeleton className="aspect-square rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
