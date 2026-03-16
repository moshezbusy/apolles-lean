import { describe, expect, it } from "vitest";

import {
  buildLoginRedirectPath,
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
