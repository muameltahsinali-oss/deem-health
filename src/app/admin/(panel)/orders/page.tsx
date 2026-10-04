import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/admin-ui";
import { OrdersIcon, SearchIcon } from "@/components/icons";
import { Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { ORDER_STATUSES, type OrderStatusValue } from "@/features/orders/status";
import { describeSource } from "@/features/attribution/shared";
import { db } from "@/server/db";
import { formatIQD, formatNumber } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { normalizeIraqiPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export const metadata = { title: "الطلبات" };

const PAGE_SIZE = 20;

type PageProps = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function OrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as OrderStatusValue) : undefined;
  const q = sp.q?.trim().slice(0, 60) ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    const phone = normalizeIraqiPhone(q);
    where.OR = [
      { orderNumber: { contains: q.toUpperCase() } },
      { customerName: { contains: q, mode: "insensitive" } },
      ...(phone ? [{ customerPhone: phone }] : [{ customerPhone: { contains: q.replace(/\D/g, "") || "__none__" } }]),
    ];
  }

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        governorateName: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        fbclid: true,
        _count: { select: { items: true } },
      },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countFor = (s?: OrderStatusValue) =>
    s ? counts.find((c) => c.status === s)?._count._all ?? 0 : counts.reduce((n, c) => n + c._count._all, 0);
  const href = (params: { status?: string; q?: string; page?: number }) => {
    const u = new URLSearchParams();
    if (params.status) u.set("status", params.status);
    if (params.q) u.set("q", params.q);
    if (params.page && params.page > 1) u.set("page", String(params.page));
    const s = u.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader title="الطلبات" description="راجع الطلبات الجديدة وأكّدها هاتفياً ثم حدّث حالتها حتى التسليم." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="تصفية حسب الحالة" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s, q })}
              aria-current={status === s ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm",
                status === s ? "border-plum-950 bg-plum-950 text-paper" : "border-line bg-paper text-muted hover:text-plum-950",
              )}
            >
              {s ? t.orderStatus[s] : "الكل"}
              <span className="text-xs tabular-nums opacity-70">{formatNumber(countFor(s))}</span>
            </Link>
          ))}
        </nav>
        <form action="/admin/orders" method="get" className="relative lg:w-80">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="order-search" className="sr-only">
            بحث في الطلبات
          </label>
          <input
            id="order-search"
            name="q"
            defaultValue={q}
            placeholder="رقم الطلب، الاسم أو الهاتف"
            className="h-10 w-full rounded-full border border-line-strong bg-paper ps-10 pe-4 text-sm focus:border-plum-950 focus:outline-none"
          />
          <SearchIcon size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<OrdersIcon size={24} />} title="لا توجد طلبات" description={q || status ? "لا توجد طلبات مطابقة لعوامل التصفية." : "ستظهر الطلبات هنا فور وصولها من المتجر."} />
      ) : (
        <Card>
          <TableWrap>
            <Table className="min-w-[900px]">
              <thead>
                <tr>
                  <Th>رقم الطلب</Th>
                  <Th>التاريخ</Th>
                  <Th>العميل</Th>
                  <Th>المحافظة</Th>
                  <Th>المنتجات</Th>
                  <Th>الإجمالي</Th>
                  <Th>الحالة</Th>
                  <Th>الدفع</Th>
                  <Th>المصدر</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-plum-950 hover:underline" dir="ltr">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td className="text-xs whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</Td>
                    <Td>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-muted" dir="ltr">
                        {o.customerPhone}
                      </div>
                    </Td>
                    <Td className="text-muted">{o.governorateName}</Td>
                    <Td className="tabular-nums">{o._count.items}</Td>
                    <Td className="font-medium tabular-nums">{formatIQD(o.total)}</Td>
                    <Td>
                      <OrderStatusBadge status={o.status} />
                    </Td>
                    <Td>
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </Td>
                    <Td className="max-w-40 truncate text-xs text-muted">{describeSource(o)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {pageCount > 1 && (
        <nav aria-label="الصفحات" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={href({ status, q, page: page - 1 })} className="rounded-full border border-line-strong px-4 py-2 hover:border-plum-950">
              السابق
            </Link>
          )}
          <span className="text-muted">
            صفحة {page} من {pageCount}
          </span>
          {page < pageCount && (
            <Link href={href({ status, q, page: page + 1 })} className="rounded-full border border-line-strong px-4 py-2 hover:border-plum-950">
              التالي
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
