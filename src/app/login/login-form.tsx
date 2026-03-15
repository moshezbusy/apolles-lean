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
    <Button
      type="submit"
      className="h-11 w-full bg-[var(--color-primary)] font-semibold text-white shadow-[0_18px_40px_rgba(99,91,255,0.28)] hover:bg-[var(--color-primary-hover)]"
      disabled={pending}
    >
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
        <label htmlFor="email" className="text-sm font-medium text-white/84">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 border-white/14 bg-white/8 px-3 text-white placeholder:text-white/42 focus-visible:border-[var(--color-primary)] focus-visible:ring-[#635bff]/25"
          placeholder="agent@apolles.dev"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-white/84">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 border-white/14 bg-white/8 px-3 text-white placeholder:text-white/42 focus-visible:border-[var(--color-primary)] focus-visible:ring-[#635bff]/25"
          placeholder="Enter your password"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-300/20 bg-red-500/12 px-3 py-2 text-sm text-red-100"
        >
          {state.error}
        </p>
      ) : null}

      <LoginSubmitButton />
    </form>
  );
}
