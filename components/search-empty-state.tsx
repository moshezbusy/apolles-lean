import { Search, MapPin, Calendar, Users } from "lucide-react"

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#F0F3F7]">
        <Search className="size-7 text-[#667085]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#111827]">
        Start your search
      </h3>
      <p className="mb-8 max-w-sm text-sm text-[#667085]">
        Enter a destination and travel dates to find available properties and rates.
      </p>
      
      {/* Quick tips */}
      <div className="grid w-full max-w-xl grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-left">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#F7F8FB]">
            <MapPin className="size-5 text-[#7C5CFF]" />
          </div>
          <p className="text-sm font-medium text-[#111827]">Destination</p>
          <p className="text-xs text-[#667085]">Search by city, area, or hotel</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-left">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#F7F8FB]">
            <Calendar className="size-5 text-[#7C5CFF]" />
          </div>
          <p className="text-sm font-medium text-[#111827]">Dates</p>
          <p className="text-xs text-[#667085]">Select check-in and check-out</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-left">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#F7F8FB]">
            <Users className="size-5 text-[#7C5CFF]" />
          </div>
          <p className="text-sm font-medium text-[#111827]">Travelers</p>
          <p className="text-xs text-[#667085]">Specify guests and rooms</p>
        </div>
      </div>
    </div>
  )
}
