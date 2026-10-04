"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon, ChevronRightIcon, ImageIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, Card, CardHeader } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { productFormSchema, type ProductFormValues } from "@/features/admin/product-schema";
import { deleteProductAction, saveProductAction } from "@/server/admin/product-actions";
import { slugify } from "@/lib/slug";
import { discountPercent, formatIQD } from "@/lib/format";

type Props = {
  productId: string | null;
  initial: ProductFormValues;
  categories: Array<{ id: string; name: string }>;
  hasOrders: boolean;
};

export function ProductForm({ productId, initial, categories, hasOrders }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const slugTouched = useRef(Boolean(productId));
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: initial, mode: "onBlur" });
  const { register, handleSubmit, formState, setValue, setError, watch, control } = form;
  const errors = formState.errors;
  const images = useFieldArray({ control, name: "images" });
  const faq = useFieldArray({ control, name: "faq" });
  const price = Number(watch("price") || 0);
  const compareAt = Number(watch("compareAtPrice") || 0);
  const pct = discountPercent(price, compareAt || null);

  const nameField = register("name");
  const slugField = register("slug");

  function onSubmit(values: ProductFormValues) {
    setFormError(null);
    startSaving(async () => {
      const res = await saveProductAction(productId, values);
      if (res.ok && res.id) {
        toast("تم حفظ المنتج");
        if (!productId) router.replace(`/admin/products/${res.id}`);
        else router.refresh();
        return;
      }
      if (res.fieldErrors) {
        for (const [k, message] of Object.entries(res.fieldErrors)) setError(k as keyof ProductFormValues, { message });
      }
      setFormError(res.error ?? "تعذّر حفظ المنتج");
      toast(res.error ?? "تعذّر حفظ المنتج", { tone: "error" });
    });
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 10 - images.fields.length)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          toast(json.error ?? "تعذّر رفع الصورة", { tone: "error" });
          continue;
        }
        images.append({ url: json.url, alt: "" });
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function onDelete() {
    const msg = hasOrders
      ? "هذا المنتج مرتبط بطلبات سابقة، لذلك ستتم أرشفته (إخفاؤه من المتجر) بدلاً من حذفه. متابعة؟"
      : "سيتم حذف المنتج نهائياً. متابعة؟";
    if (!productId || !window.confirm(msg)) return;
    startDeleting(async () => {
      const res = await deleteProductAction(productId);
      if (res?.ok) {
        toast(res.message ?? "تم حذف المنتج");
        router.refresh();
      } else if (res?.error) {
        toast(res.error, { tone: "error" });
      }
    });
  }

  const err = (k: keyof ProductFormValues) => (errors[k] as { message?: string } | undefined)?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader title="المعلومات الأساسية" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field id="name" label="اسم المنتج" error={err("name")} className="sm:col-span-2">
              <Input
                id="name"
                {...nameField}
                onChange={(e) => {
                  void nameField.onChange(e);
                  if (!slugTouched.current) setValue("slug", slugify(e.target.value));
                }}
                aria-invalid={Boolean(errors.name)}
              />
            </Field>
            <Field id="slug" label="رابط المنتج (slug)" error={err("slug")} hint="يظهر في عنوان الصفحة: /product/…">
              <Input
                id="slug"
                dir="ltr"
                {...slugField}
                onChange={(e) => {
                  slugTouched.current = true;
                  void slugField.onChange(e);
                }}
                aria-invalid={Boolean(errors.slug)}
              />
            </Field>
            <Field id="sku" label="رمز المنتج (SKU)" error={err("sku")}>
              <Input id="sku" dir="ltr" {...register("sku")} aria-invalid={Boolean(errors.sku)} />
            </Field>
            <Field id="shortDescription" label="وصف مختصر" error={err("shortDescription")} hint="يظهر في بطاقة المنتج وأعلى صفحة المنتج" className="sm:col-span-2">
              <Textarea id="shortDescription" rows={2} {...register("shortDescription")} aria-invalid={Boolean(errors.shortDescription)} />
            </Field>
            <Field id="description" label="الوصف الكامل" error={err("description")} className="sm:col-span-2">
              <Textarea id="description" rows={6} {...register("description")} aria-invalid={Boolean(errors.description)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="الصور" description="الصورة الأولى هي الصورة الرئيسية. JPG أو PNG أو WEBP حتى 5 ميغابايت." />
          <div className="p-5">
            {images.fields.length === 0 && (
              <p className="mb-4 rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-subtle">لا توجد صور بعد.</p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2">
              {images.fields.map((f, i) => (
                <li key={f.id} className="flex gap-3 rounded-lg border border-line p-2.5">
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-md bg-lavender-50">
                    <Image src={watch(`images.${i}.url`)} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input className="h-9 text-sm" placeholder="وصف الصورة (للبحث والوصول)" {...register(`images.${i}.alt`)} aria-label={`وصف الصورة ${i + 1}`} />
                    <div className="flex items-center gap-1">
                      {i === 0 && <span className="me-auto rounded-full bg-sun-300 px-2 py-0.5 text-[0.7rem] font-medium">رئيسية</span>}
                      <button type="button" disabled={i === 0} onClick={() => images.move(i, i - 1)} className="ms-auto grid size-8 place-items-center rounded-full hover:bg-lavender-100 disabled:opacity-30" aria-label="تقديم الصورة">
                        <ChevronRightIcon size={16} />
                      </button>
                      <button type="button" disabled={i === images.fields.length - 1} onClick={() => images.move(i, i + 1)} className="grid size-8 place-items-center rounded-full hover:bg-lavender-100 disabled:opacity-30" aria-label="تأخير الصورة">
                        <ChevronDownIcon size={16} className="-rotate-90" />
                      </button>
                      <button type="button" onClick={() => images.remove(i)} className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-soft" aria-label="حذف الصورة">
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="image-upload" onChange={(e) => onUpload(e.target.files)} />
            <label
              htmlFor="image-upload"
              className={`mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium hover:border-plum-950 ${images.fields.length >= 10 ? "pointer-events-none opacity-50" : ""}`}
            >
              {uploading ? <Spinner className="size-4" /> : <ImageIcon size={18} />}
              {uploading ? "جارٍ الرفع…" : "رفع صور"}
            </label>
            {err("images") && <p className="mt-2 text-sm text-danger">{err("images")}</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="تفاصيل المنتج" description="لا تكتب ادعاءات طبية أو علاجية غير موثقة من المورد." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field id="benefits" label="المزايا" hint="ميزة واحدة في كل سطر (مثل: 60 كبسولة، خالٍ من الغلوتين)" className="sm:col-span-2">
              <Textarea id="benefits" rows={4} {...register("benefits")} />
            </Field>
            <Field id="ingredients" label="المكونات" className="sm:col-span-2">
              <Textarea id="ingredients" rows={3} {...register("ingredients")} />
            </Field>
            <Field id="usage" label="طريقة الاستخدام">
              <Textarea id="usage" rows={3} {...register("usage")} />
            </Field>
            <Field id="warnings" label="تحذيرات">
              <Textarea id="warnings" rows={3} {...register("warnings")} />
            </Field>
            <Field id="brand" label="العلامة التجارية" optional>
              <Input id="brand" {...register("brand")} />
            </Field>
            <Field id="netContent" label="المحتوى" optional hint="مثال: 60 كبسولة، 250 مل">
              <Input id="netContent" {...register("netContent")} />
            </Field>
            <Field id="weightGrams" label="الوزن (غرام)" optional error={err("weightGrams")}>
              <Input id="weightGrams" inputMode="numeric" dir="ltr" {...register("weightGrams")} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="أسئلة شائعة عن المنتج" />
          <div className="space-y-3 p-5">
            {faq.fields.map((f, i) => (
              <div key={f.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Input className="h-10" placeholder="السؤال" {...register(`faq.${i}.q`)} aria-label={`السؤال ${i + 1}`} />
                  <Textarea rows={2} placeholder="الإجابة" {...register(`faq.${i}.a`)} aria-label={`الإجابة ${i + 1}`} />
                </div>
                <button type="button" onClick={() => faq.remove(i)} className="grid size-9 place-items-center self-start rounded-full text-danger hover:bg-danger-soft" aria-label="حذف السؤال">
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
            {faq.fields.length < 12 && (
              <Button variant="outline" size="sm" onClick={() => faq.append({ q: "", a: "" })}>
                <PlusIcon size={16} /> إضافة سؤال
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="محركات البحث (اختياري)" description="يُستخدم الاسم والوصف المختصر إذا تُركت فارغة." />
          <div className="grid gap-4 p-5">
            <Field id="metaTitle" label="عنوان الصفحة" hint="حتى 70 حرفاً" error={err("metaTitle")}>
              <Input id="metaTitle" {...register("metaTitle")} />
            </Field>
            <Field id="metaDescription" label="وصف الصفحة" hint="حتى 170 حرفاً" error={err("metaDescription")}>
              <Textarea id="metaDescription" rows={2} {...register("metaDescription")} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6">
        <Card>
          <CardHeader title="النشر" />
          <div className="space-y-4 p-5">
            <Field id="status" label="الحالة">
              <Select id="status" {...register("status")}>
                <option value="ACTIVE">منشور — يظهر في المتجر</option>
                <option value="DRAFT">مسودة — مخفي</option>
                <option value="ARCHIVED">مؤرشف — مخفي</option>
              </Select>
            </Field>
            <Field id="categoryId" label="القسم" error={err("categoryId")}>
              <Select id="categoryId" {...register("categoryId")} aria-invalid={Boolean(errors.categoryId)}>
                <option value="">اختر القسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-2.5">
              <Checkbox id="featured" label="منتج مميز (يظهر في مختارات ديم)" {...register("featured")} />
              <Checkbox id="bestSeller" label="الأكثر مبيعاً (يظهر في الصفحة الرئيسية)" {...register("bestSeller")} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="السعر والمخزون" />
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
            <Field id="price" label="السعر (د.ع)" error={err("price")}>
              <Input id="price" inputMode="numeric" dir="ltr" {...register("price")} aria-invalid={Boolean(errors.price)} />
            </Field>
            <Field
              id="compareAtPrice"
              label="السعر قبل الخصم (د.ع)"
              optional
              error={err("compareAtPrice")}
              hint={pct ? `يظهر خصم ${pct}% (${formatIQD(compareAt - price)})` : "اتركه فارغاً إذا لا يوجد خصم"}
            >
              <Input id="compareAtPrice" inputMode="numeric" dir="ltr" {...register("compareAtPrice")} aria-invalid={Boolean(errors.compareAtPrice)} />
            </Field>
            <Field id="stock" label="الكمية في المخزون" error={err("stock")}>
              <Input id="stock" inputMode="numeric" dir="ltr" {...register("stock")} aria-invalid={Boolean(errors.stock)} />
            </Field>
          </div>
        </Card>

        {formError && <Alert tone="danger">{formError}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={saving}>
          {productId ? "حفظ التغييرات" : "إنشاء المنتج"}
        </Button>
        {productId && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <Link href={`/product/${initial.slug}`} target="_blank" className="text-plum-950 underline">
              عرض في المتجر
            </Link>
            <Button variant="danger-ghost" size="sm" onClick={onDelete} loading={deleting}>
              <TrashIcon size={16} /> {hasOrders ? "أرشفة" : "حذف"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
