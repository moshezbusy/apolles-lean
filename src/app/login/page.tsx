import React from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "~/app/login/login-form";
import { auth } from "~/lib/auth";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "~/lib/auth-routing";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect(DEFAULT_AUTHENTICATED_REDIRECT);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl = resolvedSearchParams?.callbackUrl;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-20">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">
          Apolles
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
          Agent Sign In
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Use your admin-provided credentials to access the platform.
        </p>

        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        {callbackUrl ? <span className="sr-only">Return to requested page after login.</span> : null}
      </section>
    </main>
  );
}
