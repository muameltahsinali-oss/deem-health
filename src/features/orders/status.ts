export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "COD", "PAID", "FAILED"] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

/**
 * Allowed status transitions. Kept permissive enough for a small team
 * (e.g. an order can be cancelled up until delivery) but prevents nonsense
 * like re-opening a delivered order as pending.
 */
const TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED", "PENDING"],
  PROCESSING: ["SHIPPED", "CANCELLED", "CONFIRMED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedNextStatuses(from: OrderStatusValue): OrderStatusValue[] {
  return TRANSITIONS[from];
}

export function canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Orders counted towards revenue & order KPIs. Documented in docs/ANALYTICS.md. */
export const REVENUE_STATUSES: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export function isRevenueStatus(status: OrderStatusValue): boolean {
  return REVENUE_STATUSES.includes(status);
}
