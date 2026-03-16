import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "~/components/layout/app-shell";
import { getValidatedSession } from "~/lib/auth";
import {
  buildLoginRedirectPath,
  DEFAULT_AUTHENTICATED_REDIRECT,
  REQUEST_CALLBACK_URL_HEADER,
} from "~/lib/auth-routing";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const session = await getValidatedSession();

  if (!session?.user) {
    redirect(
      buildLoginRedirectPath(
        requestHeaders.get(REQUEST_CALLBACK_URL_HEADER) ?? DEFAULT_AUTHENTICATED_REDIRECT,
      ),
    );
  }

  return (
    <AppShell userName={session.user.name ?? "Unknown User"} role={session.user.role}>
      {children}
    </AppShell>
  );
}
