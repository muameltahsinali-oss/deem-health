"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { BagIcon, ChevronLeftIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import { useCart } from "@/features/cart/cart-store";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

type NavCategory = { name: string; slug: string };

function SearchForm({ className, autoFocus, id }: { className?: string; autoFocus?: boolean; id: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {t.common.search}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        placeholder={t.common.searchPlaceholder}
        className="h-11 w-full rounded-full border border-line bg-lavender-50 ps-11 pe-4 text-sm text-ink placeholder:text-subtle focus:border-plum-950 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-lavender-300"
      />
      <button type="submit" className="absolute start-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-plum-950" aria-label={t.common.search}>
        <SearchIcon size={18} />
      </button>
    </form>
  );
}

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/shop", label: t.nav.allProducts },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: "/shop?sale=1", label: t.nav.offers },
  ];

  const isActive = (href: string) => (href === "/shop" ? pathname === "/shop" : pathname.startsWith(href.split("?")[0]) && href !== "/shop?sale=1");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="container-page">
        <div className="flex h-16 items-center gap-3 lg:h-20 lg:gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ms-2 grid size-11 place-items-center rounded-full text-plum-950 hover:bg-lavender-100 lg:hidden"
            aria-label={t.common.menu}
            aria-expanded={menuOpen}
          >
            <MenuIcon size={22} />
          </button>

          <Link href="/" className="shrink-0 text-plum-950" aria-label={`${t.common.brand} — ${t.common.home}`}>
            <Logo className="h-8 w-auto lg:h-10" />
          </Link>

          <nav aria-label={t.nav.categories} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm transition-colors",
                      isActive(l.href) ? "bg-lavender-100 font-medium text-plum-950" : "text-muted hover:text-plum-950",
                      l.href === "/shop?sale=1" && "text-plum-950",
                    )}
                    aria-current={isActive(l.href) ? "page" : undefined}
                  >
                    {l.href === "/shop?sale=1" && <span className="me-1.5 inline-block size-1.5 rounded-full bg-sun-400 align-middle" />}
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <SearchForm id="header-search" className="hidden w-72 md:block xl:w-80" />
            <Link
              href="/cart"
              className="relative grid size-11 place-items-center rounded-full text-plum-950 hover:bg-lavender-100"
              aria-label={`${t.common.cart} (${ready ? count : 0})`}
            >
              <BagIcon size={23} />
              {ready && count > 0 && (
                <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sun-300 px-1 text-[0.7rem] font-semibold text-plum-950 tabular-nums ring-2 ring-paper">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <SearchForm id="header-search-mobile" className="pb-3 md:hidden" />
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title={t.common.menu} variant="drawer">
        <nav aria-label={t.nav.categories}>
          <ul className="-mx-2 space-y-1">
            <li>
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-base hover:bg-lavender-50">
                {t.common.home}
                <ChevronLeftIcon size={18} className="text-subtle" />
              </Link>
            </li>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-base hover:bg-lavender-50",
                    isActive(l.href) && "bg-lavender-100 font-medium",
                  )}
                >
                  {l.label}
                  <ChevronLeftIcon size={18} className="text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 rounded-lg bg-lavender-50 p-4 text-sm leading-6 text-muted">{t.announcement.cod}</div>
      </Dialog>
    </header>
  );
}
