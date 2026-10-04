"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/primitives";
import { loginAction, type LoginState } from "@/server/admin/auth-actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" label="البريد الإلكتروني">
        <Input id="email" name="email" type="email" autoComplete="username" dir="ltr" required defaultValue={state.email} />
      </Field>
      <Field id="password" label="كلمة المرور">
        <Input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Button type="submit" size="lg" loading={pending} className="w-full">
        تسجيل الدخول
      </Button>
    </form>
  );
}
