import "server-only";
import { db } from "@/server/db";
import { REVENUE_STATUSES } from "@/features/orders/status";
import { dailySeries, summarize, type ResolvedRange } from "@/features/analytics/calc";
import { describeSource } from "@/features/attribution/shared";

const inRange = (r: { from: Date; to: Date }) => ({ gte: r.from, lt: r.to });

async function loadOrders(from: Date, to: Date) {
  return db.order.findMany({
    where: { createdAt: { gte: from, lt: to } },
    select: { total: true, status: true, createdAt: true, customerId: true },
  });
}

/** All analytics are computed from real database rows — see src/features/analytics/calc.ts for rules. */
export async function getAnalytics(range: ResolvedRange) {
  const [orders, prevOrders, sessions, prevSessions] = await Promise.all([
    loadOrders(range.from, range.to),
    loadOrders(range.prevFrom, range.prevTo),
    db.storeSession.count({ where: { startedAt: inRange(range) } }),
    db.storeSession.count({ where: { startedAt: { gte: range.prevFrom, lt: range.prevTo } } }),
  ]);

  const summary = summarize(orders, sessions);
  const previous = summarize(prevOrders, prevSessions);
  const series = dailySeries(orders, range.days);

  const qualifyingItems = { order: { createdAt: inRange(range), status: { in: REVENUE_STATUSES } } };

  const [topProductRows, categoryRows, sourceRows, newCustomers] = await Promise.all([
    db.orderItem.groupBy({
      by: ["productId"],
      where: qualifyingItems,
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    }),
    db.orderItem.groupBy({
      by: ["categoryId"],
      where: qualifyingItems,
      _sum: { quantity: true, lineTotal: true },
    }),
    db.order.groupBy({
      by: ["utmSource", "utmMedium", "utmCampaign"],
      where: { createdAt: inRange(range), status: { in: REVENUE_STATUSES } },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    }),
    db.customer.count({ where: { firstOrderAt: inRange(range) } }),
  ]);

  const productIds = topProductRows.map((r) => r.productId).filter((x): x is string => Boolean(x));
  const categoryIds = categoryRows.map((r) => r.categoryId).filter((x): x is string => Boolean(x));
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true } }),
    db.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }),
  ]);

  const topProducts = topProductRows.map((r) => {
    const p = products.find((x) => x.id === r.productId);
    return {
      productId: r.productId,
      name: p?.name ?? "منتج محذوف",
      sku: p?.sku ?? "—",
      units: r._sum.quantity ?? 0,
      revenue: r._sum.lineTotal ?? 0,
    };
  });

  const categoryPerformance = categoryRows
    .map((r) => ({
      categoryId: r.categoryId,
      name: categories.find((c) => c.id === r.categoryId)?.name ?? "غير مصنف",
      units: r._sum.quantity ?? 0,
      revenue: r._sum.lineTotal ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const sources = sourceRows.map((r) => ({
    label: describeSource({ utmSource: r.utmSource, utmMedium: r.utmMedium, utmCampaign: r.utmCampaign }),
    orders: r._count._all,
    revenue: r._sum.total ?? 0,
  }));

  return {
    summary,
    previous,
    series,
    topProducts,
    categoryPerformance,
    sources,
    newCustomers,
    returningCustomers: Math.max(0, summary.customers - newCustomers),
  };
}

export async function getDashboardExtras(lowStockThreshold: number) {
  const [pendingOrders, lowStock, recentOrders] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.product.findMany({
      where: { status: "ACTIVE", stock: { lte: lowStockThreshold } },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, name: true, sku: true, stock: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, customerName: true, governorateName: true, total: true, status: true, createdAt: true },
    }),
  ]);
  return { pendingOrders, lowStock, recentOrders };
}
