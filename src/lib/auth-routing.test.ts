import { describe, expect, it } from "vitest";

import {
  DEFAULT_PUBLIC_ROUTE_RULES,
  buildLoginRedirectPath,
  isExplicitPublicRoute,
  isLoginRoute,
  isProtectedRoute,
  normalizeCallbackUrl,
  shouldBypassAuthRouting,
} from "~/lib/auth-routing";

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
  it("bypasses known static asset paths", () => {
    expect(shouldBypassAuthRouting("/robots.txt")).toBe(true);
    expect(shouldBypassAuthRouting("/favicon.ico")).toBe(true);
  });

  it("does not bypass authenticated app routes or dotted slugs", () => {
    expect(shouldBypassAuthRouting("/search")).toBe(false);
    expect(shouldBypassAuthRouting("/admin/settings")).toBe(false);
    expect(shouldBypassAuthRouting("/reservations/acme.com")).toBe(false);
  });
});

describe("isProtectedRoute", () => {
  it("matches authenticated app routes", () => {
    expect(isProtectedRoute("/search")).toBe(true);
    expect(isProtectedRoute("/reservations")).toBe(true);
    expect(isProtectedRoute("/admin/settings")).toBe(true);
    expect(isProtectedRoute("/booking/tbo/hotel-1/rate-1")).toBe(true);
    expect(isProtectedRoute("/future-authenticated-route")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/")).toBe(false);
  });

  it("keeps unknown future routes protected by default", () => {
    expect(isProtectedRoute("/forgot-password")).toBe(true);
    expect(isProtectedRoute("/docs/getting-started")).toBe(true);
  });

  it("allows explicitly registered future public routes", () => {
    const futurePublicRoutes = [
      ...DEFAULT_PUBLIC_ROUTE_RULES,
      { type: "exact", path: "/forgot-password" } as const,
      { type: "prefix", path: "/docs" } as const,
    ];

    expect(isProtectedRoute("/forgot-password", futurePublicRoutes)).toBe(false);
    expect(isProtectedRoute("/docs/getting-started", futurePublicRoutes)).toBe(false);
    expect(isProtectedRoute("/docs-private", futurePublicRoutes)).toBe(true);
  });
});

describe("isExplicitPublicRoute", () => {
  it("matches known public routes only when explicitly configured", () => {
    expect(isExplicitPublicRoute("/login")).toBe(true);
    expect(isExplicitPublicRoute("/search")).toBe(false);
  });
});

describe("isLoginRoute", () => {
  it("matches only login", () => {
    expect(isLoginRoute("/login")).toBe(true);
    expect(isLoginRoute("/login/help")).toBe(false);
    expect(isLoginRoute("/search")).toBe(false);
  });
});
