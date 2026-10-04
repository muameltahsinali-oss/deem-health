import { createHash } from "node:crypto";
import { iraqiPhoneToE164Digits } from "@/lib/phone";
import type { MetaEventName, TrackContent } from "@/features/tracking/events";

/**
 * Pure Meta Conversions API payload construction (no I/O) — unit tested.
 * Spec: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
 */

const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");

/** Meta normalisation for names/city/state: lowercase, strip punctuation & whitespace, keep UTF-8 letters. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

export function hashEmail(email: string): string | null {
  const v = email.trim().toLowerCase();
  return v.includes("@") ? sha256(v) : null;
}

export function hashPhone(localPhone: string): string | null {
  const digits = iraqiPhoneToE164Digits(localPhone);
  return digits ? sha256(digits) : null;
}

export function hashText(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = normalizeText(value);
  return v ? sha256(v) : null;
}

/** "زينب علي حسن" → first "زينب", last "علي حسن" */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export type CapiUserInput = {
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  countryCode?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type CapiUserData = Partial<{
  em: string[];
  ph: string[];
  fn: string[];
  ln: string[];
  ct: string[];
  st: string[];
  country: string[];
  external_id: string[];
  client_ip_address: string;
  client_user_agent: string;
  fbp: string;
  fbc: string;
}>;

/** Hashes PII (SHA-256 after normalisation). Technical identifiers (IP, UA, fbp, fbc) are sent as-is, per Meta. */
export function buildUserData(input: CapiUserInput): CapiUserData {
  const out: CapiUserData = {};
  const em = input.email ? hashEmail(input.email) : null;
  const ph = input.phone ? hashPhone(input.phone) : null;
  const fn = hashText(input.firstName);
  const ln = hashText(input.lastName);
  const ct = hashText(input.city);
  const st = hashText(input.state);
  const country = input.countryCode ? sha256(input.countryCode.trim().toLowerCase()) : null;
  const ext = input.externalId ? sha256(input.externalId.trim()) : null;
  if (em) out.em = [em];
  if (ph) out.ph = [ph];
  if (fn) out.fn = [fn];
  if (ln) out.ln = [ln];
  if (ct) out.ct = [ct];
  if (st) out.st = [st];
  if (country) out.country = [country];
  if (ext) out.external_id = [ext];
  if (input.ip) out.client_ip_address = input.ip;
  if (input.userAgent) out.client_user_agent = input.userAgent;
  if (input.fbp) out.fbp = input.fbp;
  if (input.fbc) out.fbc = input.fbc;
  return out;
}

export type CapiCustomDataInput = {
  currency?: string;
  value?: number;
  contentIds?: string[];
  contents?: TrackContent[];
  contentName?: string;
  contentCategory?: string;
  numItems?: number;
  orderId?: string;
  searchString?: string;
};

export function buildCustomData(input: CapiCustomDataInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.currency) data.currency = input.currency;
  if (typeof input.value === "number" && Number.isFinite(input.value)) data.value = input.value;
  if (input.contentIds?.length) {
    data.content_ids = input.contentIds;
    data.content_type = "product";
  }
  if (input.contents?.length) {
    data.contents = input.contents.map((c) => ({ id: c.id, quantity: c.quantity, item_price: c.item_price }));
    data.content_type = "product";
  }
  if (input.contentName) data.content_name = input.contentName;
  if (input.contentCategory) data.content_category = input.contentCategory;
  if (typeof input.numItems === "number") data.num_items = input.numItems;
  if (input.orderId) data.order_id = input.orderId;
  if (input.searchString) data.search_string = input.searchString;
  return data;
}

export type CapiServerEvent = {
  event_name: MetaEventName;
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url?: string;
  user_data: CapiUserData;
  custom_data: Record<string, unknown>;
};

export function buildServerEvent(args: {
  name: MetaEventName;
  eventId: string;
  eventTime?: Date;
  eventSourceUrl?: string | null;
  user: CapiUserInput;
  customData: CapiCustomDataInput;
}): CapiServerEvent {
  const event: CapiServerEvent = {
    event_name: args.name,
    event_time: Math.floor((args.eventTime ?? new Date()).getTime() / 1000),
    event_id: args.eventId,
    action_source: "website",
    user_data: buildUserData(args.user),
    custom_data: buildCustomData(args.customData),
  };
  if (args.eventSourceUrl) event.event_source_url = args.eventSourceUrl;
  return event;
}

/** Request body for POST /{pixel_id}/events. The access token is added by the sender, never logged. */
export function buildRequestBody(events: CapiServerEvent[], testEventCode?: string | null) {
  return testEventCode ? { data: events, test_event_code: testEventCode } : { data: events };
}

/** Browser cookie `_fbc` format from a click id: fb.1.<ms timestamp>.<fbclid> */
export function fbcFromFbclid(fbclid: string, now: Date = new Date()): string {
  return `fb.1.${now.getTime()}.${fbclid}`;
}
