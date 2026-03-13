import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";
import { requireRole } from "~/lib/authorize";
import { AppError, ErrorCodes } from "~/lib/errors";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  try {
    requireRole(session, "admin");
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.code === ErrorCodes.NOT_AUTHENTICATED || error.code === ErrorCodes.NOT_AUTHORIZED)
    ) {
      redirect("/search");
    }

    throw error;
  }

  return children;
}
