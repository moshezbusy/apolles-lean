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

import AdminLayout from "~/app/(app)/admin/layout";
import { REQUEST_CALLBACK_URL_HEADER } from "~/lib/auth-routing";

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login with callback preservation", async () => {
    authMock.mockResolvedValue(null);
    headersMock.mockResolvedValue(new Headers([[REQUEST_CALLBACK_URL_HEADER, "/admin/bookings"]]));

    await expect(AdminLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Fadmin%2Fbookings",
    );
    expect(redirectMock).toHaveBeenCalledWith("/login?callbackUrl=%2Fadmin%2Fbookings");
  });

  it("redirects non-admin users to search", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "agent-1",
        role: "AGENT",
      },
    });
    headersMock.mockResolvedValue(new Headers());

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
    headersMock.mockResolvedValue(new Headers());

    const result = await AdminLayout({ children: "content" });

    expect(result).toBe("content");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
