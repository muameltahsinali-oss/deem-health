import { cn } from "@/lib/cn";
import { discountPercent, formatIQD } from "@/lib/format";
import { StarIcon } from "../icons";

export function Price({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pct = discountPercent(price, compareAtPrice);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-semibold text-plum-950 tabular-nums",
          size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base",
        )}
      >
        {formatIQD(price)}
      </span>
      {pct !== null && compareAtPrice && (
        <>
          <span className={cn("text-subtle line-through tabular-nums", size === "lg" ? "text-base" : "text-xs")}>
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatIQD(compareAtPrice)}
          </span>
        </>
      )}
    </div>
  );
}

export function Rating({
  value,
  count,
  size = 14,
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex text-sun-400" role="img" aria-label={`التقييم ${value.toFixed(1)} من 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} size={size} filled={i <= rounded} className={i <= rounded ? undefined : "text-line-strong"} />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-subtle tabular-nums">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
