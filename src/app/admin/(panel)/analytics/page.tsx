import { PageHeader } from "@/components/admin/page-header";
import { KpiCard, RangeFilter } from "@/components/admin/admin-ui";
import { OrdersChart, RankingBars, RevenueChart } from "@/components/admin/charts";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { percentChange, RANGE_LABELS, resolveRange } from "@/features/analytics/calc";
import { getAnalytics } from "@/server/analytics";
import { formatIQD, formatNumber, formatPercent } from "@/lib/format";

export const metadata = { title: "التحليلات" };

type PageProps = { searchParams: Promise<{ range?: string; from?: string; to?: string }> };

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const range = resolveRange(sp.range, sp.from, sp.to);
  const a = await getAnalytics(range);
  const s = a.summary;
  const p = a.previous;
  const cancelRate = s.orders + s.cancelledOrders > 0 ? s.cancelledOrders / (s.orders + s.cancelledOrders) : 0;

  return (
    <>
      <PageHeader
        title="التحليلات"
        description={`${RANGE_LABELS[range.key]} · ${range.fromKey} → ${range.toKey} · مقارنة بالفترة السابقة بنفس الطول`}
        actions={<RangeFilter range={range} basePath="/admin/analytics" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard emphasis label="الإيرادات" value={formatIQD(s.revenue)} change={percentChange(s.revenue, p.revenue)} hint="الطلبات غير الملغاة" />
        <KpiCard label="الإيرادات المحصّلة" value={formatIQD(s.collectedRevenue)} change={percentChange(s.collectedRevenue, p.collectedRevenue)} hint="الطلبات المسلّمة" />
        <KpiCard label="الطلبات" value={formatNumber(s.orders)} change={percentChange(s.orders, p.orders)} hint={`${formatNumber(s.cancelledOrders)} ملغي (${formatPercent(cancelRate, 0)})`} />
        <KpiCard label="متوسط قيمة الطلب" value={formatIQD(s.aov)} change={percentChange(s.aov, p.aov)} />
        <KpiCard label="العملاء" value={formatNumber(s.customers)} change={percentChange(s.customers, p.customers)} hint={`${formatNumber(a.newCustomers)} جديد · ${formatNumber(a.returningCustomers)} عائد`} />
        <KpiCard label="الزيارات" value={formatNumber(s.sessions)} change={percentChange(s.sessions, p.sessions)} />
        <KpiCard
          label="معدل التحويل"
          value={s.conversionRate === null ? "—" : formatPercent(s.conversionRate, 2)}
          change={s.conversionRate !== null && p.conversionRate !== null ? percentChange(s.conversionRate, p.conversionRate) : undefined}
          hint="الطلبات ÷ الزيارات"
        />
        <KpiCard label="الإيرادات لكل زيارة" value={s.sessions ? formatIQD(Math.round(s.revenue / s.sessions)) : "—"} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="الإيرادات عبر الوقت" />
          <div className="p-4">
            <RevenueChart data={a.series} />
          </div>
        </Card>
        <Card>
          <CardHeader title="الطلبات عبر الوقت" />
          <div className="p-4">
            <OrdersChart data={a.series} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="مبيعات المنتجات" description="أعلى 10 منتجات حسب الإيرادات" />
          {a.topProducts.length === 0 ? (
            <p className="p-8 text-center text-sm text-subtle">لا توجد مبيعات في هذه الفترة.</p>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>المنتج</Th>
                    <Th>القطع المباعة</Th>
                    <Th>الإيرادات</Th>
                    <Th>الحصة</Th>
                  </tr>
                </thead>
                <tbody>
                  {a.topProducts.map((row, i) => {
                    const itemsRevenue = a.categoryPerformance.reduce((n, c) => n + c.revenue, 0);
                    return (
                      <Tr key={row.productId ?? i}>
                        <Td className="text-subtle tabular-nums">{i + 1}</Td>
                        <Td>
                          <span className="font-medium">{row.name}</span>
                          <span className="block text-xs text-subtle" dir="ltr">
                            {row.sku}
                          </span>
                        </Td>
                        <Td className="tabular-nums">{formatNumber(row.units)}</Td>
                        <Td className="font-medium tabular-nums">{formatIQD(row.revenue)}</Td>
                        <Td className="text-muted tabular-nums">{itemsRevenue ? formatPercent(row.revenue / itemsRevenue, 0) : "—"}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="أداء الأقسام" description="إيرادات المنتجات حسب القسم (قبل الخصم والتوصيل)" />
            <div className="p-5">
              <RankingBars valueLabel="أداء الأقسام" data={a.categoryPerformance.map((c) => ({ name: c.name, value: c.revenue, units: c.units }))} />
            </div>
          </Card>
          <Card>
            <CardHeader title="مصادر الطلبات" description="حسب UTM المحفوظة مع كل طلب" />
            {a.sources.length === 0 ? (
              <p className="p-6 text-center text-sm text-subtle">لا توجد بيانات.</p>
            ) : (
              <ul className="divide-y divide-line">
                {a.sources.map((src) => (
                  <li key={src.label} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="truncate">{src.label}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {formatNumber(src.orders)} طلب · {formatIQD(src.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-line bg-paper p-5 text-sm leading-7 text-muted">
        <summary className="cursor-pointer font-medium text-plum-950">كيف تُحسب هذه الأرقام؟</summary>
        <ul className="mt-3 list-disc space-y-1 ps-5">
          <li>الطلب المحتسب: أي طلب ليس «ملغياً» (قيد المراجعة، مؤكد، قيد التجهيز، تم الشحن، تم التوصيل) وأُنشئ ضمن الفترة بتوقيت بغداد.</li>
          <li>الإيرادات: مجموع «الإجمالي» للطلبات المحتسبة (بعد الخصم ومع أجور التوصيل).</li>
          <li>الإيرادات المحصّلة: مجموع الطلبات التي حالتها «تم التوصيل» (تم استلام المبلغ نقداً).</li>
          <li>متوسط قيمة الطلب: الإيرادات ÷ عدد الطلبات المحتسبة.</li>
          <li>العملاء: عدد العملاء المختلفين (برقم الهاتف) الذين لديهم طلب محتسب في الفترة؛ «جديد» = أول طلب لهم ضمن الفترة.</li>
          <li>الزيارات: جلسات تصفح يسجلها المتجر نفسه (30 دقيقة من عدم النشاط تنهي الجلسة، ويُستبعد الزواحف).</li>
          <li>معدل التحويل: الطلبات المحتسبة ÷ الزيارات.</li>
          <li>أداء المنتجات والأقسام: من بنود الطلبات المحتسبة بسعر البيع وقت الطلب.</li>
        </ul>
      </details>
    </>
  );
}
