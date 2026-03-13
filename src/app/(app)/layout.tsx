import { redirect } from "next/navigation";

import { AppShell } from "~/components/layout/app-shell";
import { auth } from "~/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell userName={session.user.name ?? "Unknown User"} role={session.user.role}>
      {children}
    </AppShell>
  );
}
