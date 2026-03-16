import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("~/app/login/login-form", () => ({
  LoginForm: ({ callbackUrl }: { callbackUrl?: string }) =>
    React.createElement("div", {
      "data-testid": "login-form",
      "data-callback-url": callbackUrl ?? "",
    }),
}));

import LoginPage from "~/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form with callback preservation through the page shell", async () => {
    const result = await LoginPage({
      searchParams: Promise.resolve({ callbackUrl: "/reservations?page=2" }),
    });

    const html = renderToStaticMarkup(result);

    expect(result).toBeTruthy();
    expect(html).toContain('data-testid="login-form"');
    expect(html).toContain('data-callback-url="/reservations?page=2"');
    expect(html).toContain("Return to requested page after login.");
    expect(html).toContain("bg-[var(--color-dark)]");
    expect(html).not.toContain("radial-gradient");
    expect(html).toContain("bg-[var(--color-dark-secondary)]");
  });
});
