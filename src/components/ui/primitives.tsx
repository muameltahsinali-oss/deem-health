import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "../icons";

export type BadgeTone = "plum" | "lavender" | "sun" | "success" | "danger" | "warning" | "neutral";

const tones: Record<BadgeTone, string> = {
  plum: "bg-plum-950 text-paper",
  lavender: "bg-lavender-100 text-plum-900",
  sun: "bg-sun-300 text-plum-950",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-plum-50 text-muted",
};

export function Badge({ tone = "lavender", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-paper shadow-soft", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-plum-950">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type AlertTone = "info" | "success" | "warning" | "danger";
const alertTones: Record<AlertTone, string> = {
  info: "bg-lavender-50 text-plum-900 border-lavender-200",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
};

export function Alert({ tone = "info", title, children, className }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircleIcon : tone === "info" ? InfoIcon : AlertIcon;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", alertTones[tone], className)}>
      <Icon className="mt-0.5 shrink-0" size={18} />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-6">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-full bg-lavender-100 text-plum-950">{icon}</div>}
      <h2 className="text-lg font-semibold text-plum-950">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
