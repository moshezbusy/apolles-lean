import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
}));

vi.mock("~/app/login/actions", () => ({
  logoutAction: vi.fn(),
}));

import { Sidebar, SidebarIdentity } from "~/components/layout/sidebar";

describe("SidebarIdentity", () => {
  it("keeps the user name and role visible in collapsed mode", () => {
    const html = renderToStaticMarkup(
      <SidebarIdentity userName="Moshe" role="ADMIN" collapsed />,
    );

    expect(html).toContain("Moshe");
    expect(html).toContain("Admin");
  });
});

describe("Sidebar", () => {
  it("renders the mobile hamburger control", () => {
    const html = renderToStaticMarkup(<Sidebar userName="Moshe" role="ADMIN" />);

    expect(html).toContain("mobile-navigation");
    expect(html).toContain("Open navigation");
  });
});
