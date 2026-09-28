import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = `DH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const railwayBackend = process.env.RAILWAY_STORAGE_URL || process.env.RAILWAY_BACKEND_URL;

    // If Railway Backend is set, forward the order to Railway for persistent database storage
    if (railwayBackend) {
      try {
        const cleanUrl = railwayBackend.replace(/\/$/, "");
        await fetch(`${cleanUrl}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, orderId }),
        });
      } catch (e) {
        console.warn("Could not forward order to Railway backend:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      orderNumber: orderId,
      message: "تم تسجيل طلبك بنجاح! سيتصل بك فريق ديم هيلث لتأكيد بيانات الشحن والتوصيل.",
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
