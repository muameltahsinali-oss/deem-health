import { describe, expect, it } from "vitest";
import {
  attributionFromUrl,
  describeSource,
  parseAttribution,
  referralAttribution,
  serializeAttribution,
} from "@/features/attribution/shared";
import { decryptSecret, encryptSecret, hashPassword, verifyPassword } from "@/server/crypto";

describe("attribution", () => {
  it("captures utm parameters and fbclid from the landing URL", () => {
    const url = new URL("https://deem.example/product/x?utm_source=facebook&utm_medium=paid_social&utm_campaign=acv&fbclid=IwAR123");
    const a = attributionFromUrl(url, "https://m.facebook.com/", 1000);
    expect(a).toMatchObject({
      utmSource: "facebook",
      utmMedium: "paid_social",
      utmCampaign: "acv",
      fbclid: "IwAR123",
      landingPage: "/product/x?utm_source=facebook&utm_medium=paid_social&utm_campaign=acv&fbclid=IwAR123",
      referrer: "https://m.facebook.com/",
    });
  });

  it("returns null without campaign parameters (keeps the stored touch)", () => {
    expect(attributionFromUrl(new URL("https://deem.example/shop"), null)).toBeNull();
  });

  it("records external referrals but not internal navigation", () => {
    const url = new URL("https://deem.example/");
    expect(referralAttribution(url, "https://www.instagram.com/")).toMatchObject({ utmSource: "instagram.com", utmMedium: "referral" });
    expect(referralAttribution(url, "https://deem.example/shop")).toBeNull();
  });

  it("round-trips through the cookie format and survives garbage", () => {
    const a = attributionFromUrl(new URL("https://d.example/?utm_source=google"), null, 5)!;
    expect(parseAttribution(serializeAttribution(a))).toEqual(a);
    expect(parseAttribution("%7Bbroken")).toBeNull();
    expect(parseAttribution(undefined)).toBeNull();
  });

  it("describes sources for the admin", () => {
    expect(describeSource({ utmSource: "facebook", utmMedium: "cpc", utmCampaign: "sale" })).toBe("facebook / cpc · sale");
    expect(describeSource({ utmSource: null, utmMedium: null, utmCampaign: null })).toBe("مباشر / غير معروف");
  });
});

describe("crypto", () => {
  const key = Buffer.alloc(32, 7).toString("base64");

  it("encrypts secrets reversibly with AES-GCM and random IVs", () => {
    const a = encryptSecret("EAAB-secret-token", key);
    const b = encryptSecret("EAAB-secret-token", key);
    expect(a).not.toBe(b);
    expect(a).not.toContain("EAAB");
    expect(decryptSecret(a, key)).toBe("EAAB-secret-token");
  });

  it("rejects tampering and wrong keys", () => {
    const enc = encryptSecret("token", key);
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join(":"), key)).toThrow();
    expect(() => decryptSecret(enc, Buffer.alloc(32, 1).toString("base64"))).toThrow();
    expect(() => encryptSecret("x", "short")).toThrow();
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});
