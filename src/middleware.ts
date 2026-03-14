import { NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import { getAuthRedirectDecision } from "~/lib/auth-routing";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const decision = getAuthRedirectDecision({
    pathname,
    search: request.nextUrl.search,
    isAuthenticated: !!request.auth,
    isAuthApiRoute: pathname.startsWith("/api/auth"),
  });

  if (decision.type === "login") {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", decision.callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (decision.type === "search") {
    return NextResponse.redirect(new URL("/search", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
