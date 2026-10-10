import { describe, expect, it } from "vitest";
import { orderWhatsappMessage } from "@/features/orders/whatsapp-message";
import { whatsappLink } from "@/server/settings";

const order = {
  orderNumber: "DH-20261010-0007",
  customerName: "زينب علي",
  customerPhone: "07701234567",
  governorateName: "بغداد",
  district: "الكرادة",
  address: "زقاق 12، دار 5",
  notes: "الاتصال بعد الساعة 4",
  subtotal: 50000,
  discountTotal: 5000,
  couponCode: "WELCOME10",
  shippingFee: 0,
  total: 45000,
  items: [
    { productName: "ريشارج", quantity: 2, lineTotal: 50000 },
  ],
};

describe("order WhatsApp message", () => {
  it("contains everything needed to confirm and ship the order", () => {
    const text = orderWhatsappMessage(order);
    for (const part of ["DH-20261010-0007", "ريشارج × 2", "50,000 د.ع", "(WELCOME10)", "التوصيل: مجاني", "45,000 د.ع", "زينب علي", "07701234567", "بغداد — الكرادة", "الاتصال بعد الساعة 4"]) {
      expect(text).toContain(part);
    }
  });

  it("omits empty discount and notes", () => {
    const text = orderWhatsappMessage({ ...order, discountTotal: 0, couponCode: null, notes: null, shippingFee: 5000 });
    expect(text).not.toContain("الخصم");
    expect(text).not.toContain("ملاحظات");
    expect(text).toContain("التوصيل: 5,000 د.ع");
  });

  it("builds a wa.me link to the store number with the message", () => {
    const link = whatsappLink("+964 775 061 9457", "مرحباً")!;
    expect(link.startsWith("https://wa.me/9647750619457?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("مرحباً");
    expect(whatsappLink("0775 061 9457")).toBe("https://wa.me/9647750619457");
  });
});
