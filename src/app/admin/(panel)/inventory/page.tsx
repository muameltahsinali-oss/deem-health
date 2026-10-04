import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { KpiCard } from "@/components/admin/admin-ui";
import { Badge, Card } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { updateStockAction } from "@/server/admin/product-actions";
import { db } from "@/server/db";
import { getStoreSettings } from "@/server/settings";
import { formatIQD, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "المخزون" };

type PageProps = { searchParams: Promise<{ filter?: string }> };

export default async function InventoryPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const settings = await getStoreSettings();
  const threshold = settings.lowStockThreshold;

  const base: Prisma.ProductWhereInput = { status: { not: "ARCHIVED" } };
  const where: Prisma.ProductWhereInput =
    filter === "out" ? { ...base, stock: { lte: 0 } } : filter === "low" ? { ...base, stock: { gt: 0, lte: threshold } } : base;

  const [products, outCount, lowCount, totals] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sku: true, stock: true, price: true, status: true, category: { select: { name: true } } },
    }),
    db.product.count({ where: { ...base, stock: { lte: 0 } } }),
    db.product.count({ where: { ...base, stock: { gt: 0, lte: threshold } } }),
    db.product.aggregate({ where: base, _sum: { stock: true } }),
  ]);
  const stockValue = (await db.product.findMany({ where: base, select: { stock: true, price: true } })).reduce(
    (sum, p) => sum + Math.max(p.stock, 0) * p.price,
    0,
  );

  const tabs = [
    { key: undefined, label: "الكل" },
    { key: "low", label: `منخفض (${lowCount})` },
    { key: "out", label: `نفد (${outCount})` },
  ];

  return (
    <>
      <PageHeader
        title="المخزون"
        description={
          <>
            حد المخزون المنخفض: {threshold} قطع —{" "}
            <Link href="/admin/settings" className="underline">
              تغيير
            </Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="نفد من المخزون" value={formatNumber(outCount)} emphasis={outCount > 0} />
        <KpiCard label="مخزون منخفض" value={formatNumber(lowCount)} />
        <KpiCard label="إجمالي القطع" value={formatNumber(totals._sum.stock ?? 0)} />
        <KpiCard label="قيمة المخزون (بسعر البيع)" value={formatIQD(stockValue)} />
      </div>

      <nav aria-label="تصفية المخزون" className="mb-4 flex gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/admin/inventory?filter=${tab.key}` : "/admin/inventory"}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              filter === tab.key ? "border-plum-950 bg-plum-950 text-paper" : "border-line bg-paper text-muted hover:text-plum-950",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Card>
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-subtle">لا توجد منتجات في هذا التصنيف. 👍</p>
        ) : (
          <TableWrap>
            <Table className="min-w-[760px]">
              <thead>
                <tr>
                  <Th>المنتج</Th>
                  <Th>SKU</Th>
                  <Th>القسم</Th>
                  <Th>الحالة</Th>
                  <Th>المخزون الحالي</Th>
                  <Th>تحديث الكمية</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <Tr key={p.id} className={p.stock <= 0 ? "bg-danger-soft/40" : undefined}>
                    <Td>
                      <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      {p.status === "DRAFT" && <span className="ms-2 text-xs text-subtle">(مسودة)</span>}
                    </Td>
                    <Td className="text-xs text-muted" dir="ltr">
                      {p.sku}
                    </Td>
                    <Td className="text-muted">{p.category.name}</Td>
                    <Td>
                      {p.stock <= 0 ? <Badge tone="danger">نفد</Badge> : p.stock <= threshold ? <Badge tone="warning">منخفض</Badge> : <Badge tone="success">جيد</Badge>}
                    </Td>
                    <Td className="text-lg font-semibold tabular-nums">{p.stock}</Td>
                    <Td>
                      <ActionForm action={updateStockAction} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={p.id} />
                        <label htmlFor={`stock-${p.id}`} className="sr-only">
                          الكمية الجديدة لـ {p.name}
                        </label>
                        <input
                          id={`stock-${p.id}`}
                          name="stock"
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          dir="ltr"
                          className="h-9 w-24 rounded-md border border-line-strong bg-paper px-3 text-sm focus:border-plum-950 focus:outline-none"
                        />
                        <SubmitButton size="sm" variant="secondary">
                          حفظ
                        </SubmitButton>
                      </ActionForm>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
