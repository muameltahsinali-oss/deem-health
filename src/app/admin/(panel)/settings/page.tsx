import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { saveShippingRatesAction, saveStoreSettingsAction } from "@/server/admin/settings-actions";
import { db } from "@/server/db";
import { getStoreSettings } from "@/server/settings";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const [s, rates] = await Promise.all([
    getStoreSettings(),
    db.shippingRate.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <>
      <PageHeader title="الإعدادات" description="معلومات المتجر، إعدادات الطلبات والمخزون، وأجور التوصيل." />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="المتجر والطلبات" />
          <ActionForm action={saveStoreSettingsAction} className="space-y-5 p-5">
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-plum-950">معلومات التواصل</legend>
              <Field id="storeName" label="اسم المتجر">
                <Input id="storeName" name="storeName" required defaultValue={s.storeName} />
              </Field>
              <Field id="contactPhone" label="هاتف الدعم" optional>
                <Input id="contactPhone" name="contactPhone" dir="ltr" defaultValue={s.contactPhone ?? ""} />
              </Field>
              <Field id="whatsapp" label="رقم واتساب" optional hint="يظهر زر التواصل في المتجر">
                <Input id="whatsapp" name="whatsapp" dir="ltr" defaultValue={s.whatsapp ?? ""} />
              </Field>
              <Field id="contactEmail" label="البريد الإلكتروني" optional>
                <Input id="contactEmail" name="contactEmail" type="email" dir="ltr" defaultValue={s.contactEmail ?? ""} />
              </Field>
              <Field id="address" label="العنوان" optional className="sm:col-span-2">
                <Input id="address" name="address" defaultValue={s.address ?? ""} />
              </Field>
              <Field id="instagramUrl" label="رابط إنستغرام" optional>
                <Input id="instagramUrl" name="instagramUrl" dir="ltr" defaultValue={s.instagramUrl ?? ""} placeholder="https://instagram.com/…" />
              </Field>
              <Field id="facebookUrl" label="رابط فيسبوك" optional>
                <Input id="facebookUrl" name="facebookUrl" dir="ltr" defaultValue={s.facebookUrl ?? ""} placeholder="https://facebook.com/…" />
              </Field>
            </fieldset>

            <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <legend className="mb-3 text-sm font-semibold text-plum-950">الطلبات والمخزون</legend>
              <Field id="lowStockThreshold" label="حد المخزون المنخفض" hint="تنبيه عند هذه الكمية أو أقل">
                <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} dir="ltr" defaultValue={s.lowStockThreshold} />
              </Field>
              <Field id="maxQuantityPerItem" label="أقصى كمية للمنتج بالطلب">
                <Input id="maxQuantityPerItem" name="maxQuantityPerItem" type="number" min={1} max={100} dir="ltr" defaultValue={s.maxQuantityPerItem} />
              </Field>
              <Field id="freeShippingThreshold" label="توصيل مجاني فوق (د.ع)" optional hint="فارغ = معطّل">
                <Input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min={0} dir="ltr" defaultValue={s.freeShippingThreshold ?? ""} />
              </Field>
            </fieldset>

            <fieldset className="space-y-3 border-t border-line pt-5">
              <legend className="mb-3 text-sm font-semibold text-plum-950">شريط الإعلان</legend>
              <Checkbox id="announcementEnabled" name="announcementEnabled" defaultChecked={s.announcementEnabled} label="عرض نص مخصص أعلى المتجر (بدلاً من رسالة الدفع عند الاستلام)" />
              <Input id="announcementText" name="announcementText" maxLength={160} defaultValue={s.announcementText ?? ""} placeholder="مثال: خصم 10% بكود WELCOME10" aria-label="نص الإعلان" />
            </fieldset>

            <SubmitButton className="w-full sm:w-auto">حفظ الإعدادات</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title="أجور التوصيل" description="التوصيل داخل العراق فقط. المحافظات غير المفعّلة لا تظهر عند الطلب." />
          <ActionForm action={saveShippingRatesAction}>
            <TableWrap>
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>المحافظة</Th>
                    <Th>الأجرة (د.ع)</Th>
                    <Th>متاح</Th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-medium">
                        <label htmlFor={`fee_${r.id}`}>{r.name}</label>
                      </Td>
                      <Td>
                        <input
                          id={`fee_${r.id}`}
                          name={`fee_${r.id}`}
                          type="number"
                          min={0}
                          required
                          defaultValue={r.fee}
                          dir="ltr"
                          className="h-9 w-28 rounded-md border border-line-strong bg-paper px-3 text-sm focus:border-plum-950 focus:outline-none"
                        />
                      </Td>
                      <Td>
                        <input type="checkbox" name={`active_${r.id}`} defaultChecked={r.active} className="size-4.5 accent-plum-950" aria-label={`تفعيل التوصيل إلى ${r.name}`} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <div className="p-5">
              <SubmitButton>حفظ أجور التوصيل</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
