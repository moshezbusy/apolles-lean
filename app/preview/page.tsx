import Link from "next/link"
import { ArrowUpRight, Eye } from "lucide-react"
import { TopNav } from "@/components/top-nav"

const routeGroups = [
  {
    title: "Entry",
    description: "Authentication and entry routes.",
    routes: [
      { label: "Root Redirect", href: "/", note: "Redirects to /login" },
      { label: "Login", href: "/login", note: "Sign-in screen" },
    ],
  },
  {
    title: "Search Flow",
    description: "Core hotel discovery workflow.",
    routes: [
      { label: "Home", href: "/home", note: "Dashboard and search start" },
      { label: "Search Results", href: "/search-results", note: "Hotel list" },
      {
        label: "Hotel Rooms",
        href: "/search-results/hotel-rooms",
        note: "Room inventory and rates",
      },
    ],
  },
  {
    title: "Booking Flow",
    description: "Reservation creation and confirmation steps.",
    routes: [
      { label: "Booking", href: "/booking", note: "Guest details" },
      { label: "Booking Summary", href: "/booking/summary", note: "Review and confirm" },
      {
        label: "Booking Confirmation",
        href: "/booking/confirmation",
        note: "Success state and reference",
      },
    ],
  },
  {
    title: "Reservations",
    description: "Reservation management and detail views.",
    routes: [
      { label: "Reservations", href: "/reservations", note: "List and filters" },
      {
        label: "Reservation Detail",
        href: "/reservations/APL-2026-78542",
        note: "Example dynamic record",
      },
    ],
  },
]

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Page Preview Index</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Open every current route from one place to review the prototype quickly.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#667085]">
            <Eye className="size-4 text-[#7C5CFF]" />
            10 routes
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {routeGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
            >
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">{group.title}</h2>
                <p className="mt-1 text-sm text-[#667085]">{group.description}</p>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {group.routes.map((route) => (
                  <div
                    key={route.href}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{route.label}</p>
                      <p className="mt-1 text-sm text-[#667085]">{route.note}</p>
                      <p className="mt-1 font-mono text-xs text-[#7C5CFF]">{route.href}</p>
                    </div>

                    <Link
                      href={route.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F7F8FB]"
                    >
                      Open
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
