import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { t } from "@/i18n";
import { RANGE_KEYS, RANGE_LABELS, type ResolvedRange } from "@/features/analytics/calc";

const ORDER_TONES: Record<string, BadgeTone> = {
  PENDING: "sun",
  CONFIRMED: "lavender",
  PROCESSING: "lavender",
  SHIPPED: "plum",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: keyof typeof t.orderStatus }) {
  return <Badge tone={ORDER_TONES[status] ?? "neutral"}>{t.orderStatus[status]}</Badge>;
}

const PAYMENT_TONES: Record<string, BadgeTone> = { PENDING: "neutral", COD: "warning", PAID: "success", FAILED: "danger" };

export function PaymentStatusBadge({ status }: { status: keyof typeof t.paymentStatus }) {
  return <Badge tone={PAYMENT_TONES[status] ?? "neutral"}>{t.paymentStatus[status]}</Badge>;
}

export function KpiCard({
  label,
  value,
  change,
  hint,
  icon,
  emphasis,
}: {
  label: string;
  value: string;
  change?: number | null;
  hint?: ReactNode;
  icon?: ReactNode;
  emphasis?: boolean;
}) {
  const up = change !== undefined && change !== null && change > 0.0005;
  const down = change !== undefined && change !== null && change < -0.0005;
  return (
    <div className={cn("rounded-xl border p-4 sm:p-5", emphasis ? "border-plum-950 bg-plum-950 text-paper" : "border-line bg-paper")}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-xs sm:text-sm", emphasis ? "text-paper/70" : "text-muted")}>{label}</p>
        {icon && <span className={emphasis ? "text-sun-300" : "text-lavender-600"}>{icon}</span>}
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 font-medium tabular-nums",
              change === null
                ? emphasis
                  ? "bg-paper/10 text-paper/70"
                  : "bg-plum-50 text-subtle"
                : up
                  ? "bg-success-soft text-success"
                  : down
                    ? "bg-danger-soft text-danger"
                    : emphasis
                      ? "bg-paper/10 text-paper/70"
                      : "bg-plum-50 text-subtle",
            )}
            dir="ltr"
          >
            {change === null ? "جديد" : `${up ? "▲" : down ? "▼" : ""} ${formatPercent(Math.abs(change), 0)}`}
          </span>
        )}
        {hint && <span className={emphasis ? "text-paper/60" : "text-subtle"}>{hint}</span>}
      </div>
    </div>
  );
}

export function RangeFilter({ range, basePath }: { range: ResolvedRange; basePath: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1">
        {RANGE_KEYS.filter((k) => k !== "custom").map((k) => (
          <Link
            key={k}
            href={`${basePath}?range=${k}`}
            aria-current={range.key === k ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm",
              range.key === k ? "bg-plum-950 text-paper" : "text-muted hover:text-plum-950",
            )}
          >
            {RANGE_LABELS[k]}
          </Link>
        ))}
      </div>
      <form action={basePath} method="get" className="flex flex-wrap items-center gap-1.5 rounded-full border border-line bg-paper p-1 ps-3 text-xs">
        <input type="hidden" name="range" value="custom" />
        <label htmlFor="range-from" className="text-subtle">
          من
        </label>
        <input id="range-from" name="from" type="date" defaultValue={range.fromKey} className="rounded-md bg-lavender-50 px-2 py-1" required />
        <label htmlFor="range-to" className="text-subtle">
          إلى
        </label>
        <input id="range-to" name="to" type="date" defaultValue={range.toKey} className="rounded-md bg-lavender-50 px-2 py-1" required />
        <button type="submit" className={cn("rounded-full px-3 py-1.5 font-medium", range.key === "custom" ? "bg-plum-950 text-paper" : "bg-lavender-100 text-plum-950")}>
          {RANGE_LABELS.custom}
        </button>
      </form>
    </div>
  );
}
