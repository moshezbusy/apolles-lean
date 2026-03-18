import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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

vi.mock("~/components/layout/page-header", () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) =>
    React.createElement("div", {
      "data-title": title,
      "data-description": description,
    }),
}));

import ReservationsPage from "~/app/(app)/reservations/page";

describe("ReservationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests to login with callback preservation", async () => {
    authMock.mockResolvedValue(null);

    await expect(ReservationsPage()).rejects.toThrow("REDIRECT:/login?callbackUrl=%2Freservations%3Fpage%3D2");
    expect(redirectMock).toHaveBeenCalledWith("/login?callbackUrl=%2Freservations%3Fpage%3D2");
  });

  it("redirects malformed sessions to login instead of rendering an internal error", async () => {
    authMock.mockResolvedValue({
      user: {
        role: "ADMIN",
      },
    });

    await expect(ReservationsPage()).rejects.toThrow("REDIRECT:/login?callbackUrl=%2Freservations%3Fpage%3D2");
    expect(redirectMock).toHaveBeenCalledWith("/login?callbackUrl=%2Freservations%3Fpage%3D2");
  });

  it("renders only the authenticated agent's reservations", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "agent-1",
        role: "AGENT",
      },
    });

    const result = await ReservationsPage();
    const html = renderToStaticMarkup(result);

    expect(html).toContain("APL-1001");
    expect(html).toContain("APL-1002");
    expect(html).not.toContain("APL-2001");
    expect(html).toContain("signed-in reservations workspace");
  });

  it("keeps admin users on Reservations without redirecting them into All Bookings", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    const result = await ReservationsPage();
    const html = renderToStaticMarkup(result);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(html).toContain("separate from the admin all-bookings view");
    expect(html).toContain("No reservations are linked to this account yet");
  });
});
