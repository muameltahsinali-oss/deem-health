import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Browser tracking abstraction, exercised with a minimal fake DOM:
 *  – Pixel receives the event with the given eventID
 *  – funnel events are relayed to /api/track with the SAME event id (Pixel + CAPI dedup)
 *  – Purchase is never relayed; repeated Purchase calls are suppressed
 */
type Call = unknown[];

let fbqCalls: Call[];
let beacons: Array<{ url: string; body: string }>;

async function freshModule() {
  const mod = await import("@/features/tracking/client");
  return mod;
}

beforeEach(async () => {
  fbqCalls = [];
  beacons = [];
  const fakeDocument = {
    createElement: () => ({}),
    head: { appendChild: () => undefined },
  };
  const g = globalThis as unknown as Record<string, unknown>;
  g.document = fakeDocument;
  g.window = globalThis;
  g.location = { href: "https://deem.example/product/x" };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      sendBeacon: (url: string, blob: Blob) => {
        void blob.text().then((body) => beacons.push({ url, body }));
        return true;
      },
    },
  });
  // Pretend fbevents.js already loaded: record calls
  const fbq = (...args: unknown[]) => {
    fbqCalls.push(args);
  };
  g.fbq = fbq;
});

afterEach(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g.fbq;
  delete g.document;
  delete g.location;
});

describe("trackEvent", () => {
  it("does nothing when no pixel is configured", async () => {
    const { configureTracking, trackEvent } = await freshModule();
    configureTracking({ pixelId: null, serverRelay: false });
    expect(trackEvent({ name: "ViewContent", contentIds: ["p1"] })).toBeNull();
    expect(fbqCalls).toHaveLength(0);
  });

  it("sends AddToCart to the Pixel and relays the same event id to the server", async () => {
    const { configureTracking, trackEvent } = await freshModule();
    configureTracking({ pixelId: "1234567890", serverRelay: true });
    const id = trackEvent({ name: "AddToCart", value: 18_000, currency: "IQD", contentIds: ["p1"] });
    expect(id).toMatch(/^addtocart\./);
    expect(fbqCalls[0]).toEqual([
      "track",
      "AddToCart",
      { value: 18_000, currency: "IQD", content_ids: ["p1"], content_type: "product" },
      { eventID: id },
    ]);
    await new Promise((r) => setTimeout(r, 10));
    expect(beacons).toHaveLength(1);
    expect(beacons[0].url).toBe("/api/track");
    expect(JSON.parse(beacons[0].body)).toMatchObject({ name: "AddToCart", eventId: id });
  });

  it("uses the server-provided Purchase id, never relays Purchase, and suppresses duplicates", async () => {
    const { configureTracking, trackEvent } = await freshModule();
    configureTracking({ pixelId: "1234567890", serverRelay: true });
    const first = trackEvent({ name: "Purchase", eventId: "purchase.srv-1", value: 45_000, currency: "IQD" });
    const second = trackEvent({ name: "Purchase", eventId: "purchase.srv-1", value: 45_000, currency: "IQD" });
    expect(first).toBe("purchase.srv-1");
    expect(second).toBeNull();
    const purchaseCalls = fbqCalls.filter((c) => c[1] === "Purchase");
    expect(purchaseCalls).toHaveLength(1);
    expect(purchaseCalls[0][3]).toEqual({ eventID: "purchase.srv-1" });
    await new Promise((r) => setTimeout(r, 10));
    expect(beacons).toHaveLength(0);
  });

  it("does not relay browser-only events like Search", async () => {
    const { configureTracking, trackEvent } = await freshModule();
    configureTracking({ pixelId: "1234567890", serverRelay: true });
    trackEvent({ name: "Search", searchString: "vitamin" });
    await new Promise((r) => setTimeout(r, 10));
    expect(fbqCalls.some((c) => c[1] === "Search")).toBe(true);
    expect(beacons).toHaveLength(0);
  });
});
