import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import middleware from "~/middleware";

function createRequest(pathname: string, search = "", sessionToken?: string) {
  const cookieValue = sessionToken;

  return {
    nextUrl: {
      pathname,
      search,
    },
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        if (!cookieValue) {
          return undefined;
        }

        if (name === "authjs.session-token" || name === "__Secure-authjs.session-token") {
          return {
            name,
            value: cookieValue,
          };
        }

        return undefined;
      },
    },
    url: `https://example.com${pathname}${search}`,
  } as unknown as NextRequest;
}

describe("middleware auth routing", () => {
  it("redirects protected routes without a session cookie to login with callback", async () => {
    const request = createRequest("/reservations", "?page=2");

    const response = middleware(request);

    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
  });

  it("redirects protected booking routes without a session cookie to login with callback", async () => {
    const request = createRequest("/booking/tbo/hotel-1/rate-1", "?checkIn=2026-04-10");

    const response = middleware(request);

    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Fbooking%2Ftbo%2Fhotel-1%2Frate-1%3FcheckIn%3D2026-04-10",
    );
  });

  it("allows requests with a session cookie to reach protected routes", () => {
    const request = createRequest("/search", "", "valid-token");

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows login requests through so the page can validate real session state", () => {
    const request = createRequest("/login", "", "valid-token");

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated users to access login", () => {
    const request = createRequest("/login");

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("passes public routes through with callback context", () => {
    const request = createRequest("/");

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
