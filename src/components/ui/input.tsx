import { forwardRef, type ComponentProps, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Applies default height/radius only when the caller didn't pass its own (no class-merge dependency). */
function withDefaults(className: string | undefined, height: string, radius = "rounded-md") {
  const c = className ?? "";
  const has = (re: RegExp) => re.test(c);
  return cn(
    has(/(^|\s)h-/) ? "" : height,
    has(/(^|\s)rounded(-|\s|$)/) ? "" : radius,
    has(/(^|\s)text-(xs|sm|base|lg|\[)/) ? "" : "text-[0.95rem]",
    c,
  );
}

const control =
  "w-full border bg-paper px-4 text-ink placeholder:text-subtle transition-colors focus:border-plum-950 focus:outline-none focus:ring-2 focus:ring-lavender-300 disabled:cursor-not-allowed disabled:bg-lavender-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger-soft";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, "border-line-strong", withDefaults(className, "h-12"))} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 3, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(control, "border-line-strong py-3 leading-7", withDefaults(className, ""))} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(control, "appearance-none border-line-strong pe-10", withDefaults(className, "h-12"))}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
});

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-plum-950", className)}>
      {children}
    </label>
  );
}

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error, with the error wired to aria-describedby by id convention `${id}-error`. */
export function Field({ id, label, error, hint, optional, optionalLabel = "اختياري", children, className }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ms-1 text-xs font-normal text-subtle">({optionalLabel})</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label htmlFor={id} className={cn("flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink", className)}>
      <input id={id} type="checkbox" className="size-4.5 rounded accent-plum-950" {...props} />
      <span>{label}</span>
    </label>
  );
}
