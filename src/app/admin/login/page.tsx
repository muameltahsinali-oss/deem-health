import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";
import { getCurrentAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "تسجيل الدخول — لوحة التحكم", robots: { index: false, follow: false } };

type PageProps = { searchParams: Promise<{ next?: string }> };

export default async function AdminLoginPage({ searchParams }: PageProps) {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");
  const { next } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center bg-lavender-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo className="mx-auto h-11 w-auto text-plum-950" />
        <div className="mt-8 rounded-2xl border border-line bg-paper p-6 shadow-lift sm:p-8">
          <h1 className="text-xl font-bold text-plum-950">لوحة تحكم المتجر</h1>
          <p className="mt-1 text-sm text-muted">سجّل الدخول لإدارة الطلبات والمنتجات.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
