import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("~/lib/db", () => ({
  db: {
    session: {
      findFirst: findFirstMock,
    },
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated protected routes to login with callback", async () => {
    findFirstMock.mockResolvedValue(null);
    const request = createRequest("/reservations", "?page=2");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
  });

  it("allows authenticated access to protected routes", async () => {
    findFirstMock.mockResolvedValue({ userId: "user-1" });
    const request = createRequest("/search", "", "valid-token");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(findFirstMock).toHaveBeenCalledTimes(1);
  });

  it("redirects authenticated users away from login", async () => {
    findFirstMock.mockResolvedValue({ userId: "user-1" });
    const request = createRequest("/login", "", "valid-token");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBe("https://example.com/search");
  });

  it("allows unauthenticated users to access login", async () => {
    findFirstMock.mockResolvedValue(null);
    const request = createRequest("/login");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("skips session lookups for public routes outside auth handling", async () => {
    const request = createRequest("/");

    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(findFirstMock).not.toHaveBeenCalled();
  });
});
