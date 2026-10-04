"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/primitives";

export type FormResult = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

/**
 * Generic admin form bound to a server action via useActionState.
 * Shows success as a toast and errors inline; use <SubmitButton> inside for pending state.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(action, {});
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandled = useRef<FormResult | null>(null);

  useEffect(() => {
    if (state === lastHandled.current) return;
    lastHandled.current = state;
    if (state.ok) {
      if (state.message) toast(state.message);
      if (resetOnSuccess) formRef.current?.reset();
    }
  }, [state, toast, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state.error && (
        <Alert tone="danger" className="mt-3">
          {state.error}
        </Alert>
      )}
    </form>
  );
}

/** Submit button that reflects the parent form's pending state. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} loading={pending} className={className} name={name} value={value}>
      {children}
    </Button>
  );
}
