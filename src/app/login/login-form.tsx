"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { type LoginState, loginAction } from "~/app/login/actions";

const initialLoginState: LoginState = {
  error: null,
};

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, action] = useActionState(loginAction, initialLoginState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-text-primary">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10"
          placeholder="agent@apolles.dev"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-text-primary">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10"
          placeholder="Enter your password"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border border-error/20 bg-error-bg px-3 py-2 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}

      <LoginSubmitButton />
    </form>
  );
}
