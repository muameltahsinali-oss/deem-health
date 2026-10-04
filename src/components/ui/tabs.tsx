"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: ReactNode; content: ReactNode };

/** WAI-ARIA tabs with arrow-key navigation (RTL-aware: ArrowLeft moves forward in RTL). */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const rtl = document.documentElement.dir === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    let next = index;
    if (e.key === forward) next = (index + 1) % items.length;
    else if (e.key === backward) next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    setActive(items[next].id);
    refs.current[next]?.focus();
  }

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div role="tablist" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {items.map((item, i) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
                selected ? "text-plum-950" : "text-subtle hover:text-plum-950",
              )}
            >
              {item.label}
              {selected && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-plum-950" />}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className="py-6 focus-visible:outline-none"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
