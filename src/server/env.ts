import "server-only";

/**
 * Server-only environment access. Nothing in this file may be imported by client components.
 * Values are read lazily so `next build` works without secrets present.
 */
export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  /** 32-byte key, base64. Used to encrypt secrets stored in the DB (Meta CAPI token). */
  get encryptionKey() {
    return process.env.APP_ENCRYPTION_KEY ?? "";
  },
  /** META_PIXEL_ID is read at runtime; NEXT_PUBLIC_META_PIXEL_ID is inlined at build time by Next.js. */
  get metaPixelId() {
    return process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  },
  get metaCapiAccessToken() {
    return process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
  },
  get metaTestEventCode() {
    return process.env.META_TEST_EVENT_CODE?.trim() || "";
  },
  get metaGraphApiVersion() {
    return process.env.META_GRAPH_API_VERSION?.trim() || "v23.0";
  },
  get uploadDir() {
    return process.env.UPLOAD_DIR?.trim() || "storage/uploads";
  },
  /** Image storage service (deem-health-backend on Railway). Empty = local disk (development). */
  get storageUrl() {
    return (process.env.STORAGE_URL?.trim() ?? "").replace(/\/$/, "");
  },
  /** Serverless host (Vercel) — no persistent disk, so uploads must go to the storage service. */
  get isServerless() {
    return Boolean(process.env.VERCEL);
  },
  get adminSessionDays() {
    const n = Number(process.env.ADMIN_SESSION_DAYS ?? 7);
    return Number.isFinite(n) && n > 0 ? n : 7;
  },
};
