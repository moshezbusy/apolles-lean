import { type Role } from "@prisma/client";

import { Sidebar } from "~/components/layout/sidebar";

type AppShellProps = {
  userName: string;
  role: Role;
  children: React.ReactNode;
};

export function AppShell({ userName, role, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-50 rounded-md bg-primary px-3 py-2 text-sm text-white focus-visible:not-sr-only"
        >
          Skip to content
        </a>

      <div className="md:flex">
        <Sidebar userName={userName} role={role} />
        <main id="main-content" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
