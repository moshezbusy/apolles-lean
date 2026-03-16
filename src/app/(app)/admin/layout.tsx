import { redirect } from "next/navigation";

import { getValidatedSession } from "~/lib/auth";
import { requireRole } from "~/lib/authorize";
import { AppError, ErrorCodes } from "~/lib/errors";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getValidatedSession();

  if (!session?.user) {
    throw new Error("AdminLayout requires middleware-authenticated requests before rendering.");
  }

  try {
    requireRole(session, "admin");
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.NOT_AUTHORIZED) {
      redirect("/search");
    }

    throw error;
  }

  return children;
}
