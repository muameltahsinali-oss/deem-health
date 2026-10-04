import { describe, expect, it } from "vitest";
import { dailySeries, percentChange, resolveRange, summarize, type OrderLite } from "@/features/analytics/calc";

const NOW = new Date("2026-09-27T09:00:00Z"); // 12:00 Baghdad

const order = (total: number, status: OrderLite["status"], iso: string, customerId = "c1"): OrderLite => ({
  total,
  status,
  createdAt: new Date(iso),
  customerId,
});

describe("resolveRange", () => {
  it("builds Baghdad-day aligned ranges", () => {
    const r = resolveRange("7d", undefined, undefined, NOW);
    expect(r.key).toBe("7d");
    expect(r.days).toHaveLength(7);
    expect(r.toKey).toBe("2026-09-27");
    expect(r.fromKey).toBe("2026-09-21");
    expect(r.to.toISOString()).toBe("2026-09-27T21:00:00.000Z");
    expect(r.prevTo.getTime()).toBe(r.from.getTime());
    expect(r.to.getTime() - r.from.getTime()).toBe(r.prevTo.getTime() - r.prevFrom.getTime());
  });

  it("handles today and custom ranges", () => {
    expect(resolveRange("today", undefined, undefined, NOW).days).toEqual(["2026-09-27"]);
    const custom = resolveRange("custom", "2026-09-01", "2026-09-10", NOW);
    expect(custom.key).toBe("custom");
    expect(custom.days).toHaveLength(10);
    expect(custom.fromKey).toBe("2026-09-01");
    expect(custom.toKey).toBe("2026-09-10");
  });

  it("falls back to 30 days for invalid input", () => {
    expect(resolveRange("custom", "2026-09-10", "2026-09-01", NOW).key).toBe("30d");
    expect(resolveRange("nonsense", undefined, undefined, NOW).days).toHaveLength(30);
  });
});

describe("summarize", () => {
  const orders = [
    order(50_000, "DELIVERED", "2026-09-25T10:00:00Z", "a"),
    order(30_000, "PENDING", "2026-09-26T10:00:00Z", "b"),
    order(20_000, "SHIPPED", "2026-09-26T11:00:00Z", "a"),
    order(99_000, "CANCELLED", "2026-09-26T12:00:00Z", "c"),
  ];

  it("excludes cancelled orders from revenue, orders, AOV and customers", () => {
    const s = summarize(orders, 200);
    expect(s.revenue).toBe(100_000);
    expect(s.orders).toBe(3);
    expect(s.cancelledOrders).toBe(1);
    expect(s.aov).toBe(33_333);
    expect(s.customers).toBe(2);
    expect(s.collectedRevenue).toBe(50_000);
    expect(s.conversionRate).toBeCloseTo(3 / 200);
  });

  it("returns null conversion without sessions and zero AOV without orders", () => {
    const s = summarize([], 0);
    expect(s.conversionRate).toBeNull();
    expect(s.aov).toBe(0);
  });
});

describe("dailySeries", () => {
  it("buckets by Baghdad day and skips cancelled orders", () => {
    const series = dailySeries(
      [
        order(10_000, "PENDING", "2026-09-25T21:30:00Z"), // 26th 00:30 Baghdad
        order(5_000, "CANCELLED", "2026-09-26T10:00:00Z"),
        order(7_000, "DELIVERED", "2026-09-26T20:00:00Z"),
      ],
      ["2026-09-25", "2026-09-26"],
    );
    expect(series).toEqual([
      { day: "2026-09-25", revenue: 0, orders: 0 },
      { day: "2026-09-26", revenue: 17_000, orders: 2 },
    ]);
  });
});

describe("percentChange", () => {
  it("handles baselines", () => {
    expect(percentChange(150, 100)).toBeCloseTo(0.5);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBeNull();
  });
});
