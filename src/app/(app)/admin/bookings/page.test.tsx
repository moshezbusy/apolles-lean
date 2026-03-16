import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ErrorCodes } from "~/lib/errors";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("~/lib/auth", () => ({
  getValidatedSession: authMock,
}));

vi.mock("~/components/layout/page-header", () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) =>
    React.createElement("div", {
      "data-title": title,
      "data-description": description,
    }),
}));

import AdminBookingsPage from "~/app/(app)/admin/bookings/page";

describe("AdminBookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders unscoped bookings for admins", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    const result = await AdminBookingsPage();
    const html = renderToStaticMarkup(result);

    expect(html).toContain("APL-1001");
    expect(html).toContain("APL-1002");
    expect(html).toContain("APL-2001");
    expect(html).toContain("Yael Agent - Coral Suites - Leah Cohen");
    expect(html).toContain("Noam Agent - Luma Resort - Maya Azulay");
  });

  it("rejects non-admin sessions through the admin reservation boundary", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "agent-1",
        role: "AGENT",
      },
    });

    await expect(AdminBookingsPage()).rejects.toMatchObject({
      code: "NOT_AUTHORIZED",
    });
  });

  it("rejects unauthenticated access through the admin reservation boundary", async () => {
    authMock.mockResolvedValue(null);

    await expect(AdminBookingsPage()).rejects.toMatchObject({
      code: ErrorCodes.NOT_AUTHENTICATED,
    });
  });
});
