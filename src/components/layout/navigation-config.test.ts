import { describe, expect, it } from "vitest";

import { getNavGroups, isNavItemActive } from "~/components/layout/navigation-config";

describe("getNavGroups", () => {
  it("returns only agent navigation for AGENT role", () => {
    const groups = getNavGroups("AGENT");

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((item) => item.label)).toEqual([
      "Search",
      "Reservations",
    ]);
  });

  it("returns agent and admin sections for ADMIN role", () => {
    const groups = getNavGroups("ADMIN");

    expect(groups).toHaveLength(2);
    expect(groups[0]?.items.map((item) => item.label)).toEqual([
      "Search",
      "Reservations",
    ]);
    expect(groups[1]?.title).toBe("Admin");
    expect(groups[1]?.items.map((item) => item.label)).toEqual([
      "All Bookings",
      "Supplier Logs",
      "Platform Settings",
    ]);
  });
});

describe("isNavItemActive", () => {
  it("matches exact pathname", () => {
    expect(isNavItemActive("/search", "/search")).toBe(true);
  });

  it("matches nested pathname", () => {
    expect(isNavItemActive("/admin/bookings/123", "/admin/bookings")).toBe(true);
  });

  it("does not match sibling pathname", () => {
    expect(isNavItemActive("/admin/settings", "/admin/bookings")).toBe(false);
  });
});
