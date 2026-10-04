"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import {
  BoxIcon,
  ChartIcon,
  CloseIcon,
  ExternalIcon,
  FolderIcon,
  GridIcon,
  LogoutIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageIcon,
  OrdersIcon,
  SettingsIcon,
  StackIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/server/admin/auth-actions";

const NAV = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: GridIcon },
  { href: "/admin/orders", label: "الطلبات", icon: OrdersIcon, badgeKey: "pendingOrders" as const },
  { href: "/admin/products", label: "المنتجات", icon: BoxIcon },
  { href: "/admin/categories", label: "الأقسام", icon: FolderIcon },
  { href: "/admin/customers", label: "العملاء", icon: UsersIcon },
  { href: "/admin/coupons", label: "كوبونات الخصم", icon: TagIcon },
  { href: "/admin/inventory", label: "المخزون", icon: StackIcon, badgeKey: "lowStock" as const },
  { href: "/admin/reviews", label: "التقييمات", icon: MessageIcon, badgeKey: "pendingReviews" as const },
  { href: "/admin/analytics", label: "التحليلات", icon: ChartIcon },
  { href: "/admin/marketing", label: "التسويق والتتبع", icon: MegaphoneIcon },
  { href: "/admin/settings", label: "الإعدادات", icon: SettingsIcon },
];

export type AdminBadges = { pendingOrders: number; lowStock: number; pendingReviews: number };

function NavList({ badges, onNavigate }: { badges: AdminBadges; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-paper/10 font-medium text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper",
              )}
            >
              <Icon size={19} className={active ? "text-sun-300" : undefined} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sun-300 px-1.5 text-[0.7rem] font-semibold text-plum-950 tabular-nums">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ children, adminName, badges }: { children: ReactNode; adminName: string; badges: AdminBadges }) {
  const [open, setOpen] = useState(false);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-plum-950 px-3 py-5 text-paper">
      <div className="flex items-center justify-between px-3">
        <Link href="/admin/dashboard" onClick={onNavigate} className="text-paper" aria-label="لوحة التحكم">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>
      <p className="mt-2 px-3 text-[0.7rem] tracking-wide text-paper/40">لوحة التحكم</p>
      <nav aria-label="قائمة الإدارة" className="mt-6 flex-1 overflow-y-auto">
        <NavList badges={badges} onNavigate={onNavigate} />
      </nav>
      <div className="mt-4 space-y-1 border-t border-paper/10 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-paper/65 hover:bg-paper/5 hover:text-paper"
        >
          <ExternalIcon size={18} /> عرض المتجر
        </a>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-paper/65 hover:bg-paper/5 hover:text-paper">
            <LogoutIcon size={18} /> تسجيل الخروج
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-xs text-paper/40">{adminName}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar()}</aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full hover:bg-lavender-100" aria-label="القائمة">
          <MenuIcon size={22} />
        </button>
        <Logo className="h-7 w-auto text-plum-950" />
        <span className="w-10" />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="قائمة الإدارة">
          <button type="button" className="absolute inset-0 bg-plum-950/50" aria-label="إغلاق" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 animate-slide-in-start">
            {sidebar(() => setOpen(false))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 end-3 grid size-9 place-items-center rounded-full text-paper hover:bg-paper/10"
              aria-label="إغلاق"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
