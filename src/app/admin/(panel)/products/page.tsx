import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/admin/page-header";
import { BoxIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { db } from "@/server/db";
import { getStoreSettings } from "@/server/settings";
import { formatIQD } from "@/lib/format";
import { normalizeSearchText } from "@/lib/search";

export const metadata = { title: "المنتجات" };

const STATUS_LABEL = { ACTIVE: "منشور", DRAFT: "مسودة", ARCHIVED: "مؤرشف" } as const;
const STATUS_TONE = { ACTIVE: "success", DRAFT: "neutral", ARCHIVED: "warning" } as const;

type PageProps = { searchParams: Promise<{ q?: string; status?: string; category?: string; deleted?: string }> };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60) ?? "";
  const status = sp.status && sp.status in STATUS_LABEL ? (sp.status as keyof typeof STATUS_LABEL) : undefined;

  const where: Prisma.ProductWhereInput = {};
  if (status) where.status = status;
  if (sp.category) where.categoryId = sp.category;
  if (q) {
    const n = normalizeSearchText(q);
    where.OR = [{ searchText: { contains: n } }, { sku: { contains: q.toUpperCase() } }];
  }

  const [products, categories, settings] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
      take: 200,
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getStoreSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="المنتجات"
        description={`${products.length} منتج`}
        actions={
          <ButtonLink href="/admin/products/new">
            <PlusIcon size={18} /> منتج جديد
          </ButtonLink>
        }
      />
      {sp.deleted && (
        <Alert tone="success" className="mb-4">
          تم حذف المنتج.
        </Alert>
      )}

      <form action="/admin/products" method="get" className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1 sm:max-w-80">
          <label htmlFor="product-search" className="sr-only">
            بحث
          </label>
          <input
            id="product-search"
            name="q"
            defaultValue={q}
            placeholder="اسم المنتج أو SKU"
            className="h-10 w-full rounded-full border border-line-strong bg-paper ps-10 pe-4 text-sm focus:border-plum-950 focus:outline-none"
          />
          <SearchIcon size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        </div>
        <select name="status" defaultValue={status ?? ""} aria-label="الحالة" className="h-10 rounded-full border border-line-strong bg-paper px-4 text-sm">
          <option value="">كل الحالات</option>
          <option value="ACTIVE">منشور</option>
          <option value="DRAFT">مسودة</option>
          <option value="ARCHIVED">مؤرشف</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} aria-label="القسم" className="h-10 rounded-full border border-line-strong bg-paper px-4 text-sm">
          <option value="">كل الأقسام</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-full bg-plum-950 px-5 text-sm font-medium text-paper">
          تصفية
        </button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          icon={<BoxIcon size={24} />}
          title="لا توجد منتجات"
          description={q || status ? "لا توجد منتجات مطابقة." : "ابدأ بإضافة أول منتج إلى المتجر."}
          action={<ButtonLink href="/admin/products/new">إضافة منتج</ButtonLink>}
        />
      ) : (
        <Card>
          <TableWrap>
            <Table className="min-w-[860px]">
              <thead>
                <tr>
                  <Th>المنتج</Th>
                  <Th>SKU</Th>
                  <Th>القسم</Th>
                  <Th>السعر</Th>
                  <Th>المخزون</Th>
                  <Th>الحالة</Th>
                  <Th>
                    <span className="sr-only">إجراءات</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-lavender-50">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                        <span>
                          <span className="block font-medium text-plum-950 hover:underline">{p.name}</span>
                          <span className="mt-0.5 flex gap-1">
                            {p.featured && <Badge tone="lavender">مميز</Badge>}
                            {p.bestSeller && <Badge tone="plum">الأكثر مبيعاً</Badge>}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="text-xs text-muted" dir="ltr">
                      {p.sku}
                    </Td>
                    <Td className="text-muted">{p.category.name}</Td>
                    <Td className="tabular-nums">
                      {formatIQD(p.price)}
                      {p.compareAtPrice && <span className="block text-xs text-subtle line-through">{formatIQD(p.compareAtPrice)}</span>}
                    </Td>
                    <Td>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                          p.stock <= 0 ? "bg-danger-soft text-danger" : p.stock <= settings.lowStockThreshold ? "bg-warning-soft text-warning" : "bg-plum-50 text-plum-950"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </Td>
                    <Td className="text-end">
                      <Link href={`/admin/products/${p.id}`} className="text-sm font-medium text-plum-950 hover:underline">
                        تعديل
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}
    </>
  );
}
