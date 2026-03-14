import { NextResponse } from "next/server";

import {
  buildCallbackUrl,
  getAuthRedirectDecision,
  REQUEST_CALLBACK_URL_HEADER,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasAuthSessionCookie(cookieNames: string[]) {
  return cookieNames.some((cookieName) =>
    SESSION_COOKIE_NAMES.some(
      (sessionCookieName) =>
        cookieName === sessionCookieName || cookieName.startsWith(`${sessionCookieName}.`),
    ),
  );
}

export default function middleware(request: import("next/server").NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassAuthRouting(pathname)) {
    return NextResponse.next();
  }

  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);

  const isAuthenticated = hasAuthSessionCookie(
    request.cookies.getAll().map((cookie) => cookie.name),
  );

  const decision = getAuthRedirectDecision({
    pathname,
    search: request.nextUrl.search,
    isAuthenticated,
    isAuthApiRoute: pathname.startsWith("/api/auth"),
  });

  if (decision.type === "login") {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", decision.callbackUrl);
    return NextResponse.redirect(loginUrl);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
