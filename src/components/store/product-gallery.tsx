"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export function ProductGallery({ images, name }: { images: Array<{ id: string; url: string; alt: string | null }>; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-lavender-50">
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority={active === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-subtle">
            <svg className="size-20 opacity-30 text-lavender-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
            <span className="text-center text-sm font-medium text-subtle">{name}</span>
            <span className="rounded-full bg-lavender-100 px-3 py-1 text-xs text-plum-900">صورة المنتج ستتوفر قريباً</span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div role="group" aria-label={t.product.gallery} className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${t.product.gallery} ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-lg border-2 bg-lavender-50 transition-colors sm:size-20",
                i === active ? "border-plum-950" : "border-transparent hover:border-line-strong",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
