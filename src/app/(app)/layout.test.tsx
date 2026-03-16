import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, headersMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  headersMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("~/lib/auth", () => ({
  getValidatedSession: authMock,
}));

vi.mock("~/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

import AuthenticatedLayout from "~/app/(app)/layout";
import { REQUEST_CALLBACK_URL_HEADER } from "~/lib/auth-routing";

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login with callback preservation", async () => {
    authMock.mockResolvedValue(null);
    headersMock.mockResolvedValue(
      new Headers([[REQUEST_CALLBACK_URL_HEADER, "/reservations?page=2"]]),
    );

    await expect(AuthenticatedLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
  });

  it("renders children for authenticated users", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Agent Example",
        role: "AGENT",
      },
    });
    headersMock.mockResolvedValue(new Headers());

    const result = await AuthenticatedLayout({ children: "content" });

    expect(result).toMatchObject({
      props: {
        userName: "Agent Example",
        role: "AGENT",
        children: "content",
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
