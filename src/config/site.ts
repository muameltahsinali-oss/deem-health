/**
 * Static site configuration. Business-editable values (contact info, thresholds…)
 * live in the StoreSettings table instead — see src/server/settings.ts.
 */
export const siteConfig = {
  name: "Deem Health",
  nameAr: "ديم هيلث",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "ar-IQ",
  language: "ar",
  direction: "rtl" as const,
  currency: "IQD",
  country: "IQ",
  timeZone: "Asia/Baghdad",
  /** Baghdad has used a fixed UTC+3 offset (no DST) since 2008. */
  utcOffsetMinutes: 180,
  description:
    "ديم هيلث — متجر فيتامينات ومكملات غذائية ومنتجات العناية بالوزن والمقويات، توصيل لجميع محافظات العراق والدفع عند الاستلام.",
  ogImage: "/images/brand/og.jpg",
  /**
   * Store contact defaults. Used whenever the admin settings leave a field empty (or still hold the
   * demo seed value); a value saved in Admin → Settings always wins.
   * WhatsApp is also where customers send their orders after checkout.
   */
  contact: {
    whatsapp: "+964 775 061 9457",
    instagramUrl: "https://www.instagram.com/deem.health",
  },
} as const;

export type SiteConfig = typeof siteConfig;
