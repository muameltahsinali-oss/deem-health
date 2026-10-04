import { siteConfig } from "@/config/site";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function organizationJsonLd(settings: { contactPhone: string | null; instagramUrl: string | null; facebookUrl: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: siteConfig.nameAr,
    url: siteConfig.url,
    logo: absoluteUrl("/images/brand/icon-512.png"),
    sameAs: [settings.instagramUrl, settings.facebookUrl].filter(Boolean),
    ...(settings.contactPhone
      ? { contactPoint: [{ "@type": "ContactPoint", telephone: settings.contactPhone, contactType: "customer service", areaServed: "IQ", availableLanguage: ["ar"] }] }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  slug: string;
  description: string;
  sku: string;
  brand: string | null;
  images: string[];
  price: number;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  categoryName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.categoryName,
    image: p.images.map(absoluteUrl),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${p.slug}`),
      priceCurrency: "IQD",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: siteConfig.name },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IQ" },
      },
    },
    ...(p.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.ratingAvg.toFixed(1)), reviewCount: p.ratingCount } }
      : {}),
  };
}
