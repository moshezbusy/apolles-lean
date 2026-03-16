import React from "react";

import { AppShell } from "~/components/layout/app-shell";
import { getValidatedSession } from "~/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getValidatedSession();

  if (!session?.user) {
    throw new Error(
      "AuthenticatedLayout requires middleware-authenticated requests before rendering.",
    );
  }

  return (
    <AppShell userName={session.user.name ?? "Unknown User"} role={session.user.role}>
      {children}
    </AppShell>
  );
}
