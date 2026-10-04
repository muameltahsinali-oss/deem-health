import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard, OrderStatusBadge, RangeFilter } from "@/components/admin/admin-ui";
import { OrdersChart, RankingBars, RevenueChart } from "@/components/admin/charts";
import { AlertIcon, CashIcon, ChartIcon, OrdersIcon, UsersIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { resolveRange, RANGE_LABELS, percentChange } from "@/features/analytics/calc";
import { getAnalytics, getDashboardExtras } from "@/server/analytics";
import { getStoreSettings } from "@/server/settings";
import { formatIQD, formatNumber, formatPercent } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "الرئيسية" };

type PageProps = { searchParams: Promise<{ range?: string; from?: string; to?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const range = resolveRange(sp.range, sp.from, sp.to);
  const settings = await getStoreSettings();
  const [a, extras] = await Promise.all([getAnalytics(range), getDashboardExtras(settings.lowStockThreshold)]);
  const s = a.summary;
  const p = a.previous;

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        description={`${RANGE_LABELS[range.key]} · ${range.fromKey} → ${range.toKey}`}
        actions={<RangeFilter range={range} basePath="/admin/dashboard" />}
      />

      {extras.pendingOrders > 0 && (
        <Link
          href="/admin/orders?status=PENDING"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-sun-300 bg-sun-50 px-4 py-3 text-sm text-plum-950 hover:bg-sun-100"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertIcon size={18} /> لديك {formatNumber(extras.pendingOrders)} طلب بانتظار التأكيد
          </span>
          <span className="text-xs underline">مراجعة الطلبات</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <KpiCard emphasis label="الإيرادات" value={formatIQD(s.revenue)} change={percentChange(s.revenue, p.revenue)} icon={<CashIcon size={18} />} />
        <KpiCard label="الطلبات" value={formatNumber(s.orders)} change={percentChange(s.orders, p.orders)} icon={<OrdersIcon size={18} />} />
        <KpiCard label="متوسط قيمة الطلب" value={formatIQD(s.aov)} change={percentChange(s.aov, p.aov)} />
        <KpiCard label="العملاء" value={formatNumber(s.customers)} change={percentChange(s.customers, p.customers)} icon={<UsersIcon size={18} />} hint={`${formatNumber(a.newCustomers)} جديد`} />
        <KpiCard
          label="معدل التحويل"
          value={s.conversionRate === null ? "—" : formatPercent(s.conversionRate, 2)}
          change={s.conversionRate !== null && p.conversionRate !== null ? percentChange(s.conversionRate, p.conversionRate) : undefined}
          icon={<ChartIcon size={18} />}
          hint={`${formatNumber(s.sessions)} زيارة`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="الإيرادات" description="مجموع الطلبات غير الملغاة يومياً" />
          <div className="p-4">
            <RevenueChart data={a.series} />
          </div>
        </Card>
        <Card>
          <CardHeader title="الطلبات" description="عدد الطلبات غير الملغاة يومياً" />
          <div className="p-4">
            <OrdersChart data={a.series} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="أحدث الطلبات"
            action={
              <ButtonLink href="/admin/orders" variant="ghost" size="sm">
                كل الطلبات
              </ButtonLink>
            }
          />
          {extras.recentOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-subtle">لا توجد طلبات بعد.</p>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>رقم الطلب</Th>
                    <Th>العميل</Th>
                    <Th>المحافظة</Th>
                    <Th>الإجمالي</Th>
                    <Th>الحالة</Th>
                    <Th>التاريخ</Th>
                  </tr>
                </thead>
                <tbody>
                  {extras.recentOrders.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-plum-950 hover:underline" dir="ltr">
                          {o.orderNumber}
                        </Link>
                      </Td>
                      <Td>{o.customerName}</Td>
                      <Td className="text-muted">{o.governorateName}</Td>
                      <Td className="tabular-nums">{formatIQD(o.total)}</Td>
                      <Td>
                        <OrderStatusBadge status={o.status} />
                      </Td>
                      <Td className="text-xs whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="الأكثر مبيعاً" description="حسب الإيرادات في الفترة" />
            <div className="p-5">
              <RankingBars valueLabel="الأكثر مبيعاً" data={a.topProducts.slice(0, 5).map((x) => ({ name: x.name, value: x.revenue, units: x.units }))} />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="مخزون منخفض"
              description={`${formatNumber(settings.lowStockThreshold)} قطع أو أقل`}
              action={
                <ButtonLink href="/admin/inventory" variant="ghost" size="sm">
                  المخزون
                </ButtonLink>
              }
            />
            {extras.lowStock.length === 0 ? (
              <p className="p-6 text-center text-sm text-subtle">كل المنتجات بمخزون جيد.</p>
            ) : (
              <ul className="divide-y divide-line">
                {extras.lowStock.map((prod) => (
                  <li key={prod.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/admin/products/${prod.id}`} className="truncate text-plum-950 hover:underline">
                      {prod.name}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${prod.stock <= 0 ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                      {prod.stock <= 0 ? "نفد" : `${prod.stock} متبقي`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
