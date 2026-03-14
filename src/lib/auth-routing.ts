const PUBLIC_ROUTES = ["/login"];
const PUBLIC_ASSET_PATH_PATTERN = /\.[^/]+$/;

export const REQUEST_CALLBACK_URL_HEADER = "x-apolles-callback-url";
export const DEFAULT_AUTHENTICATED_REDIRECT = "/search";

type RedirectDecision = { type: "login"; callbackUrl: string } | { type: "none" };

type AuthRoutingInput = {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
  isAuthApiRoute: boolean;
};

export function shouldBypassAuthRouting(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    PUBLIC_ASSET_PATH_PATTERN.test(pathname)
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

export function buildCallbackUrl(pathname: string, search: string): string {
  return normalizeCallbackUrl(`${pathname}${search}`);
}

export function buildLoginRedirectPath(callbackUrl: string): string {
  const searchParams = new URLSearchParams({
    callbackUrl: normalizeCallbackUrl(callbackUrl),
  });

  return `/login?${searchParams.toString()}`;
}

export function getAuthRedirectDecision(input: AuthRoutingInput): RedirectDecision {
  const isPublicRoute = PUBLIC_ROUTES.includes(input.pathname);

  if (!input.isAuthenticated && !isPublicRoute && !input.isAuthApiRoute) {
    return {
      type: "login",
      callbackUrl: buildCallbackUrl(input.pathname, input.search),
    };
  }

  return { type: "none" };
}
