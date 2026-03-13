const PUBLIC_ROUTES = ["/login"];

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
