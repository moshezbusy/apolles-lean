import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () =>
    new Headers({
      "x-apolles-callback-url": "/reservations?page=2",
    }),
  ),
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

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests back to login with callback context", async () => {
    authMock.mockResolvedValue(null);

    await expect(AuthenticatedLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Freservations%3Fpage%3D2",
    );
    expect(redirectMock).toHaveBeenCalledWith("/login?callbackUrl=%2Freservations%3Fpage%3D2");
  });

  it("renders children for authenticated users", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Agent Example",
        role: "AGENT",
      },
    });

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
