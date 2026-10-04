import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { PlusIcon, TagIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { deleteCouponAction, saveCouponAction, toggleCouponAction } from "@/server/admin/coupon-actions";
import { db } from "@/server/db";
import { formatIQD } from "@/lib/format";
import { addDays, baghdadDayKey, currentDate, formatDate } from "@/lib/dates";

export const metadata = { title: "كوبونات الخصم" };

type PageProps = { searchParams: Promise<{ edit?: string }> };

export default async function CouponsPage({ searchParams }: PageProps) {
  const { edit } = await searchParams;
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const editing = edit ? coupons.find((c) => c.id === edit) : undefined;
  const now = currentDate();

  const statusOf = (c: (typeof coupons)[number]) => {
    if (!c.active) return <Badge tone="neutral">موقوف</Badge>;
    if (c.expiresAt && c.expiresAt <= now) return <Badge tone="danger">منتهي</Badge>;
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return <Badge tone="warning">مستنفد</Badge>;
    return <Badge tone="success">فعّال</Badge>;
  };

  return (
    <>
      <PageHeader title="كوبونات الخصم" description="خصم بمبلغ ثابت أو بنسبة مئوية، مع حد أدنى للطلب وتاريخ انتهاء وحد للاستخدام." />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_24rem]">
        {coupons.length === 0 ? (
          <EmptyState icon={<TagIcon size={24} />} title="لا توجد كوبونات" description="أنشئ أول كود خصم من النموذج." />
        ) : (
          <Card>
            <TableWrap>
              <Table className="min-w-[760px]">
                <thead>
                  <tr>
                    <Th>الكود</Th>
                    <Th>الخصم</Th>
                    <Th>الحد الأدنى</Th>
                    <Th>الاستخدام</Th>
                    <Th>ينتهي</Th>
                    <Th>الحالة</Th>
                    <Th>
                      <span className="sr-only">إجراءات</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <Tr key={c.id} className={c.id === edit ? "bg-lavender-50" : undefined}>
                      <Td>
                        <span className="font-semibold tracking-wide" dir="ltr">
                          {c.code}
                        </span>
                        {c.description && <span className="block max-w-56 truncate text-xs text-subtle">{c.description}</span>}
                      </Td>
                      <Td className="tabular-nums">{c.type === "PERCENTAGE" ? `${c.value}%` : formatIQD(c.value)}</Td>
                      <Td className="tabular-nums text-muted">{c.minOrderAmount ? formatIQD(c.minOrderAmount) : "—"}</Td>
                      <Td className="tabular-nums">
                        {c.usedCount}
                        {c.usageLimit !== null && <span className="text-subtle"> / {c.usageLimit}</span>}
                      </Td>
                      <Td className="text-xs text-muted">{c.expiresAt ? formatDate(addDays(c.expiresAt, -1)) : "بلا انتهاء"}</Td>
                      <Td>{statusOf(c)}</Td>
                      <Td>
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/admin/coupons?edit=${c.id}`} className="text-sm font-medium text-plum-950 hover:underline">
                            تعديل
                          </Link>
                          <ActionForm action={toggleCouponAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" className="text-sm text-muted hover:text-plum-950">
                              {c.active ? "إيقاف" : "تفعيل"}
                            </button>
                          </ActionForm>
                        </div>
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
            title={editing ? `تعديل ${editing.code}` : "كوبون جديد"}
            action={
              editing ? (
                <ButtonLink href="/admin/coupons" variant="ghost" size="sm">
                  <PlusIcon size={16} /> جديد
                </ButtonLink>
              ) : undefined
            }
          />
          <ActionForm action={saveCouponAction} className="space-y-4 p-5" resetOnSuccess={!editing}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field id="code" label="الكود" hint="أحرف لاتينية وأرقام، مثل: RAMADAN10">
              <Input id="code" name="code" dir="ltr" required className="uppercase" defaultValue={editing?.code} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="type" label="نوع الخصم">
                <Select id="type" name="type" defaultValue={editing?.type ?? "PERCENTAGE"}>
                  <option value="PERCENTAGE">نسبة مئوية %</option>
                  <option value="FIXED">مبلغ ثابت (د.ع)</option>
                </Select>
              </Field>
              <Field id="value" label="القيمة">
                <Input id="value" name="value" type="number" min={1} dir="ltr" required defaultValue={editing?.value} />
              </Field>
            </div>
            <Field id="minOrderAmount" label="الحد الأدنى للطلب (د.ع)" optional>
              <Input id="minOrderAmount" name="minOrderAmount" type="number" min={0} dir="ltr" defaultValue={editing?.minOrderAmount ?? 0} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="usageLimit" label="حد الاستخدام" optional hint="فارغ = بلا حد">
                <Input id="usageLimit" name="usageLimit" type="number" min={1} dir="ltr" defaultValue={editing?.usageLimit ?? ""} />
              </Field>
              <Field id="expiresOn" label="صالح حتى" optional hint="نهاية اليوم المحدد">
                <Input id="expiresOn" name="expiresOn" type="date" dir="ltr" defaultValue={editing?.expiresAt ? baghdadDayKey(addDays(editing.expiresAt, -1)) : ""} />
              </Field>
            </div>
            <Field id="description" label="وصف داخلي" optional>
              <Input id="description" name="description" defaultValue={editing?.description ?? ""} />
            </Field>
            <Checkbox id="active" name="active" defaultChecked={editing?.active ?? true} label="فعّال" />
            <SubmitButton className="w-full">{editing ? "حفظ التغييرات" : "إنشاء الكوبون"}</SubmitButton>
          </ActionForm>
          {editing && (
            <ActionForm action={deleteCouponAction} className="border-t border-line p-5">
              <input type="hidden" name="id" value={editing.id} />
              <SubmitButton variant="danger-outline" size="sm">
                حذف الكوبون
              </SubmitButton>
            </ActionForm>
          )}
        </Card>
      </div>
    </>
  );
}
