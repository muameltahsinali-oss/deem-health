/**
 * Marketing attribution — captured client-side from the landing URL, stored in a first-party
 * cookie (so the server can read it when the order is created), then saved on the Order.
 * Model: last non-direct touch (a new visit with UTM/fbclid replaces the stored values).
 */
export const ATTRIBUTION_COOKIE = "dh_attr";
export const ATTRIBUTION_MAX_AGE_DAYS = 30;
export const SESSION_COOKIE = "dh_sid";
export const SESSION_TTL_MINUTES = 30;

export type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  landingPage: string | null;
  referrer: string | null;
  capturedAt: number;
};

const PARAM_MAP: Array<[keyof Attribution, string]> = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmContent", "utm_content"],
  ["utmTerm", "utm_term"],
  ["fbclid", "fbclid"],
];

const clip = (v: string | null | undefined, max = 200) => (v ? v.slice(0, max) : null);

/** Returns attribution when the URL carries campaign parameters, otherwise null (keep existing). */
export function attributionFromUrl(url: URL, referrer: string | null, now = Date.now()): Attribution | null {
  const values: Partial<Attribution> = {};
  let hasCampaign = false;
  for (const [key, param] of PARAM_MAP) {
    const v = url.searchParams.get(param)?.trim();
    if (v) {
      (values as Record<string, string>)[key] = clip(v, key === "fbclid" ? 500 : 200) as string;
      hasCampaign = true;
    }
  }
  if (!hasCampaign) return null;
  return {
    utmSource: values.utmSource ?? null,
    utmMedium: values.utmMedium ?? null,
    utmCampaign: values.utmCampaign ?? null,
    utmContent: values.utmContent ?? null,
    utmTerm: values.utmTerm ?? null,
    fbclid: values.fbclid ?? null,
    landingPage: clip(url.pathname + url.search, 500),
    referrer: clip(referrer, 500),
    capturedAt: now,
  };
}

/** Referral-only attribution (no UTM): e.g. a visit from instagram.com. Used only if nothing stored. */
export function referralAttribution(url: URL, referrer: string | null, now = Date.now()): Attribution | null {
  if (!referrer) return null;
  try {
    const refHost = new URL(referrer).hostname.replace(/^www\./, "");
    if (!refHost || refHost === url.hostname.replace(/^www\./, "")) return null;
    return {
      utmSource: refHost,
      utmMedium: "referral",
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      fbclid: null,
      landingPage: clip(url.pathname + url.search, 500),
      referrer: clip(referrer, 500),
      capturedAt: now,
    };
  } catch {
    return null;
  }
}

export function serializeAttribution(a: Attribution): string {
  return encodeURIComponent(JSON.stringify(a));
}

export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const str = (k: string, max = 200) => (typeof obj[k] === "string" ? (obj[k] as string).slice(0, max) : null);
    return {
      utmSource: str("utmSource"),
      utmMedium: str("utmMedium"),
      utmCampaign: str("utmCampaign"),
      utmContent: str("utmContent"),
      utmTerm: str("utmTerm"),
      fbclid: str("fbclid", 500),
      landingPage: str("landingPage", 500),
      referrer: str("referrer", 500),
      capturedAt: typeof obj.capturedAt === "number" ? obj.capturedAt : 0,
    };
  } catch {
    return null;
  }
}

/** Human label for admin: "facebook / cpc · summer_sale" or "مباشر". */
export function describeSource(a: {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  fbclid?: string | null;
}): string {
  if (!a.utmSource && !a.utmMedium && !a.utmCampaign) return a.fbclid ? "facebook (fbclid)" : "مباشر / غير معروف";
  const main = [a.utmSource, a.utmMedium].filter(Boolean).join(" / ");
  return a.utmCampaign ? `${main} · ${a.utmCampaign}` : main;
}
