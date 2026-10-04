import "server-only";
import type { TrackingConfiguration } from "@prisma/client";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { decryptSecret } from "@/server/crypto";

export type ResolvedTrackingConfig = {
  enabled: boolean;
  pixelId: string | null;
  /** Server-only. Never serialise to the client. */
  capiAccessToken: string | null;
  capiTokenLast4: string | null;
  testEventCode: string | null;
  sources: { pixel: "admin" | "env" | null; capi: "admin" | "env" | null };
  capiDecryptError: boolean;
};

const TTL_MS = 30_000;
let cached: { value: ResolvedTrackingConfig; at: number } | null = null;

export function invalidateTrackingConfig() {
  cached = null;
}

/**
 * Admin settings (DB) take priority; environment variables are the fallback.
 * Tracking can be switched off entirely from Admin → Marketing & Tracking.
 */
export async function getTrackingConfig(): Promise<ResolvedTrackingConfig> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  let row: TrackingConfiguration | null = null;
  try {
    row = await db.trackingConfiguration.findUnique({ where: { id: 1 } });
  } catch {
    row = null; // DB unavailable (e.g. during build) → env only
  }

  let capiDecryptError = false;
  let dbToken: string | null = null;
  if (row?.capiAccessTokenEnc) {
    try {
      dbToken = decryptSecret(row.capiAccessTokenEnc, env.encryptionKey);
    } catch {
      capiDecryptError = true;
    }
  }

  const pixelId = row?.metaPixelId?.trim() || env.metaPixelId || null;
  const capiAccessToken = dbToken || env.metaCapiAccessToken || null;

  const value: ResolvedTrackingConfig = {
    enabled: row ? row.trackingEnabled : true,
    pixelId,
    capiAccessToken,
    capiTokenLast4: dbToken ? row?.capiTokenLast4 ?? null : env.metaCapiAccessToken ? env.metaCapiAccessToken.slice(-4) : null,
    testEventCode: row?.testEventCode?.trim() || env.metaTestEventCode || null,
    sources: {
      pixel: row?.metaPixelId?.trim() ? "admin" : env.metaPixelId ? "env" : null,
      capi: dbToken ? "admin" : env.metaCapiAccessToken ? "env" : null,
    },
    capiDecryptError,
  };
  cached = { value, at: Date.now() };
  return value;
}

/** Safe subset for the browser. */
export async function getPublicTrackingConfig(): Promise<{ pixelId: string | null; serverRelay: boolean }> {
  const cfg = await getTrackingConfig();
  if (!cfg.enabled || !cfg.pixelId) return { pixelId: null, serverRelay: false };
  return { pixelId: cfg.pixelId, serverRelay: Boolean(cfg.capiAccessToken) };
}
