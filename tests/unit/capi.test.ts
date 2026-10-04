import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildCustomData,
  buildRequestBody,
  buildServerEvent,
  buildUserData,
  fbcFromFbclid,
  hashPhone,
  normalizeText,
  splitFullName,
} from "@/server/tracking/capi-payload";
import { BROWSER_RELAYED_EVENTS, isBrowserRelayedEvent, newEventId } from "@/features/tracking/events";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

describe("Conversions API user data", () => {
  it("hashes the phone in E.164 digits (964…) per Meta normalisation", () => {
    expect(hashPhone("0770 123 4567")).toBe(sha("9647701234567"));
    expect(hashPhone("invalid")).toBeNull();
  });

  it("normalises and hashes names, city, state, country and external id", () => {
    const u = buildUserData({
      phone: "07701234567",
      firstName: " Zainab ",
      lastName: "Ali-Hassan",
      city: "Al Karrada",
      state: "بغداد",
      countryCode: "IQ",
      externalId: "cust_123",
      ip: "1.2.3.4",
      userAgent: "UA",
      fbp: "fb.1.1.2",
      fbc: "fb.1.1.abc",
    });
    expect(u.ph).toEqual([sha("9647701234567")]);
    expect(u.fn).toEqual([sha("zainab")]);
    expect(u.ln).toEqual([sha("alihassan")]);
    expect(u.ct).toEqual([sha("alkarrada")]);
    expect(u.st).toEqual([sha("بغداد")]);
    expect(u.country).toEqual([sha("iq")]);
    expect(u.external_id).toEqual([sha("cust_123")]);
    // technical identifiers are NOT hashed
    expect(u.client_ip_address).toBe("1.2.3.4");
    expect(u.client_user_agent).toBe("UA");
    expect(u.fbp).toBe("fb.1.1.2");
    expect(u.fbc).toBe("fb.1.1.abc");
  });

  it("omits empty fields instead of hashing empty strings", () => {
    const u = buildUserData({ phone: null, firstName: "", lastName: "" });
    expect(u).toEqual({});
  });

  it("keeps Arabic letters when normalising", () => {
    expect(normalizeText("زينب علي!")).toBe("زينبعلي");
  });

  it("splits full names", () => {
    expect(splitFullName("زينب علي حسن")).toEqual({ firstName: "زينب", lastName: "علي حسن" });
    expect(splitFullName("زينب")).toEqual({ firstName: "زينب", lastName: "" });
  });
});

describe("Conversions API payload", () => {
  it("builds a Purchase event with the shared event_id", () => {
    const event = buildServerEvent({
      name: "Purchase",
      eventId: "purchase.abc123",
      eventTime: new Date("2026-09-27T12:00:00Z"),
      eventSourceUrl: "https://deem.example/checkout",
      user: { phone: "07701234567" },
      customData: {
        currency: "IQD",
        value: 45_000,
        orderId: "DH-20260927-0001",
        contents: [{ id: "p1", quantity: 2, item_price: 20_000 }],
        numItems: 2,
      },
    });
    expect(event).toMatchObject({
      event_name: "Purchase",
      event_id: "purchase.abc123",
      event_time: 1790510400,
      action_source: "website",
      event_source_url: "https://deem.example/checkout",
      custom_data: {
        currency: "IQD",
        value: 45_000,
        order_id: "DH-20260927-0001",
        content_type: "product",
        contents: [{ id: "p1", quantity: 2, item_price: 20_000 }],
        num_items: 2,
      },
    });
    expect(event.user_data.ph).toHaveLength(1);
  });

  it("adds test_event_code only when configured and never embeds a token", () => {
    const e = buildServerEvent({ name: "ViewContent", eventId: "x.1", user: {}, customData: {} });
    expect(buildRequestBody([e], null)).toEqual({ data: [e] });
    expect(buildRequestBody([e], "TEST123")).toEqual({ data: [e], test_event_code: "TEST123" });
    expect(JSON.stringify(buildRequestBody([e], null))).not.toContain("access_token");
  });

  it("builds custom data only from provided values", () => {
    expect(buildCustomData({})).toEqual({});
    expect(buildCustomData({ contentIds: ["a"], value: 0, currency: "IQD" })).toEqual({
      content_ids: ["a"],
      content_type: "product",
      value: 0,
      currency: "IQD",
    });
  });

  it("creates the _fbc format from a click id", () => {
    expect(fbcFromFbclid("ABC", new Date(1_700_000_000_000))).toBe("fb.1.1700000000000.ABC");
  });
});

describe("event ids & relay rules", () => {
  it("generates unique, prefixed event ids", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newEventId("addtocart")));
    expect(ids.size).toBe(500);
    expect([...ids][0].startsWith("addtocart.")).toBe(true);
  });

  it("never relays Purchase from the browser (server-only from real orders)", () => {
    expect(isBrowserRelayedEvent("Purchase")).toBe(false);
    expect([...BROWSER_RELAYED_EVENTS]).toEqual(["ViewContent", "AddToCart", "InitiateCheckout"]);
  });
});
