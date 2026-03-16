export const REQUEST_CALLBACK_URL_HEADER = "x-apolles-callback-url";
export const DEFAULT_AUTHENTICATED_REDIRECT = "/search";

export type RouteAccessRule =
  | { type: "exact"; path: string }
  | { type: "prefix"; path: string };

export const DEFAULT_PUBLIC_ROUTE_RULES: readonly RouteAccessRule[] = [
  { type: "exact", path: "/" },
  { type: "exact", path: "/login" },
];

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

function matchesRouteAccessRule(pathname: string, rule: RouteAccessRule): boolean {
  if (rule.type === "exact") {
    return pathname === rule.path;
  }

  return pathname === rule.path || pathname.startsWith(`${rule.path}/`);
}

export function isExplicitPublicRoute(
  pathname: string,
  publicRouteRules: readonly RouteAccessRule[] = DEFAULT_PUBLIC_ROUTE_RULES,
): boolean {
  return publicRouteRules.some((rule) => matchesRouteAccessRule(pathname, rule));
}

export function isProtectedRoute(
  pathname: string,
  publicRouteRules: readonly RouteAccessRule[] = DEFAULT_PUBLIC_ROUTE_RULES,
): boolean {
  return !isExplicitPublicRoute(pathname, publicRouteRules);
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
