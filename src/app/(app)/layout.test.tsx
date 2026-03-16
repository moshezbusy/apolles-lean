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

  it("requires middleware-authenticated requests before rendering", async () => {
    authMock.mockResolvedValue(null);

    await expect(AuthenticatedLayout({ children: null })).rejects.toThrow(
      "AuthenticatedLayout requires middleware-authenticated requests before rendering.",
    );
    expect(redirectMock).not.toHaveBeenCalled();
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
