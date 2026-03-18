import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("~/components/layout/sidebar", () => ({
  Sidebar: () =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement("header", { "data-testid": "sidebar-header" }, "Sidebar header"),
      React.createElement("nav", { "aria-label": "Primary navigation" }, "Sidebar nav"),
    ),
}));

import { AppShell } from "~/components/layout/app-shell";

describe("AppShell", () => {
  it("renders skip link and semantic landmarks for authenticated pages", () => {
    const html = renderToStaticMarkup(
      <AppShell userName="Moshe" role="ADMIN">
        <section>Dashboard content</section>
      </AppShell>,
    );

    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to content");
    expect(html).toContain("sr-only fixed top-3 left-3 z-50");
    expect(html).toContain("focus-visible:not-sr-only");
    expect(html).toContain("flex min-h-screen w-full flex-col md:flex-row");
    expect(html).toContain("data-testid=\"sidebar-header\"");
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('<main id="main-content" tabindex="-1"');
    expect(html).toContain("min-w-0 flex-1 p-4 md:p-8");
  });
});
