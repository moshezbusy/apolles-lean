import { type Role } from "@prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: "search" | "reservations" | "bookings" | "supplierLogs" | "settings";
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

const AGENT_ITEMS: NavItem[] = [
  { label: "Search", href: "/search", icon: "search" },
  { label: "Reservations", href: "/reservations", icon: "reservations" },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "All Bookings", href: "/admin/bookings", icon: "bookings" },
  { label: "Supplier Logs", href: "/admin/supplier-logs", icon: "supplierLogs" },
  { label: "Platform Settings", href: "/admin/settings", icon: "settings" },
];

export function getNavGroups(role: Role): NavGroup[] {
  if (role === "ADMIN") {
    return [
      { items: AGENT_ITEMS },
      { title: "Admin", items: ADMIN_ITEMS },
    ];
  }

  return [{ items: AGENT_ITEMS }];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
