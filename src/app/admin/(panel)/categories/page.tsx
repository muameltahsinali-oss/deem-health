import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { FolderIcon, PlusIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/input";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { deleteCategoryAction, saveCategoryAction } from "@/server/admin/category-actions";
import { db } from "@/server/db";

export const metadata = { title: "الأقسام" };

type PageProps = { searchParams: Promise<{ edit?: string }> };

export default async function CategoriesPage({ searchParams }: PageProps) {
  const { edit } = await searchParams;
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const editing = edit ? categories.find((c) => c.id === edit) : undefined;

  return (
    <>
      <PageHeader title="الأقسام" description="الأقسام تظهر في قائمة المتجر حسب ترتيبها." />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_24rem]">
        {categories.length === 0 ? (
          <EmptyState icon={<FolderIcon size={24} />} title="لا توجد أقسام" description="أنشئ أول قسم من النموذج." />
        ) : (
          <Card>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>القسم</Th>
                    <Th>الرابط</Th>
                    <Th>المنتجات</Th>
                    <Th>الترتيب</Th>
                    <Th>الحالة</Th>
                    <Th>
                      <span className="sr-only">إجراءات</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <Tr key={c.id} className={c.id === edit ? "bg-lavender-50" : undefined}>
                      <Td>
                        <span className="flex items-center gap-3">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-lavender-50">
                            {c.image && <Image src={c.image} alt="" fill sizes="40px" className="object-cover" />}
                          </span>
                          <span className="font-medium">{c.name}</span>
                        </span>
                      </Td>
                      <Td className="text-xs text-muted" dir="ltr">
                        /category/{c.slug}
                      </Td>
                      <Td className="tabular-nums">{c._count.products}</Td>
                      <Td className="tabular-nums">{c.sortOrder}</Td>
                      <Td>{c.active ? <Badge tone="success">ظاهر</Badge> : <Badge tone="neutral">مخفي</Badge>}</Td>
                      <Td className="text-end">
                        <Link href={`/admin/categories?edit=${c.id}`} className="text-sm font-medium text-plum-950 hover:underline">
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

        <Card key={editing?.id ?? "new"}>
          <CardHeader
            title={editing ? `تعديل: ${editing.name}` : "قسم جديد"}
            action={
              editing ? (
                <ButtonLink href="/admin/categories" variant="ghost" size="sm">
                  <PlusIcon size={16} /> جديد
                </ButtonLink>
              ) : undefined
            }
          />
          <ActionForm action={saveCategoryAction} className="space-y-4 p-5" resetOnSuccess={!editing}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field id="cat-name" label="الاسم">
              <Input id="cat-name" name="name" required defaultValue={editing?.name} />
            </Field>
            <Field id="cat-slug" label="الرابط (slug)" hint="مثال: vitamins">
              <Input id="cat-slug" name="slug" dir="ltr" required defaultValue={editing?.slug} />
            </Field>
            <Field id="cat-desc" label="الوصف" optional>
              <Textarea id="cat-desc" name="description" rows={2} defaultValue={editing?.description ?? ""} />
            </Field>
            <ImageUploadField name="image" label="الصورة" defaultValue={editing?.image} />
            <Field id="cat-order" label="الترتيب">
              <Input id="cat-order" name="sortOrder" type="number" min={0} max={999} dir="ltr" defaultValue={editing?.sortOrder ?? categories.length + 1} />
            </Field>
            <Checkbox id="cat-active" name="active" defaultChecked={editing?.active ?? true} label="ظاهر في المتجر" />
            <SubmitButton className="w-full">{editing ? "حفظ التغييرات" : "إنشاء القسم"}</SubmitButton>
          </ActionForm>
          {editing && (
            <ActionForm action={deleteCategoryAction} className="border-t border-line p-5">
              <input type="hidden" name="id" value={editing.id} />
              <p className="mb-3 text-xs leading-5 text-subtle">يمكن حذف القسم فقط إذا لم يكن يحتوي على منتجات.</p>
              <SubmitButton variant="danger-outline" size="sm">
                حذف القسم
              </SubmitButton>
            </ActionForm>
          )}
        </Card>
      </div>
    </>
  );
}
