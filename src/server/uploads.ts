import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./crypto";
import { env } from "./env";

/**
 * Local-disk storage for admin image uploads, served by /api/uploads/[...path].
 * Works on any Node host with a persistent disk (VPS, Docker volume, Railway volume).
 * For serverless hosts, replace these two functions with an object-storage client (S3/R2).
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

export async function saveImageUpload(file: File): Promise<UploadResult> {
  if (file.size > MAX_BYTES) return { ok: false, error: "حجم الصورة يتجاوز 5 ميغابايت" };
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(buffer)); // trust bytes, not the file name / declared type
  if (!kind) return { ok: false, error: "الصيغ المدعومة: JPG، PNG، WEBP" };
  const now = new Date();
  const folder = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const name = `${randomToken(12)}.${kind.ext}`;
  const dir = path.join(uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { ok: true, url: `/api/uploads/${folder}/${name}` };
}

/** Reads an uploaded file, refusing anything outside the upload root. */
export async function readUpload(segments: string[]): Promise<{ data: Buffer; mime: string } | null> {
  if (segments.length !== 2) return null;
  const [folder, name] = segments;
  if (!/^\d{6}$/.test(folder) || !/^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(name)) return null;
  const root = uploadRoot();
  const full = path.resolve(root, folder, name);
  if (!full.startsWith(root + path.sep)) return null;
  try {
    const data = await readFile(full);
    return { data, mime: MIME_BY_EXT[name.split(".").pop() as string] };
  } catch {
    return null;
  }
}
