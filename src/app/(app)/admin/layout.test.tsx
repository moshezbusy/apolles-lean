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
      "x-apolles-callback-url": "/admin/bookings?page=2",
    }),
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("~/lib/auth", () => ({
  getValidatedSession: authMock,
}));

import AdminLayout from "~/app/(app)/admin/layout";

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires middleware-authenticated requests before rendering", async () => {
    authMock.mockResolvedValue(null);

    await expect(AdminLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Fadmin%2Fbookings%3Fpage%3D2",
    );
    expect(redirectMock).toHaveBeenCalledWith("/login?callbackUrl=%2Fadmin%2Fbookings%3Fpage%3D2");
  });

  it("redirects non-admin users to search", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "agent-1",
        role: "AGENT",
      },
    });

    await expect(AdminLayout({ children: null })).rejects.toThrow("REDIRECT:/search");
    expect(redirectMock).toHaveBeenCalledWith("/search");
  });

  it("renders children for admins", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    const result = await AdminLayout({ children: "content" });

    expect(result).toBe("content");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
