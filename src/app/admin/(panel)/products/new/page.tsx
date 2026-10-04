import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { db } from "@/server/db";
import { EMPTY_PRODUCT } from "@/server/admin/product-form-values";

export const metadata = { title: "منتج جديد" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader
        title="منتج جديد"
        actions={
          <ButtonLink href="/admin/products" variant="outline" size="sm">
            → المنتجات
          </ButtonLink>
        }
      />
      {categories.length === 0 ? (
        <Alert tone="warning">أنشئ قسماً واحداً على الأقل قبل إضافة المنتجات.</Alert>
      ) : (
        <ProductForm productId={null} initial={{ ...EMPTY_PRODUCT, categoryId: categories[0].id }} categories={categories} hasOrders={false} />
      )}
    </>
  );
}
