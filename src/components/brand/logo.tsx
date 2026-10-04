import { LOGO_VIEWBOX, MARK_PATH, MARK_VIEWBOX, WORDMARK_PATH } from "./logo-paths";

type LogoProps = {
  /** "full" = D-leaf symbol + "Deem health" wordmark, "mark" = symbol only */
  variant?: "full" | "mark";
  className?: string;
  title?: string;
};

/**
 * Official Deem Health logo, vector-extracted from the brand identity PDF.
 * Colour follows `currentColor` — use text-plum-950 on light surfaces, text-paper on plum/lavender
 * (the four approved lock-ups from the identity: plum, lavender, yellow and white backgrounds).
 */
export function Logo({ variant = "full", className, title = "Deem Health" }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg viewBox={MARK_VIEWBOX} className={className} role="img" aria-label={title} fill="currentColor">
        <path d={MARK_PATH} />
      </svg>
    );
  }
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label={title} fill="currentColor">
      <path d={MARK_PATH} />
      <path d={WORDMARK_PATH} />
    </svg>
  );
}
