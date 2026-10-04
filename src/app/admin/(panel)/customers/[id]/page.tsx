import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard, OrderStatusBadge } from "@/components/admin/admin-ui";
import { PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { isRevenueStatus } from "@/features/orders/status";
import { describeSource } from "@/features/attribution/shared";
import { db } from "@/server/db";
import { whatsappLink } from "@/server/settings";
import { formatIQD, formatNumber } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/dates";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = await db.customer.findUnique({ where: { id }, select: { name: true } });
  return { title: c?.name ?? "عميل غير موجود" };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          fbclid: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
  if (!customer) notFound();

  const qualifying = customer.orders.filter((o) => isRevenueStatus(o.status));
  const totalSpent = qualifying.reduce((s, o) => s + o.total, 0);
  const wa = whatsappLink(customer.phone);

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`عميل منذ ${formatDate(customer.createdAt)}`}
        actions={
          <ButtonLink href="/admin/customers" variant="outline" size="sm">
            → العملاء
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard emphasis label="إجمالي الإنفاق" value={formatIQD(totalSpent)} />
        <KpiCard label="الطلبات" value={formatNumber(qualifying.length)} hint={customer.orders.length > qualifying.length ? `+${customer.orders.length - qualifying.length} ملغي` : undefined} />
        <KpiCard label="متوسط الطلب" value={formatIQD(qualifying.length ? Math.round(totalSpent / qualifying.length) : 0)} />
        <KpiCard label="آخر طلب" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"} />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader title="الملف الشخصي" />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1.5" dir="ltr">
                <PhoneIcon size={15} /> {customer.phone}
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-success">
                  <WhatsappIcon size={15} /> واتساب
                </a>
              )}
            </div>
            {customer.email && <p className="text-muted">{customer.email}</p>}
            <p className="flex items-start gap-2 leading-6 text-muted">
              <PinIcon size={16} className="mt-1 shrink-0" />
              <span>
                {customer.governorate} — {customer.district}
                <br />
                {customer.address}
              </span>
            </p>
            <p className="text-xs text-subtle">أول طلب: {customer.firstOrderAt ? formatDateTime(customer.firstOrderAt) : "—"}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="سجل الطلبات" description={`${customer.orders.length} طلب`} />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>رقم الطلب</Th>
                  <Th>التاريخ</Th>
                  <Th>المنتجات</Th>
                  <Th>الإجمالي</Th>
                  <Th>الحالة</Th>
                  <Th>المصدر</Th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline" dir="ltr">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td className="text-xs text-muted">{formatDateTime(o.createdAt)}</Td>
                    <Td className="tabular-nums">{o._count.items}</Td>
                    <Td className="tabular-nums">{formatIQD(o.total)}</Td>
                    <Td>
                      <OrderStatusBadge status={o.status} />
                    </Td>
                    <Td className="text-xs text-muted">{describeSource(o)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
