"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FilterIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { trackEvent } from "@/features/tracking/client";
import { t } from "@/i18n";

export function SortSelect({
  value,
  hidden,
  action,
}: {
  value: string;
  hidden: Record<string, string | undefined>;
  action: string;
}) {
  return (
    <form action={action} method="get" className="flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="sort" className="sr-only sm:not-sr-only sm:text-sm sm:whitespace-nowrap sm:text-muted">
        {t.shop.sort}
      </label>
      <Select
        id="sort"
        name="sort"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-10 w-40 rounded-full text-sm sm:w-48"
      >
        <option value="featured">{t.shop.sortFeatured}</option>
        <option value="newest">{t.shop.sortNewest}</option>
        <option value="price_asc">{t.shop.sortPriceAsc}</option>
        <option value="price_desc">{t.shop.sortPriceDesc}</option>
        <option value="top_rated">{t.shop.sortTopRated}</option>
      </Select>
      <noscript>
        <button type="submit" className="text-sm underline">
          {t.shop.apply}
        </button>
      </noscript>
    </form>
  );
}

export function MobileFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-paper px-4 text-sm font-medium text-plum-950 lg:hidden"
      >
        <FilterIcon size={18} />
        {t.shop.filters}
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-sun-300 text-[0.7rem] font-semibold">{activeCount}</span>
        )}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.shop.filters} variant="drawer">
        {children}
      </Dialog>
    </>
  );
}

/** Fires the Meta "Search" event once per query. */
export function TrackSearch({ query, resultCount }: { query: string; resultCount: number }) {
  useEffect(() => {
    if (query) trackEvent({ name: "Search", searchString: query, numItems: resultCount });
  }, [query, resultCount]);
  return null;
}
