import { describe, expect, it } from "vitest";

import { getAuthRedirectDecision, shouldBypassAuthRouting } from "~/lib/auth-routing";

describe("getAuthRedirectDecision", () => {
  it("redirects unauthenticated protected routes to login with callback", () => {
    const decision = getAuthRedirectDecision({
      pathname: "/reservations",
      search: "?page=2",
      isAuthenticated: false,
      isAuthApiRoute: false,
    });

    expect(decision).toEqual({
      type: "login",
      callbackUrl: "/reservations?page=2",
    });
  });

  it("redirects authenticated users away from login", () => {
    const decision = getAuthRedirectDecision({
      pathname: "/login",
      search: "",
      isAuthenticated: true,
      isAuthApiRoute: false,
    });

    expect(decision).toEqual({ type: "search" });
  });

  it("allows NextAuth API route without auth", () => {
    const decision = getAuthRedirectDecision({
      pathname: "/api/auth/session",
      search: "",
      isAuthenticated: false,
      isAuthApiRoute: true,
    });

    expect(decision).toEqual({ type: "none" });
  });
});

describe("shouldBypassAuthRouting", () => {
  it("bypasses public asset paths", () => {
    expect(shouldBypassAuthRouting("/logo.svg")).toBe(true);
    expect(shouldBypassAuthRouting("/robots.txt")).toBe(true);
  });

  it("does not bypass authenticated app routes", () => {
    expect(shouldBypassAuthRouting("/search")).toBe(false);
    expect(shouldBypassAuthRouting("/admin/settings")).toBe(false);
  });
});
