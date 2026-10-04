import { z } from "zod";
import { normalizeIraqiPhone } from "@/lib/phone";
import { ar } from "@/i18n/ar";

const e = ar.checkout.errors;

/**
 * Checkout form — shared by the client (React Hook Form) and the server (order creation).
 * No transforms here so input and output types are identical for RHF;
 * normalisation (phone format, trimming) happens in `normalizeCheckout`.
 */
export const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(3, e.name).max(80, e.name),
  phone: z
    .string()
    .trim()
    .min(1, e.phone)
    .refine((v) => normalizeIraqiPhone(v) !== null, e.phone),
  governorateCode: z.string().trim().min(2, e.governorate).max(8, e.governorate),
  district: z.string().trim().min(2, e.district).max(80, e.district),
  address: z.string().trim().min(10, e.address).max(300, e.address),
  notes: z.string().trim().max(500),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
});

export const quoteRequestSchema = z.object({
  items: z.array(cartLineSchema).max(50),
  couponCode: z.string().trim().max(40).nullish(),
  governorateCode: z.string().trim().max(8).nullish(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const orderRequestSchema = z.object({
  customer: checkoutFormSchema,
  items: z.array(cartLineSchema).min(1).max(50),
  couponCode: z.string().trim().max(40).nullish(),
  paymentMethod: z.literal("COD"),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

export function normalizeCheckout(values: CheckoutFormValues) {
  const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
  return {
    fullName: collapse(values.fullName),
    phone: normalizeIraqiPhone(values.phone) as string,
    governorateCode: values.governorateCode.trim().toUpperCase(),
    district: collapse(values.district),
    address: collapse(values.address),
    notes: values.notes ? values.notes.trim() || null : null,
  };
}
