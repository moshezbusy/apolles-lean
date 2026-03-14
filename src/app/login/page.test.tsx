import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("~/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("~/app/login/login-form", () => ({
  LoginForm: ({ callbackUrl }: { callbackUrl?: string }) => ({
    type: "LoginForm",
    props: { callbackUrl },
  }),
}));

import LoginPage from "~/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to search using a real session check", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        role: "AGENT",
      },
    });

    await expect(LoginPage({})).rejects.toThrow("REDIRECT:/search");
    expect(redirectMock).toHaveBeenCalledWith("/search");
  });

  it("renders the login form for unauthenticated users", async () => {
    authMock.mockResolvedValue(null);

    const result = await LoginPage({
      searchParams: Promise.resolve({ callbackUrl: "/reservations?page=2" }),
    });

    expect(result).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
