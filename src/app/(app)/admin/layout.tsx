import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getValidatedSession } from "~/lib/auth";
import { requireRole } from "~/lib/authorize";
import {
  buildLoginRedirectPath,
  DEFAULT_AUTHENTICATED_REDIRECT,
  REQUEST_CALLBACK_URL_HEADER,
} from "~/lib/auth-routing";
import { AppError, ErrorCodes } from "~/lib/errors";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getValidatedSession();

  if (!session?.user) {
    const requestHeaders = await headers();
    const callbackUrl =
      requestHeaders.get(REQUEST_CALLBACK_URL_HEADER) ?? DEFAULT_AUTHENTICATED_REDIRECT;

    redirect(buildLoginRedirectPath(callbackUrl));
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
