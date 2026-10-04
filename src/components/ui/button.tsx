import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "danger-ghost" | "danger-outline" | "light";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-950";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-plum-950 text-paper hover:bg-plum-800 shadow-soft",
  accent: "bg-sun-300 text-plum-950 hover:bg-sun-400 shadow-soft",
  secondary: "bg-lavender-100 text-plum-950 hover:bg-lavender-200",
  outline: "border border-line-strong bg-paper text-plum-950 hover:border-plum-950",
  ghost: "text-plum-950 hover:bg-lavender-100",
  danger: "bg-danger text-paper hover:opacity-90",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  "danger-outline": "border border-danger/30 bg-paper text-danger hover:border-danger",
  light: "bg-paper text-plum-950 hover:bg-lavender-50 shadow-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
};

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
