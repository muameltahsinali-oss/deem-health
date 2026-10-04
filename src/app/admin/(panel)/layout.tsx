import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { getStoreSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s — لوحة التحكم | ديم هيلث" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const settings = await getStoreSettings();
  const [pendingOrders, lowStock, pendingReviews] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lte: settings.lowStockThreshold } } }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);
  return (
    <AdminShell adminName={admin.name || admin.email} badges={{ pendingOrders, lowStock, pendingReviews }}>
      {children}
    </AdminShell>
  );
}
