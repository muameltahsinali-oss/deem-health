import { readUpload } from "@/server/uploads";

type Ctx = { params: Promise<{ path: string[] }> };

/** Serves admin-uploaded product/category images from UPLOAD_DIR (immutable, random names). */
export async function GET(_request: Request, { params }: Ctx) {
  const { path } = await params;
  const file = await readUpload(path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
