import { NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import {
  buildCallbackUrl,
  getAuthRedirectDecision,
  REQUEST_CALLBACK_URL_HEADER,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

export default auth(function middleware(request) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassAuthRouting(pathname)) {
    return NextResponse.next();
  }

  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);

  const decision = getAuthRedirectDecision({
    pathname,
    search: request.nextUrl.search,
    isAuthenticated: Boolean(request.auth?.user),
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
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
