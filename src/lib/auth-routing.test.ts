import { describe, expect, it } from "vitest";

import {
  buildLoginRedirectPath,
  getAuthRedirectDecision,
  normalizeCallbackUrl,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

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

  it("allows login requests through when a session cookie is present", () => {
    const decision = getAuthRedirectDecision({
      pathname: "/login",
      search: "",
      isAuthenticated: true,
      isAuthApiRoute: false,
    });

    expect(decision).toEqual({ type: "none" });
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

describe("normalizeCallbackUrl", () => {
  it("preserves safe relative callbacks", () => {
    expect(normalizeCallbackUrl("/reservations?page=2")).toBe("/reservations?page=2");
  });

  it("falls back for unsafe callbacks", () => {
    expect(normalizeCallbackUrl("https://evil.example.com")).toBe("/search");
    expect(normalizeCallbackUrl("//evil.example.com")).toBe("/search");
  });
});

describe("buildLoginRedirectPath", () => {
  it("encodes callbackUrl for login redirects", () => {
    expect(buildLoginRedirectPath("/reservations?page=2")).toBe(
      "/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
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
