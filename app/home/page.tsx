import { TopNav } from "@/components/top-nav"
import { SearchBar } from "@/components/search-bar"
import { SearchFilters } from "@/components/search-filters"
import { RecentSearches } from "@/components/recent-searches"
import { DashboardStats } from "@/components/dashboard-stats"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content */}
      <main className="px-6 py-12">
        {/* Hero Search Section */}
        <section className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-[#111827]">
              Find the perfect stay
            </h1>
            <p className="mt-2 text-[#667085]">
              Search and book properties for your clients across the globe
            </p>
          </div>

          {/* Search Container */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {/* Search Bar */}
            <SearchBar />

            {/* Filters (Nationality & Markup) */}
            <div className="mt-6 border-t border-[#E5E7EB] pt-6">
              <SearchFilters />
            </div>

            {/* Recent Searches */}
            <div className="mt-6 border-t border-[#E5E7EB] pt-6">
              <RecentSearches />
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="mx-auto mt-16 max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Business Overview
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Your operational metrics at a glance
              </p>
            </div>
            <button className="text-sm font-medium text-[#7C5CFF] transition-colors hover:text-[#4F46E5]">
              View all reports
            </button>
          </div>
          <DashboardStats />
        </section>
      </main>
    </div>
  )
}
