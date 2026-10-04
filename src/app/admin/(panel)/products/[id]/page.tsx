import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { db } from "@/server/db";
import { productToFormValues } from "@/server/admin/product-form-values";
import { formatDateTime } from "@/lib/dates";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: p?.name ?? "منتج غير موجود" };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: true, _count: { select: { orderItems: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            آخر تعديل {formatDateTime(product.updatedAt)}
            {product._count.orderItems > 0 && <Badge tone="lavender">بيع في {product._count.orderItems} طلب</Badge>}
          </span>
        }
        actions={
          <ButtonLink href="/admin/products" variant="outline" size="sm">
            → المنتجات
          </ButtonLink>
        }
      />
      <ProductForm
        key={product.updatedAt.toISOString()}
        productId={product.id}
        initial={productToFormValues(product)}
        categories={categories}
        hasOrders={product._count.orderItems > 0}
      />
    </>
  );
}
