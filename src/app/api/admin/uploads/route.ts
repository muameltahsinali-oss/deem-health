import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth";
import { saveImageUpload } from "@/server/uploads";
import { isSameOrigin } from "@/server/request";

/** Admin-only image upload (multipart/form-data, field "file"). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });

  const result = await saveImageUpload(file);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ url: result.url }, { status: 201 });
}
