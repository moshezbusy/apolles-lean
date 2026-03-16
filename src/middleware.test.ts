import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import middleware from "~/middleware";

function createRequest(url: string, cookieHeader?: string) {
  return new NextRequest(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

async function runMiddleware(request: NextRequest) {
  return (await middleware(request)) as Response;
}

describe("middleware", () => {
  it("forwards protected routes with a callback header for the server auth gate", async () => {
    const response = await runMiddleware(createRequest("https://example.com/reservations"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-apolles-callback-url")).toBe(
      "/reservations",
    );
  });

  it("preserves callback context for dotted protected routes", async () => {
    const response = await runMiddleware(
      createRequest("https://example.com/reservations/acme.com?page=2"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-apolles-callback-url")).toBe(
      "/reservations/acme.com?page=2",
    );
  });

  it("allows protected app routes through for downstream validation", async () => {
    const response = await runMiddleware(createRequest("https://example.com/search"));

    expect(response.status).toBe(200);
  });

  it("keeps login available", async () => {
    const response = await runMiddleware(createRequest("https://example.com/login"));

    expect(response.status).toBe(200);
  });

  it("allows public asset requests without auth", async () => {
    const response = await runMiddleware(createRequest("https://example.com/logo.svg"));

    expect(response.status).toBe(200);
  });
});
