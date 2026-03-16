import { type NextRequest, NextResponse } from "next/server";
import {
  buildCallbackUrl,
  buildLoginRedirectPath,
  DEFAULT_AUTHENTICATED_REDIRECT,
  isLoginRoute,
  isProtectedRoute,
  REQUEST_CALLBACK_URL_HEADER,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";
import { db } from "~/lib/db";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

async function hasValidSession(request: NextRequest) {
  const sessionToken = SESSION_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);

  if (!sessionToken) {
    return false;
  }

  const session = await db.session.findFirst({
    where: {
      sessionToken,
      expires: {
        gt: new Date(),
      },
      user: {
        isActive: true,
      },
    },
    select: {
      userId: true,
    },
  });

  return Boolean(session?.userId);
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassAuthRouting(pathname)) {
    return NextResponse.next();
  }

  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);
  const protectedRoute = isProtectedRoute(pathname);
  const loginRoute = isLoginRoute(pathname);

  if (!protectedRoute && !loginRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_CALLBACK_URL_HEADER, callbackUrl);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const isAuthenticated = await hasValidSession(request);

  if (!isAuthenticated && protectedRoute) {
    return NextResponse.redirect(new URL(buildLoginRedirectPath(callbackUrl), request.url));
  }

  if (isAuthenticated && loginRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_REDIRECT, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_CALLBACK_URL_HEADER, callbackUrl);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
