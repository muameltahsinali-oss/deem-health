"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "../icons";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone; action?: { label: string; href: string } };

type ToastContextValue = {
  toast: (message: string, options?: { tone?: ToastTone; action?: { label: string; href: string } }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (message, options) => {
      const id = ++counter.current;
      // Keep at most 3 visible and never stack the exact same message twice
      setItems((prev) => [...prev.filter((t) => t.message !== message).slice(-2), { id, message, tone: options?.tone ?? "success", action: options?.action }]);
      window.setTimeout(() => dismiss(id), options?.tone === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {items.map((item) => {
          const Icon = item.tone === "success" ? CheckCircleIcon : item.tone === "error" ? AlertIcon : InfoIcon;
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm animate-fade-in items-center gap-3 rounded-full py-2.5 ps-4 pe-2 text-sm shadow-pill",
                item.tone === "error" ? "bg-danger text-paper" : "bg-plum-950 text-paper",
              )}
            >
              <Icon size={18} className={item.tone === "success" ? "text-sun-300" : undefined} />
              <span className="flex-1">{item.message}</span>
              {item.action && (
                <a href={item.action.href} className="rounded-full bg-sun-300 px-3 py-1 text-xs font-semibold text-plum-950">
                  {item.action.label}
                </a>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="grid size-7 place-items-center rounded-full hover:bg-paper/10"
                aria-label="إغلاق"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
