import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./crypto";
import { env } from "./env";

/**
 * Storage for admin image uploads, always served to the browser by /api/uploads/[...path]
 * (so stored URLs never change, whichever backend holds the bytes):
 *  - STORAGE_URL set (production): the deem-health-backend storage service on Railway, which keeps
 *    files on a persistent Volume. Writes carry the admin's session token, which the storage service
 *    verifies against the same AdminSession table — there is no shared secret to configure.
 *  - otherwise (local development): local disk under UPLOAD_DIR.
 */
const MAX_BYTES = 5 * 1024 * 1024;

const SIGNATURES: Array<{ ext: string; mime: string; test: (b: Buffer) => boolean }> = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

export const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

function uploadRoot() {
  return path.resolve(process.cwd(), env.uploadDir);
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** `adminSessionToken`: the logged-in admin's session cookie (the caller has already verified it). */
export async function saveImageUpload(file: File, adminSessionToken: string): Promise<UploadResult> {
  if (file.size > MAX_BYTES) return { ok: false, error: "حجم الصورة يتجاوز 5 ميغابايت" };
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(buffer)); // trust bytes, not the file name / declared type
  if (!kind) return { ok: false, error: "الصيغ المدعومة: JPG، PNG، WEBP" };
  const now = new Date();
  const folder = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const name = `${randomToken(12)}.${kind.ext}`;
  const url = `/api/uploads/${folder}/${name}`;

  if (env.storageUrl) {
    try {
      const res = await fetch(`${env.storageUrl}/uploads/${folder}/${name}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminSessionToken}`, "Content-Type": kind.mime },
        body: new Uint8Array(buffer),
        cache: "no-store",
      });
      if (!res.ok) {
        console.error(`Image storage rejected the upload: ${res.status}`);
        return { ok: false, error: "تعذّر حفظ الصورة، حاول مرة أخرى" };
      }
      return { ok: true, url };
    } catch (err) {
      console.error("Image storage unreachable", err);
      return { ok: false, error: "تعذّر الاتصال بخدمة تخزين الصور" };
    }
  }

  // No persistent disk on serverless hosts — refuse instead of silently losing the file
  if (env.isServerless) return { ok: false, error: "خدمة تخزين الصور غير مهيأة (STORAGE_URL)" };
  const dir = path.join(uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { ok: true, url };
}

/** Reads an uploaded file, refusing anything outside the upload root. */
export async function readUpload(segments: string[]): Promise<{ data: Buffer; mime: string } | null> {
  if (segments.length !== 2) return null;
  const [folder, name] = segments;
  if (!/^\d{6}$/.test(folder) || !/^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(name)) return null;
  const mime = MIME_BY_EXT[name.split(".").pop() as string];

  if (env.storageUrl) {
    try {
      // Not stored in Next's data cache (images can exceed its 2 MB item limit); the immutable
      // Cache-Control on /api/uploads/* lets the CDN and next/image cache the response instead.
      const res = await fetch(`${env.storageUrl}/uploads/${folder}/${name}`, { cache: "no-store" });
      if (!res.ok) return null;
      return { data: Buffer.from(await res.arrayBuffer()), mime };
    } catch {
      return null;
    }
  }

  const root = uploadRoot();
  const full = path.resolve(root, folder, name);
  if (!full.startsWith(root + path.sep)) return null;
  try {
    const data = await readFile(full);
    return { data, mime };
  } catch {
    return null;
  }
}
