import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import middleware from "~/middleware";

function createRequest(url: string, cookieHeader?: string) {
  return new NextRequest(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

describe("middleware", () => {
  it("redirects unauthenticated users to login", () => {
    const response = middleware(createRequest("https://example.com/reservations"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Freservations",
    );
  });

  it("allows requests with an auth session cookie", () => {
    const response = middleware(createRequest("https://example.com/search", "authjs.session-token=session-value"));

    expect(response.status).toBe(200);
  });

  it("keeps login available even when a session cookie is present", () => {
    const response = middleware(createRequest("https://example.com/login", "authjs.session-token=session-value"));

    expect(response.status).toBe(200);
  });

  it("allows public asset requests without auth", () => {
    const response = middleware(createRequest("https://example.com/logo.svg"));

    expect(response.status).toBe(200);
  });
});
