"use client"

import { Clock, MapPin } from "lucide-react"

interface RecentSearch {
  id: string
  destination: string
  dates: string
  guests: string
}

const recentSearches: RecentSearch[] = [
  {
    id: "1",
    destination: "Paris, France",
    dates: "Apr 15 - Apr 20",
    guests: "2 adults",
  },
  {
    id: "2",
    destination: "London, UK",
    dates: "May 1 - May 5",
    guests: "2 adults, 1 child",
  },
  {
    id: "3",
    destination: "Barcelona, Spain",
    dates: "Jun 10 - Jun 15",
    guests: "4 adults",
  },
  {
    id: "4",
    destination: "Rome, Italy",
    dates: "Jul 20 - Jul 25",
    guests: "2 adults, 2 children",
  },
]

export function RecentSearches() {
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="size-4 text-[#667085]" />
        <span className="text-sm font-medium text-[#667085]">Recent searches</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recentSearches.map((search) => (
          <button
            key={search.id}
            className="flex shrink-0 items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 transition-colors hover:border-[#7C5CFF] hover:bg-[#F7F8FB]"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#F0F3F7]">
              <MapPin className="size-4 text-[#667085]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#111827]">{search.destination}</p>
              <p className="text-xs text-[#667085]">
                {search.dates} · {search.guests}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
