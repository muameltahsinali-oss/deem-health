import "server-only";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { canTransition } from "@/features/orders/status";

export class OrderUpdateError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID_TRANSITION") {
    super(code);
  }
}

/**
 * Changes an order's status with an audit trail.
 *  – CANCELLED: returns reserved stock to inventory (once — guarded by `stockRestored`)
 *    and releases the coupon usage so the code can be used again.
 *  – DELIVERED on a COD order: marks the payment as PAID (cash collected by the courier).
 */
export async function changeOrderStatus(orderId: string, to: OrderStatus, adminId: string | null, note?: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { productId: true, quantity: true } }, couponUsage: true },
    });
    if (!order) throw new OrderUpdateError("NOT_FOUND");
    if (order.status === to) return order;
    if (!canTransition(order.status, to)) throw new OrderUpdateError("INVALID_TRANSITION");

    const data: { status: OrderStatus; paymentStatus?: PaymentStatus; stockRestored?: boolean } = { status: to };

    if (to === "CANCELLED" && !order.stockRestored) {
      for (const item of order.items) {
        if (!item.productId) continue; // product deleted since — nothing to restore
        await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      data.stockRestored = true;
      if (order.couponUsage) {
        await tx.couponUsage.delete({ where: { id: order.couponUsage.id } });
        await tx.coupon.updateMany({
          where: { id: order.couponUsage.couponId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
      await tx.orderEvent.create({
        data: { orderId, type: "STOCK_RESTORED", message: "أُعيدت كميات المنتجات إلى المخزون", adminId },
      });
    }

    if (to === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
      data.paymentStatus = "PAID";
      await tx.orderEvent.create({
        data: { orderId, type: "PAYMENT_CHANGED", fromStatus: order.paymentStatus, toStatus: "PAID", message: "تم تحصيل المبلغ عند التسليم", adminId },
      });
    }

    const updated = await tx.order.update({ where: { id: orderId }, data });
    await tx.orderEvent.create({
      data: { orderId, type: "STATUS_CHANGED", fromStatus: order.status, toStatus: to, message: note?.trim() || null, adminId },
    });
    return updated;
  });
}

export async function changePaymentStatus(orderId: string, to: PaymentStatus, adminId: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
    if (!order) throw new OrderUpdateError("NOT_FOUND");
    if (order.paymentStatus === to) return;
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: to } });
    await tx.orderEvent.create({
      data: { orderId, type: "PAYMENT_CHANGED", fromStatus: order.paymentStatus, toStatus: to, adminId },
    });
  });
}

export async function addOrderNote(orderId: string, message: string, adminId: string | null) {
  await db.orderEvent.create({ data: { orderId, type: "NOTE", message: message.trim().slice(0, 1000), adminId } });
}
