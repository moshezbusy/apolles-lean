import { type NextRequest, NextResponse } from "next/server";
import {
  buildCallbackUrl,
  buildLoginRedirectPath,
  isProtectedRoute,
  REQUEST_CALLBACK_URL_HEADER,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(request: NextRequest) {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

function nextWithCallbackHeader(request: NextRequest, callbackUrl: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_CALLBACK_URL_HEADER, callbackUrl);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassAuthRouting(pathname)) {
    return NextResponse.next();
  }

  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);
  const protectedRoute = isProtectedRoute(pathname);

  if (protectedRoute && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL(buildLoginRedirectPath(callbackUrl), request.url));
  }

  return nextWithCallbackHeader(request, callbackUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
