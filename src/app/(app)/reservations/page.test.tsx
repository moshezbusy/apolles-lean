import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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

import ReservationsPage from "~/app/(app)/reservations/page";

describe("ReservationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(html).toContain("Story 1.5 authorization rules");
  });
});
