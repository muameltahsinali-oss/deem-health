import { formatIQD } from "@/lib/format";

type OrderForMessage = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  governorateName: string;
  district: string;
  address: string;
  notes: string | null;
  subtotal: number;
  discountTotal: number;
  couponCode: string | null;
  shippingFee: number;
  total: number;
  items: Array<{ productName: string; quantity: number; lineTotal: number }>;
};

/**
 * The order as a WhatsApp message to the store. Customers send it from the confirmation page, so the
 * order reaches the store's WhatsApp with everything needed to confirm and ship it.
 */
export function orderWhatsappMessage(order: OrderForMessage): string {
  const lines = [
    "مرحباً ديم هيلث، أريد تأكيد طلبي 🛍️",
    `رقم الطلب: ${order.orderNumber}`,
    "",
    "المنتجات:",
    ...order.items.map((i) => `• ${i.productName} × ${i.quantity} — ${formatIQD(i.lineTotal)}`),
    "",
    `المجموع: ${formatIQD(order.subtotal)}`,
    ...(order.discountTotal > 0 ? [`الخصم${order.couponCode ? ` (${order.couponCode})` : ""}: − ${formatIQD(order.discountTotal)}`] : []),
    `التوصيل: ${order.shippingFee === 0 ? "مجاني" : formatIQD(order.shippingFee)}`,
    `الإجمالي (الدفع عند الاستلام): ${formatIQD(order.total)}`,
    "",
    `الاسم: ${order.customerName}`,
    `الهاتف: ${order.customerPhone}`,
    `العنوان: ${order.governorateName} — ${order.district}، ${order.address}`,
    ...(order.notes?.trim() ? [`ملاحظات: ${order.notes.trim()}`] : []),
  ];
  return lines.join("\n");
}
