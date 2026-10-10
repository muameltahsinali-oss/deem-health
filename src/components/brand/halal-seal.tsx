/**
 * Generic "حلال / HALAL" seal in the store's style. Deliberately NOT a certification body's mark
 * (JAKIM, ESMA, …): those are trademarks that may only be shown with that body's certificate.
 * Colour follows `currentColor`.
 */
export function HalalSeal({ className, title = "حلال" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title} fill="none">
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2.5 3" />
      <path d="M22 62h56" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
      <text x="50" y="54" textAnchor="middle" fill="currentColor" fontSize="25" fontWeight="700" fontFamily="inherit" direction="rtl">
        حلال
      </text>
      <text x="50" y="74" textAnchor="middle" fill="currentColor" fontSize="9.5" fontWeight="600" letterSpacing="2.5" fontFamily="inherit">
        HALAL
      </text>
      <path d="M50 17c-4 3-5.5 7-3 10 3-0.5 5-3.5 3-10Z" fill="currentColor" />
    </svg>
  );
}
