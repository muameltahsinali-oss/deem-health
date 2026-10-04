"use client";

import { cn } from "@/lib/cn";
import { MinusIcon, PlusIcon } from "../icons";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "الكمية",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const btn = cn(
    "grid place-items-center rounded-full text-plum-950 transition-colors hover:bg-lavender-100 disabled:opacity-40 disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line-strong bg-paper p-0.5",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة الكمية">
        <PlusIcon size={16} />
      </button>
      <output className={cn("text-center font-medium tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")} aria-live="polite">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص الكمية">
        <MinusIcon size={16} />
      </button>
    </div>
  );
}
