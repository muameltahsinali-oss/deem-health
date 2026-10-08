import Image from "next/image";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { db } from "@/server/db";
import { productToFormValues } from "@/server/admin/product-form-values";
import { formatDateTime } from "@/lib/dates";
import { pendingProductAngles } from "@/config/product-media";
import { importProductAnglesAction } from "@/server/admin/product-actions";

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
  const pendingAngles = product.images.length ? pendingProductAngles(product.slug, product.images.map((img) => img.url)) : [];

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
      {pendingAngles.length > 0 && (
        <ActionForm
          action={importProductAnglesAction}
          className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-sun-300 bg-sun-50 p-4"
        >
          <div className="flex gap-2">
            {pendingAngles.map((a) => (
              <Image key={a.url} src={a.url} alt="" width={56} height={56} className="size-14 rounded-lg bg-paper object-cover" />
            ))}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-plum-950">توجد {pendingAngles.length} صور جاهزة لهذا المنتج تظهر في المتجر لكنها غير مضافة هنا</p>
            <p className="mt-0.5 text-muted">أضفها لتظهر ضمن الصور أدناه وتتمكن من ترتيبها أو حذفها. يضيف الزر الصور الجاهزة لكل المنتجات مرة واحدة.</p>
          </div>
          <SubmitButton size="sm">إضافة الصور الجاهزة</SubmitButton>
        </ActionForm>
      )}
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
