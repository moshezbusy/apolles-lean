import { type NextRequest, NextResponse } from "next/server";
import {
  buildCallbackUrl,
  REQUEST_CALLBACK_URL_HEADER,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassAuthRouting(pathname)) {
    return NextResponse.next();
  }

  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);

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
