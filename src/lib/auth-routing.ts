export const REQUEST_CALLBACK_URL_HEADER = "x-apolles-callback-url";
export const DEFAULT_AUTHENTICATED_REDIRECT = "/search";
const PUBLIC_ROUTE_PATHS = new Set(["/", "/login"]);

export function shouldBypassAuthRouting(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function isSafeCallbackUrl(callbackUrl: string | null | undefined): callbackUrl is string {
  return (
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  );
}

export function normalizeCallbackUrl(callbackUrl: string | null | undefined): string {
  return isSafeCallbackUrl(callbackUrl) ? callbackUrl : DEFAULT_AUTHENTICATED_REDIRECT;
}

export function isLoginRoute(pathname: string): boolean {
  return pathname === "/login";
}

export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTE_PATHS.has(pathname);
}

export function buildCallbackUrl(pathname: string, search: string): string {
  return normalizeCallbackUrl(`${pathname}${search}`);
}

export function buildLoginRedirectPath(callbackUrl: string): string {
  const searchParams = new URLSearchParams({
    callbackUrl: normalizeCallbackUrl(callbackUrl),
  });

  return `/login?${searchParams.toString()}`;
}
