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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-dark)] px-6 py-20 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[var(--color-dark)]" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-10 h-28 w-[min(26rem,calc(100%-3rem))] -translate-x-1/2 rounded-[32px] border border-white/8 bg-[var(--color-dark-secondary)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-10 top-24 h-36 w-36 rounded-[28px] border border-white/10 bg-[rgba(99,91,255,0.12)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-12 bottom-16 h-28 w-28 rounded-full border border-white/8 bg-white/6"
      />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/12 bg-white/8 p-8 shadow-[0_32px_90px_rgba(5,16,28,0.45)] backdrop-blur-xl">
        <p className="font-mono text-xs tracking-[0.24em] text-white/60 uppercase">
          Apolles
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Agent Sign In
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/72">
          Use your admin-provided credentials to access the platform.
        </p>
        <div className="mt-5 inline-flex items-center rounded-full border border-[rgba(99,91,255,0.34)] bg-[rgba(99,91,255,0.14)] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-[var(--color-primary-light)] uppercase">
          Secure session gateway
        </div>

        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        {callbackUrl ? <span className="sr-only">Return to requested page after login.</span> : null}
      </section>
    </main>
  );
}
