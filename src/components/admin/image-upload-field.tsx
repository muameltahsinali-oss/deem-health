"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, TrashIcon } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/** Single-image upload bound to a hidden form field (used for category images). */
export function ImageUploadField({ name, defaultValue, label }: { name: string; defaultValue?: string | null; label: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const id = `${name}-file`;

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) toast(json.error ?? "تعذّر رفع الصورة", { tone: "error" });
      else setUrl(json.url);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-plum-950">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-lavender-50 text-subtle">
          {url ? <Image src={url} alt="" fill sizes="64px" className="object-cover" /> : <ImageIcon size={20} />}
        </span>
        <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        <label htmlFor={id} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3.5 text-sm hover:border-plum-950">
          {busy ? <Spinner className="size-4" /> : <ImageIcon size={16} />} {url ? "تغيير" : "رفع صورة"}
        </label>
        {url && (
          <button type="button" onClick={() => setUrl("")} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft" aria-label="إزالة الصورة">
            <TrashIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
