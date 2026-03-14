const PUBLIC_ROUTES = ["/login"];
const PUBLIC_ASSET_PATH_PATTERN = /\.[^/]+$/;

type RedirectDecision =
  | { type: "login"; callbackUrl: string }
  | { type: "search" }
  | { type: "none" };

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

export function getAuthRedirectDecision(input: AuthRoutingInput): RedirectDecision {
  const isPublicRoute = PUBLIC_ROUTES.includes(input.pathname);

  if (!input.isAuthenticated && !isPublicRoute && !input.isAuthApiRoute) {
    return {
      type: "login",
      callbackUrl: `${input.pathname}${input.search}`,
    };
  }

  if (input.isAuthenticated && isPublicRoute) {
    return { type: "search" };
  }

  return { type: "none" };
}
