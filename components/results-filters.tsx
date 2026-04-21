"use client"

import { useState } from "react"
import { Search, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

interface ResultsFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

interface FilterState {
  hotelName: string
  roomTypes: string[]
  starRatings: number[]
  priceRange: [number, number]
  mealPlans: string[]
  cancellationPolicies: string[]
}

const MEAL_PLANS = [
  "Room Only",
  "Breakfast",
  "Half Board",
  "Full Board",
  "All Inclusive",
]

const CANCELLATION_POLICIES = [
  "Free Cancellation",
  "Non-Refundable",
  "Partially Refundable",
]

export function ResultsFilters({ onFiltersChange }: ResultsFiltersProps) {
  const [hotelName, setHotelName] = useState("")
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const [starRatings, setStarRatings] = useState<number[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [mealPlans, setMealPlans] = useState<string[]>([])
  const [cancellationPolicies, setCancellationPolicies] = useState<string[]>([])

  const toggleFilter = <T extends string | number>(
    current: T[],
    value: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value))
    } else {
      setter([...current, value])
    }
  }

  const clearAllFilters = () => {
    setHotelName("")
    setRoomTypes([])
    setStarRatings([])
    setPriceRange([0, 1000])
    setMealPlans([])
    setCancellationPolicies([])
  }

  const hasActiveFilters = 
    hotelName || 
    roomTypes.length > 0 || 
    starRatings.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 1000 ||
    mealPlans.length > 0 || 
    cancellationPolicies.length > 0

  return (
    <div className="w-full">
      <div className="rounded-lg border border-[#E5E7EB] bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#111827]">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-[#7C5CFF] hover:text-[#4B45C6]"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="divide-y divide-[#E5E7EB]">
          {/* Hotel Name Search */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Hotel Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8]" />
              <input
                type="text"
                placeholder="Search hotels..."
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
              />
              {hotelName && (
                <button
                  onClick={() => setHotelName("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA8B8] hover:text-[#667085]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Room Type Search */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Room Type
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8]" />
              <input
                type="text"
                placeholder="Search room types..."
                value={roomTypes[0] || ""}
                onChange={(e) => setRoomTypes(e.target.value ? [e.target.value] : [])}
                className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
              />
              {roomTypes.length > 0 && (
                <button
                  onClick={() => setRoomTypes([])}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA8B8] hover:text-[#667085]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Star Rating
            </label>
            <div className="flex gap-1.5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => toggleFilter(starRatings, rating, setStarRatings)}
                  className={cn(
                    "flex items-center gap-0.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    starRatings.includes(rating)
                      ? "border-[#7C5CFF] bg-[#F3F0FF] text-[#7C5CFF]"
                      : "border-[#E5E7EB] bg-white text-[#667085] hover:border-[#7C5CFF] hover:text-[#7C5CFF]"
                  )}
                >
                  {rating}
                  <Star className={cn(
                    "size-3",
                    starRatings.includes(rating) ? "fill-[#7C5CFF]" : "fill-[#D4A853]"
                  )} />
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Price per night
            </label>
            <div className="px-1">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                min={0}
                max={1000}
                step={10}
                className="my-4"
              />
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}+</span>
              </div>
            </div>
          </div>

          {/* Meal Plan */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Meal Plan
            </label>
            <div className="space-y-1.5">
              {MEAL_PLANS.map((plan) => (
                <label
                  key={plan}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-[#F7F8FB]"
                >
                  <input
                    type="checkbox"
                    checked={mealPlans.includes(plan)}
                    onChange={() => toggleFilter(mealPlans, plan, setMealPlans)}
                    className="size-4 rounded border-[#E5E7EB] text-[#7C5CFF] focus:ring-[#7C5CFF]"
                  />
                  <span className="text-sm text-[#111827]">{plan}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#667085]">
              Cancellation Policy
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_POLICIES.map((policy) => (
                <label
                  key={policy}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-[#F7F8FB]"
                >
                  <input
                    type="checkbox"
                    checked={cancellationPolicies.includes(policy)}
                    onChange={() => toggleFilter(cancellationPolicies, policy, setCancellationPolicies)}
                    className="size-4 rounded border-[#E5E7EB] text-[#7C5CFF] focus:ring-[#7C5CFF]"
                  />
                  <span className="text-sm text-[#111827]">{policy}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
