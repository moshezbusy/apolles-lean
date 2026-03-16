"use client";

import React from "react";
import Link from "next/link";
import { type Role } from "@prisma/client";
import {
  Activity,
  BookOpen,
  Database,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { logoutAction } from "~/app/login/actions";
import { getNavGroups, isNavItemActive } from "~/components/layout/navigation-config";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "apolles.sidebar.collapsed";

const NAV_ICONS = {
  search: Search,
  reservations: BookOpen,
  bookings: Database,
  supplierLogs: Activity,
  settings: Settings,
} as const;

type SidebarProps = {
  userName: string;
  role: Role;
};

function RoleLabel({ role }: { role: Role }) {
  return <span className="text-xs text-text-muted">{role === "ADMIN" ? "Admin" : "Agent"}</span>;
}

export function SidebarIdentity({
  userName,
  role,
  collapsed,
}: {
  userName: string;
  role: Role;
  collapsed: boolean;
}) {
  return (
    <div
      className={collapsed ? "text-center" : ""}
      aria-label={`${userName} (${role === "ADMIN" ? "Admin" : "Agent"})`}
    >
      <p
        className={
          collapsed
            ? "text-[11px] leading-tight font-medium text-white break-words"
            : "text-sm font-medium text-white"
        }
      >
        {userName}
      </p>
      <span
        className={
          collapsed
            ? "mt-1 block text-[11px] leading-tight text-text-muted"
            : "text-xs text-text-muted"
        }
      >
        {role === "ADMIN" ? "Admin" : "Agent"}
      </span>
    </div>
  );
}

function NavSections({
  role,
  pathname,
  collapsed,
  close,
}: {
  role: Role;
  pathname: string;
  collapsed?: boolean;
  close?: () => void;
}) {
  const groups = getNavGroups(role);

  return (
    <>
      {groups.map((group, groupIndex) => (
          <section
            key={`${group.title ?? "main"}-${groupIndex}`}
            className={groupIndex > 0 ? "mt-6 border-t border-white/20 pt-4" : ""}
          >
          {group.title && !collapsed ? (
            <p className="mb-2 px-2 text-xs tracking-[0.14em] text-text-muted uppercase">
              {group.title}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = NAV_ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={`flex items-center rounded-r-md border-l-2 px-3 py-2 text-sm transition-colors ${
                      collapsed ? "justify-center" : "gap-2"
                    } ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-white hover:bg-white/10"
                    }`}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

export function Sidebar({ userName, role }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    setCollapsed(stored === "true");
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed, hasLoadedPreference]);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <p className="font-mono text-xs tracking-[0.14em] text-text-secondary uppercase">Apolles</p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-border p-2 text-text-primary"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      <aside
        className={`hidden flex-col bg-dark text-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
        aria-label="Sidebar"
      >
        <header
          className={`flex items-center border-b border-white/20 py-4 ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <p className="font-mono text-xs tracking-[0.16em] text-white/80 uppercase" aria-label="Apolles">
            {collapsed ? "AP" : "Apolles"}
          </p>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-md border border-white/25 p-1.5 text-white hover:bg-white/10"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="rounded-md border border-white/25 p-1.5 text-white hover:bg-white/10"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </header>
        <nav className={`flex-1 py-4 ${collapsed ? "px-2" : "px-3"}`} aria-label="Primary navigation">
          <NavSections role={role} pathname={pathname} collapsed={collapsed} />
        </nav>
        <div className={`border-t border-white/20 py-4 ${collapsed ? "px-2" : "px-4"}`}>
          <SidebarIdentity userName={userName} role={role} collapsed={collapsed} />
          <form action={logoutAction} className={collapsed ? "mt-0" : "mt-3"}>
            <button
              type="submit"
              className={`inline-flex min-h-11 items-center justify-center rounded-md text-sm text-white underline decoration-white/40 underline-offset-4 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                collapsed ? "min-w-11" : "px-2"
              }`}
            >
              {collapsed ? (
                <>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Logout</span>
                </>
              ) : (
                "Logout"
              )}
            </button>
          </form>
        </div>
      </aside>

      {open ? (
        <div id="mobile-navigation" className="border-b border-border bg-dark px-4 pb-4 text-white md:hidden">
          <nav aria-label="Mobile navigation" className="pt-3">
            <NavSections role={role} pathname={pathname} close={() => setOpen(false)} />
          </nav>
          <div className="mt-5 border-t border-white/20 pt-4">
            <SidebarIdentity userName={userName} role={role} collapsed={false} />
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm text-white underline decoration-white/40 underline-offset-4 hover:bg-white/10"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
