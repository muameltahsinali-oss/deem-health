"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "../icons";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "modal" = centred dialog, "drawer" = full-height side panel (inline-start in RTL = right) */
  variant?: "modal" | "drawer";
  className?: string;
};

/**
 * Accessible dialog built on the native <dialog> element: focus trapping, Esc-to-close and
 * backdrop are handled by the browser — no dependency required.
 */
export function Dialog({ open, onClose, title, children, variant = "modal", className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={cn(
        "max-h-none bg-paper p-0 text-ink",
        variant === "drawer"
          ? "m-0 h-dvh w-[88vw] max-w-sm animate-slide-in-start open:flex open:flex-col"
          : "m-auto w-[calc(100%-2rem)] max-w-lg animate-fade-in rounded-xl shadow-lift",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-plum-950 hover:bg-lavender-100"
          aria-label="إغلاق"
        >
          <CloseIcon size={18} />
        </button>
      </div>
      <div className={cn(variant === "drawer" ? "flex-1 overflow-y-auto" : "max-h-[75vh] overflow-y-auto", "px-5 py-4")}>
        {children}
      </div>
    </dialog>
  );
}
