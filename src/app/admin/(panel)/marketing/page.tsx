import { PageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { CheckCircleIcon, AlertIcon } from "@/components/icons";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { saveTrackingAction, testCapiConnectionAction } from "@/server/admin/marketing-actions";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { getTrackingConfig } from "@/server/tracking/config";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "التسويق والتتبع" };

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line p-4">
      {ok ? <CheckCircleIcon size={22} className="shrink-0 text-success" /> : <AlertIcon size={22} className="shrink-0 text-subtle" />}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-plum-950">{label}</p>
          <Badge tone={ok ? "success" : "neutral"}>{ok ? "متصل" : "غير مُعد"}</Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
      </div>
    </div>
  );
}

const SOURCE_LABEL = { admin: "من لوحة التحكم", env: "من متغيرات البيئة" } as const;

export default async function MarketingPage() {
  const [cfg, row, log, lastPurchase] = await Promise.all([
    getTrackingConfig(),
    db.trackingConfiguration.findUnique({ where: { id: 1 } }),
    db.trackingEvent.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    db.trackingEvent.findFirst({ where: { eventName: "Purchase", status: "SENT" }, orderBy: { createdAt: "desc" } }),
  ]);

  const pixelOk = cfg.enabled && Boolean(cfg.pixelId);
  const capiOk = cfg.enabled && Boolean(cfg.pixelId && cfg.capiAccessToken);

  return (
    <>
      <PageHeader title="التسويق والتتبع" description="ربط المتجر بـ Meta Pixel و Conversions API لقياس نتائج الإعلانات بدقة." />

      {!cfg.enabled && (
        <Alert tone="warning" className="mb-4">
          التتبع متوقف حالياً — لا تُرسل أي أحداث إلى Meta.
        </Alert>
      )}
      {cfg.capiDecryptError && (
        <Alert tone="danger" className="mb-4">
          تعذّر فك تشفير رمز Conversions API المحفوظ (ربما تغيّر APP_ENCRYPTION_KEY). أدخل الرمز من جديد.
        </Alert>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_26rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="حالة الاتصال" />
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <StatusRow
                label="Meta Pixel (المتصفح)"
                ok={pixelOk}
                detail={cfg.pixelId ? `المعرف ${cfg.pixelId} — ${cfg.sources.pixel ? SOURCE_LABEL[cfg.sources.pixel] : ""}` : "أدخل معرف البكسل لتفعيل التتبع في المتصفح."}
              />
              <StatusRow
                label="Conversions API (الخادم)"
                ok={capiOk}
                detail={
                  cfg.capiAccessToken
                    ? `الرمز ينتهي بـ ••••${cfg.capiTokenLast4 ?? ""} — ${cfg.sources.capi ? SOURCE_LABEL[cfg.sources.capi] : ""}${lastPurchase ? ` · آخر Purchase ناجح: ${formatDateTime(lastPurchase.createdAt)}` : ""}`
                    : "أضف رمز الوصول لإرسال أحداث الشراء من الخادم (أدق من المتصفح وحده)."
                }
              />
            </div>
            {cfg.testEventCode && (
              <p className="mx-5 mb-5 rounded-lg bg-sun-50 px-4 py-3 text-sm text-plum-950">
                وضع الاختبار مفعّل (<span dir="ltr">{cfg.testEventCode}</span>) — ستظهر أحداث الخادم في «Test events» في مدير الأحداث. أزل الرمز بعد الانتهاء.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="الأحداث المتتبعة" />
            <div className="p-5 text-sm leading-7 text-muted">
              <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <li><b className="text-plum-950">PageView</b> — كل صفحة (متصفح)</li>
                <li><b className="text-plum-950">ViewContent</b> — صفحة منتج (متصفح + خادم)</li>
                <li><b className="text-plum-950">Search</b> — البحث في المتجر (متصفح)</li>
                <li><b className="text-plum-950">AddToCart</b> — إضافة للسلة (متصفح + خادم)</li>
                <li><b className="text-plum-950">InitiateCheckout</b> — فتح صفحة الطلب (متصفح + خادم)</li>
                <li><b className="text-plum-950">AddPaymentInfo</b> — تأكيد الدفع عند الاستلام (متصفح)</li>
                <li><b className="text-plum-950">Purchase</b> — عند إنشاء الطلب فعلياً (خادم) + صفحة التأكيد (متصفح)</li>
                <li><b className="text-plum-950">Lead</b> — الضغط على زر واتساب (متصفح)</li>
              </ul>
              <p className="mt-3 text-xs">
                الأحداث المرسلة من المتصفح والخادم تحمل نفس <span dir="ltr">event_id</span> ليحذف Meta التكرار تلقائياً. بيانات العميل (الهاتف، الاسم، المحافظة) تُشفّر بـ SHA-256 على الخادم قبل الإرسال.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="سجل الإرسال من الخادم" description="أحداث الشراء وأي محاولات فاشلة" />
            {log.length === 0 ? (
              <p className="p-6 text-center text-sm text-subtle">لا توجد سجلات بعد.</p>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>الوقت</Th>
                      <Th>الحدث</Th>
                      <Th>الحالة</Th>
                      <Th>التفاصيل</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((e) => (
                      <Tr key={e.id}>
                        <Td className="text-xs whitespace-nowrap text-muted">{formatDateTime(e.createdAt)}</Td>
                        <Td dir="ltr" className="text-start">
                          {e.eventName}
                        </Td>
                        <Td>
                          <Badge tone={e.status === "SENT" ? "success" : e.status === "FAILED" ? "danger" : "neutral"}>
                            {e.status === "SENT" ? "أُرسل" : e.status === "FAILED" ? "فشل" : "تخطّي"}
                          </Badge>
                        </Td>
                        <Td className="max-w-72 truncate text-xs text-muted" dir="ltr">
                          {e.httpStatus ? `HTTP ${e.httpStatus} ` : ""}
                          {e.error ?? ""}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="الإعدادات" />
            <ActionForm action={saveTrackingAction} className="space-y-4 p-5">
              <Checkbox id="trackingEnabled" name="trackingEnabled" defaultChecked={row?.trackingEnabled ?? true} label="تفعيل التتبع" />
              <Field id="metaPixelId" label="معرف Meta Pixel (Dataset ID)" hint="من مدير الأحداث ← مصادر البيانات">
                <Input id="metaPixelId" name="metaPixelId" dir="ltr" inputMode="numeric" defaultValue={row?.metaPixelId ?? ""} placeholder={env.metaPixelId || "1234567890123456"} />
              </Field>
              <Field
                id="capiAccessToken"
                label="رمز Conversions API"
                hint={row?.capiTokenLast4 ? `محفوظ (ينتهي بـ ••••${row.capiTokenLast4}). اتركه فارغاً للإبقاء عليه.` : "من مدير الأحداث ← الإعدادات ← Conversions API ← إنشاء رمز وصول"}
              >
                <Input id="capiAccessToken" name="capiAccessToken" type="password" autoComplete="off" dir="ltr" placeholder={row?.capiTokenLast4 ? "••••••••" : "EAAB…"} />
              </Field>
              {row?.capiTokenLast4 && <Checkbox id="clearToken" name="clearToken" label="حذف الرمز المحفوظ" />}
              <Field id="testEventCode" label="رمز أحداث الاختبار" optional hint="للاختبار فقط — احذفه قبل الإطلاق">
                <Input id="testEventCode" name="testEventCode" dir="ltr" defaultValue={row?.testEventCode ?? ""} placeholder="TEST12345" />
              </Field>
              {!env.encryptionKey && (
                <Alert tone="warning">لحفظ الرمز من هنا يجب ضبط APP_ENCRYPTION_KEY على الخادم (راجع ملف README).</Alert>
              )}
              <SubmitButton className="w-full">حفظ</SubmitButton>
            </ActionForm>
          </Card>
          <Card className="p-5">
            <p className="mb-3 text-sm text-muted">تحقق من صلاحية الرمز والوصول إلى البكسل دون إرسال أي حدث.</p>
            <ActionForm action={testCapiConnectionAction}>
              <SubmitButton variant="secondary" className="w-full">
                اختبار الاتصال
              </SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
