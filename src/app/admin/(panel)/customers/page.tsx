import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/admin/page-header";
import { SearchIcon, UsersIcon } from "@/components/icons";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { REVENUE_STATUSES } from "@/features/orders/status";
import { db } from "@/server/db";
import { formatIQD } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { normalizeIraqiPhone } from "@/lib/phone";

export const metadata = { title: "العملاء" };

const PAGE_SIZE = 25;

type PageProps = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function CustomersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60) ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    const phone = normalizeIraqiPhone(q);
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      phone ? { phone } : { phone: { contains: q.replace(/\D/g, "") || "__none__" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: [{ lastOrderAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Totals exclude cancelled orders (same rule as analytics)
  const stats = customers.length
    ? await db.order.groupBy({
        by: ["customerId"],
        where: { customerId: { in: customers.map((c) => c.id) }, status: { in: REVENUE_STATUSES } },
        _count: { _all: true },
        _sum: { total: true },
      })
    : [];
  const statFor = (id: string) => stats.find((s) => s.customerId === id);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="العملاء" description={`${total} عميل — يُنشأ العميل تلقائياً عند أول طلب (حسب رقم الهاتف).`} />
      <form action="/admin/customers" method="get" className="relative mb-4 max-w-sm">
        <label htmlFor="customer-search" className="sr-only">
          بحث في العملاء
        </label>
        <input
          id="customer-search"
          name="q"
          defaultValue={q}
          placeholder="الاسم أو رقم الهاتف"
          className="h-10 w-full rounded-full border border-line-strong bg-paper ps-10 pe-4 text-sm focus:border-plum-950 focus:outline-none"
        />
        <SearchIcon size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-subtle" />
      </form>

      {customers.length === 0 ? (
        <EmptyState icon={<UsersIcon size={24} />} title="لا يوجد عملاء" description={q ? "لا توجد نتائج مطابقة." : "سيظهر العملاء هنا بعد أول طلب."} />
      ) : (
        <Card>
          <TableWrap>
            <Table className="min-w-[820px]">
              <thead>
                <tr>
                  <Th>العميل</Th>
                  <Th>الهاتف</Th>
                  <Th>المحافظة</Th>
                  <Th>الطلبات</Th>
                  <Th>إجمالي الإنفاق</Th>
                  <Th>أول طلب</Th>
                  <Th>آخر طلب</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const s = statFor(c.id);
                  return (
                    <Tr key={c.id}>
                      <Td>
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-plum-950 hover:underline">
                          {c.name}
                        </Link>
                        {c.email && <span className="block text-xs text-subtle">{c.email}</span>}
                      </Td>
                      <Td dir="ltr" className="text-start text-muted">
                        {c.phone}
                      </Td>
                      <Td className="text-muted">{c.governorate ?? "—"}</Td>
                      <Td className="tabular-nums">{s?._count._all ?? 0}</Td>
                      <Td className="font-medium tabular-nums">{formatIQD(s?._sum.total ?? 0)}</Td>
                      <Td className="text-xs text-muted">{c.firstOrderAt ? formatDate(c.firstOrderAt) : "—"}</Td>
                      <Td className="text-xs text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {pageCount > 1 && (
        <nav aria-label="الصفحات" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`} className="rounded-full border border-line-strong px-4 py-2">
              السابق
            </Link>
          )}
          <span className="text-muted">
            صفحة {page} من {pageCount}
          </span>
          {page < pageCount && (
            <Link href={`/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`} className="rounded-full border border-line-strong px-4 py-2">
              التالي
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
