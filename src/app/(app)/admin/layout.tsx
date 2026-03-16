import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getValidatedSession } from "~/lib/auth";
import {
  buildLoginRedirectPath,
  DEFAULT_AUTHENTICATED_REDIRECT,
  REQUEST_CALLBACK_URL_HEADER,
} from "~/lib/auth-routing";
import { requireRole } from "~/lib/authorize";
import { AppError, ErrorCodes } from "~/lib/errors";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = await getValidatedSession();

  try {
    requireRole(session, "admin");
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.NOT_AUTHENTICATED) {
      redirect(
        buildLoginRedirectPath(
          requestHeaders.get(REQUEST_CALLBACK_URL_HEADER) ?? DEFAULT_AUTHENTICATED_REDIRECT,
        ),
      );
    }

    if (error instanceof AppError && error.code === ErrorCodes.NOT_AUTHORIZED) {
      redirect("/search");
    }

    throw error;
  }

  return children;
}
