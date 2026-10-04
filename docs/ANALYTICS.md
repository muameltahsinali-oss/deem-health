# Analytics — calculation rules

All figures are computed from database rows at request time (`src/server/analytics.ts`, pure rules in
`src/features/analytics/calc.ts`, unit-tested in `tests/unit/analytics.test.ts`). Nothing is estimated or faked.

## Time
- Ranges are **Baghdad calendar days** (UTC+3, no DST). "Last 7 days" = today + the 6 previous days.
- Every KPI is compared with the **previous period of equal length** immediately before the range.

## Definitions
| Metric | Rule |
|---|---|
| Qualifying order | `status ≠ CANCELLED` (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED) and `createdAt` in range |
| **Revenue** | Σ `order.total` of qualifying orders (after discount, including shipping) — booked revenue |
| Collected revenue | Σ `order.total` of orders with status `DELIVERED` (cash collected on delivery) |
| **Orders** | count of qualifying orders |
| Cancelled | count of `CANCELLED` orders in range (shown with cancellation rate) |
| **AOV** | Revenue ÷ Orders, rounded to whole dinars (0 when there are no orders) |
| **Customers** | distinct `customerId` among qualifying orders |
| New customers | customers whose `firstOrderAt` is in the range; returning = customers − new |
| Sessions | rows in `StoreSession` started in range — one per browser session (30-min inactivity), created by the storefront itself; known bots excluded |
| **Conversion rate** | Orders ÷ Sessions (shown as "—" when there are no sessions) |
| Revenue per session | Revenue ÷ Sessions |
| Top products | Σ `orderItem.lineTotal` / `quantity` of qualifying orders, grouped by product (price at time of sale) |
| Category performance | same, grouped by the category snapshot stored on each order item |
| Order sources | qualifying orders grouped by `utm_source / utm_medium · utm_campaign` stored on the order |

## Dashboard widgets
- Pending orders: all orders currently `PENDING` (not range-bound).
- Low stock: non-archived active products with `stock ≤ lowStockThreshold` (Admin → Settings).
- Recent orders: 6 most recent orders of any status.
