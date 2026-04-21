"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  isAdmin?: boolean
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

const navItems = [
  { label: "Search", href: "/home", icon: Search },
  { label: "Reservations", href: "/reservations", icon: Calendar },
]

const adminItems = [
  { label: "All Bookings", href: "/admin/bookings", icon: ClipboardList },
  { label: "Supplier Logs", href: "/admin/logs", icon: FileText },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
]

export function AppSidebar({ 
  isAdmin = true, 
  user = { name: "Sarah Chen", email: "sarah@apolles.com" } 
}: AppSidebarProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0A2540]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#635BFF]">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-semibold text-white">Apolles</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1A3A5C] text-white"
                      : "text-white/70 hover:bg-[#1A3A5C]/50 hover:text-white"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Admin
            </p>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#1A3A5C] text-white"
                          : "text-white/70 hover:bg-[#1A3A5C]/50 hover:text-white"
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Area */}
      <div className="border-t border-[#1A3A5C] p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#1A3A5C]/50"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[#635BFF] text-sm font-medium text-white">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
            <ChevronDown className={cn(
              "size-4 text-white/50 transition-transform",
              userMenuOpen && "rotate-180"
            )} />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-[#1A3A5C] bg-[#0D2D4D] p-1 shadow-lg">
              <button
                onClick={() => {
                  // Handle logout
                  window.location.href = "/"
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-[#1A3A5C] hover:text-white"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
