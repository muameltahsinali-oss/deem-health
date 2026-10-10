import "server-only";
import { cache } from "react";
import type { StoreSettings } from "@prisma/client";
import { siteConfig } from "@/config/site";
import { db } from "./db";

export const DEFAULT_SETTINGS: Omit<StoreSettings, "updatedAt"> = {
  id: 1,
  storeName: "Deem Health",
  contactPhone: null,
  whatsapp: null,
  contactEmail: null,
  address: null,
  instagramUrl: null,
  facebookUrl: null,
  lowStockThreshold: 5,
  freeShippingThreshold: null,
  maxQuantityPerItem: 10,
  announcementEnabled: false,
  announcementText: null,
};

export type Settings = Omit<StoreSettings, "updatedAt">;

/** Values written by the demo seed — treated as "not set" so the real contact details apply. */
const isDemoPhone = (v: string | null | undefined) => !v || /^(\+?964|0)?7700000000$/.test(v.replace(/[\s-]/g, ""));
const isDemoEmail = (v: string | null | undefined) => !v || /@example\.(com|org)$/i.test(v);

/**
 * Singleton settings row (falls back to defaults if the row is missing).
 * Empty or demo contact fields fall back to siteConfig.contact.
 */
export const getStoreSettings = cache(async (): Promise<Settings> => {
  const row = (await db.storeSettings.findUnique({ where: { id: 1 } })) ?? DEFAULT_SETTINGS;
  const { contact } = siteConfig;
  return {
    ...row,
    whatsapp: isDemoPhone(row.whatsapp) ? contact.whatsapp : row.whatsapp,
    contactPhone: isDemoPhone(row.contactPhone) ? contact.whatsapp : row.contactPhone,
    contactEmail: isDemoEmail(row.contactEmail) ? null : row.contactEmail,
    instagramUrl: row.instagramUrl?.trim() || contact.instagramUrl,
  };
});

export const getActiveShippingRates = cache(async () => {
  return db.shippingRate.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { governorateCode: true, name: true, fee: true },
  });
});

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "").replace(/^0/, "964");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
