"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TopNavProps {
  user?: {
    name: string
    email: string
    role?: string
  }
}

const navItems = [
  { label: "Search", href: "/home" },
  { label: "Quotes", href: "/quotes" },
  { label: "Reservations", href: "/reservations" },
  { label: "All Bookings", href: "/admin/bookings" },
  { label: "Supplier Logs", href: "/admin/logs" },
  { label: "Platform Settings", href: "/admin/settings" },
]

export function TopNav({ 
  user = { name: "Sarah Chen", email: "sarah@apolles.com", role: "Admin" } 
}: TopNavProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#151922] bg-[#0B0D12]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#7C5CFF]">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-semibold text-white">Apolles</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#151922] text-white"
                        : "text-white/70 hover:bg-[#151922]/50 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Area */}
        <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#151922]/50">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#7C5CFF] text-sm font-medium text-white">
                {user.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-white/50">{user.role}</p>
              </div>
              <ChevronDown className={cn(
                "size-4 text-white/50 transition-transform",
                userMenuOpen && "rotate-180"
              )} />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 border-[#E5E7EB] bg-white p-1.5" 
            align="end"
            sideOffset={8}
          >
            <div className="border-b border-[#E5E7EB] px-3 py-2.5">
              <p className="text-sm font-medium text-[#111827]">{user.name}</p>
              <p className="text-xs text-[#667085]">{user.email}</p>
            </div>
            <div className="py-1">
              <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#111827] transition-colors hover:bg-[#F7F8FB]">
                <User className="size-4 text-[#667085]" />
                Profile
              </button>
              <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#111827] transition-colors hover:bg-[#F7F8FB]">
                <Settings className="size-4 text-[#667085]" />
                Settings
              </button>
            </div>
            <div className="border-t border-[#E5E7EB] pt-1">
              <button
                onClick={() => {
                  window.location.href = "/"
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#E5484D] transition-colors hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
