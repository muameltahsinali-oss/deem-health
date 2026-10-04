/**
 * Pure analytics calculations — documented in docs/ANALYTICS.md and unit tested.
 *
 *  Qualifying order  = status ≠ CANCELLED (PENDING … DELIVERED), created inside the range.
 *  Revenue           = Σ total of qualifying orders (booked revenue, incl. shipping, after discounts).
 *  Collected revenue = Σ total of DELIVERED orders created inside the range.
 *  Orders            = count of qualifying orders.
 *  AOV               = Revenue / Orders (0 when there are no orders).
 *  Customers         = distinct customers with ≥1 qualifying order in the range.
 *  Conversion rate   = Orders / first-party sessions started in the range (null if no sessions).
 */
import { addDays, baghdadDayKey, eachBaghdadDay, parseBaghdadDayKey, startOfBaghdadDay } from "@/lib/dates";
import { isRevenueStatus, type OrderStatusValue } from "@/features/orders/status";

export const RANGE_KEYS = ["today", "7d", "30d", "90d", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "اليوم",
  "7d": "آخر 7 أيام",
  "30d": "آخر 30 يوماً",
  "90d": "آخر 90 يوماً",
  custom: "مخصص",
};

export type ResolvedRange = {
  key: RangeKey;
  from: Date; // inclusive
  to: Date; // exclusive
  prevFrom: Date;
  prevTo: Date;
  days: string[];
  fromKey: string;
  toKey: string; // inclusive last day
};

export function resolveRange(key: string | undefined, fromParam?: string, toParam?: string, now: Date = new Date()): ResolvedRange {
  const today = startOfBaghdadDay(now);
  const tomorrow = addDays(today, 1);
  let rangeKey: RangeKey = (RANGE_KEYS as readonly string[]).includes(key ?? "") ? (key as RangeKey) : "30d";
  let from: Date;
  let to: Date = tomorrow;

  if (rangeKey === "custom") {
    const f = fromParam ? parseBaghdadDayKey(fromParam) : null;
    const t = toParam ? parseBaghdadDayKey(toParam) : null;
    if (f && t && f <= t && (t.getTime() - f.getTime()) / 86_400_000 <= 366) {
      from = f;
      to = addDays(t, 1);
    } else {
      rangeKey = "30d";
      from = addDays(tomorrow, -30);
    }
  } else {
    const days = rangeKey === "today" ? 1 : rangeKey === "7d" ? 7 : rangeKey === "90d" ? 90 : 30;
    from = addDays(tomorrow, -days);
  }

  const length = to.getTime() - from.getTime();
  return {
    key: rangeKey,
    from,
    to,
    prevFrom: new Date(from.getTime() - length),
    prevTo: from,
    days: eachBaghdadDay(from, to),
    fromKey: baghdadDayKey(from),
    toKey: baghdadDayKey(addDays(to, -1)),
  };
}

export type OrderLite = {
  total: number;
  status: OrderStatusValue;
  createdAt: Date;
  customerId: string;
};

export type Summary = {
  revenue: number;
  collectedRevenue: number;
  orders: number;
  cancelledOrders: number;
  aov: number;
  customers: number;
  sessions: number;
  conversionRate: number | null;
};

export function summarize(orders: OrderLite[], sessions: number): Summary {
  const qualifying = orders.filter((o) => isRevenueStatus(o.status));
  const revenue = qualifying.reduce((s, o) => s + o.total, 0);
  const collectedRevenue = orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);
  const customers = new Set(qualifying.map((o) => o.customerId)).size;
  return {
    revenue,
    collectedRevenue,
    orders: qualifying.length,
    cancelledOrders: orders.length - qualifying.length,
    aov: qualifying.length ? Math.round(revenue / qualifying.length) : 0,
    customers,
    sessions,
    conversionRate: sessions > 0 ? qualifying.length / sessions : null,
  };
}

export type DailyPoint = { day: string; revenue: number; orders: number };

export function dailySeries(orders: OrderLite[], dayKeys: string[]): DailyPoint[] {
  const map = new Map<string, DailyPoint>(dayKeys.map((d) => [d, { day: d, revenue: 0, orders: 0 }]));
  for (const o of orders) {
    if (!isRevenueStatus(o.status)) continue;
    const point = map.get(baghdadDayKey(o.createdAt));
    if (!point) continue;
    point.revenue += o.total;
    point.orders += 1;
  }
  return [...map.values()];
}

/** Relative change; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}
