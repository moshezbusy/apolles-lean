/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("~/app/login/actions", () => ({
  logoutAction: vi.fn(),
}));

import { Sidebar, SidebarIdentity } from "~/components/layout/sidebar";

describe("SidebarIdentity", () => {
  it("keeps the user name and role visible in collapsed mode", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;

    act(() => {
      root.render(<SidebarIdentity userName="Moshe" role="ADMIN" collapsed />);
    });

    expect(container.textContent).toContain("Moshe");
    expect(container.textContent).toContain("Admin");

    act(() => {
      root.unmount();
    });
  });
});

describe("Sidebar", () => {
  let container: HTMLDivElement;
  let root: Root;
  let storage: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    pathnameMock.mockReturnValue("/search");
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    storage = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    container.remove();
  });

  function renderSidebar(role: "ADMIN" | "AGENT" = "ADMIN") {
    act(() => {
      root.render(<Sidebar userName="Moshe" role={role} />);
    });
  }

  it("opens the mobile navigation from the hamburger control", () => {
    renderSidebar();

    const toggleButton = container.querySelector<HTMLButtonElement>('[aria-label="Open navigation"]');

    expect(toggleButton).not.toBeNull();

    act(() => {
      toggleButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[aria-label="Mobile navigation"]')?.textContent).toContain(
      "All Bookings",
    );
    expect(container.querySelector<HTMLButtonElement>('[aria-label="Close navigation"]')).not.toBeNull();
  });

  it("hydrates collapsed state from localStorage and persists expand-collapse changes", () => {
    window.localStorage.setItem("apolles.sidebar.collapsed", "true");

    renderSidebar();

    const desktopAside = container.querySelector("aside[aria-label='Sidebar']");

    expect(desktopAside?.className).toContain("w-16");
    expect(container.textContent).toContain("Moshe");
    expect(container.textContent).toContain("Admin");

    const expandButton = container.querySelector<HTMLButtonElement>('[aria-label="Expand sidebar"]');

    act(() => {
      expandButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.localStorage.getItem("apolles.sidebar.collapsed")).toBe("false");
    expect(desktopAside?.className).toContain("w-60");

    const collapseButton = container.querySelector<HTMLButtonElement>('[aria-label="Collapse sidebar"]');

    act(() => {
      collapseButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.localStorage.getItem("apolles.sidebar.collapsed")).toBe("true");
    expect(desktopAside?.className).toContain("w-16");
  });

  it("keeps Reservations and All Bookings as separate active destinations for admins", () => {
    pathnameMock.mockReturnValue("/reservations");

    renderSidebar();

    const reservationsLink = container.querySelector<HTMLAnchorElement>('a[href="/reservations"]');
    const allBookingsLink = container.querySelector<HTMLAnchorElement>('a[href="/admin/bookings"]');
    const desktopAside = container.querySelector("aside[aria-label='Sidebar']");

    expect(desktopAside?.className).toContain("md:h-screen");
    expect(desktopAside?.className).toContain("shrink-0");
    expect(reservationsLink?.className).toContain("border-primary");
    expect(reservationsLink?.className).toContain("text-primary");
    expect(allBookingsLink?.className).toContain("border-transparent");
    expect(allBookingsLink?.className).toContain("text-white");
  });
});
