import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authState } = vi.hoisted(() => ({
  authState: {
    session: null as { user: { id: string } } | null,
  },
}));

vi.mock("~/lib/auth", () => ({
  auth: (handler: (request: NextRequest & { auth: typeof authState.session }) => Response) => {
    return (request: NextRequest) => handler(Object.assign(request, { auth: authState.session }));
  },
}));

import middleware from "~/middleware";

function createRequest(url: string, cookieHeader?: string) {
  return new NextRequest(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

async function runMiddleware(request: NextRequest) {
  return (await middleware(request, {} as never)) as Response;
}

describe("middleware", () => {
  beforeEach(() => {
    authState.session = null;
  });

  it("redirects unauthenticated users to login", async () => {
    const response = await runMiddleware(createRequest("https://example.com/reservations"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Freservations",
    );
  });

  it("does not trust a bare session cookie without a validated session", async () => {
    const response = await runMiddleware(
      createRequest("https://example.com/search", "authjs.session-token=session-value"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Fsearch",
    );
  });

  it("redirects expired database sessions after inactivity back to login", async () => {
    const response = await runMiddleware(
      createRequest(
        "https://example.com/reservations?page=2",
        "authjs.session-token=expired-session-token",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
  });

  it("allows requests with a validated auth session", async () => {
    authState.session = {
      user: {
        id: "user-1",
      },
    };

    const response = await runMiddleware(createRequest("https://example.com/search"));

    expect(response.status).toBe(200);
  });

  it("keeps login available even when a session cookie is present", async () => {
    const response = await runMiddleware(
      createRequest("https://example.com/login", "authjs.session-token=session-value"),
    );

    expect(response.status).toBe(200);
  });

  it("allows public asset requests without auth", async () => {
    const response = await runMiddleware(createRequest("https://example.com/logo.svg"));

    expect(response.status).toBe(200);
  });
});
