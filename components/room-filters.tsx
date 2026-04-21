"use client"

import { useState } from "react"
import { Search, ChevronDown, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CANCELLATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free Cancellation" },
  { value: "non-refundable", label: "Non-Refundable" },
]

const MEAL_OPTIONS = [
  { value: "all", label: "All Meal Plans" },
  { value: "room-only", label: "Room Only" },
  { value: "breakfast", label: "Breakfast" },
  { value: "half-board", label: "Half Board" },
  { value: "full-board", label: "Full Board" },
  { value: "all-inclusive", label: "All Inclusive" },
]

interface RoomFiltersProps {
  onFilterChange?: (filters: {
    roomName: string
    cancellation: string
    mealPlan: string
    priceRange: [number, number]
  }) => void
}

export function RoomFilters({ onFilterChange }: RoomFiltersProps) {
  const [roomName, setRoomName] = useState("")
  const [cancellation, setCancellation] = useState("all")
  const [mealPlan, setMealPlan] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const getPriceRange = (): [number, number] => {
    return [
      minPrice ? parseFloat(minPrice) : 0,
      maxPrice ? parseFloat(maxPrice) : 10000
    ]
  }

  const handleRoomNameChange = (value: string) => {
    setRoomName(value)
    onFilterChange?.({ roomName: value, cancellation, mealPlan, priceRange: getPriceRange() })
  }

  const handleCancellationChange = (value: string) => {
    setCancellation(value)
    onFilterChange?.({ roomName, cancellation: value, mealPlan, priceRange: getPriceRange() })
  }

  const handleMealPlanChange = (value: string) => {
    setMealPlan(value)
    onFilterChange?.({ roomName, cancellation, mealPlan: value, priceRange: getPriceRange() })
  }

  const handleMinPriceChange = (value: string) => {
    setMinPrice(value)
    const newPriceRange: [number, number] = [value ? parseFloat(value) : 0, maxPrice ? parseFloat(maxPrice) : 10000]
    onFilterChange?.({ roomName, cancellation, mealPlan, priceRange: newPriceRange })
  }

  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value)
    const newPriceRange: [number, number] = [minPrice ? parseFloat(minPrice) : 0, value ? parseFloat(value) : 10000]
    onFilterChange?.({ roomName, cancellation, mealPlan, priceRange: newPriceRange })
  }

  const clearRoomName = () => {
    setRoomName("")
    onFilterChange?.({ roomName: "", cancellation, mealPlan, priceRange: getPriceRange() })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
      {/* Room Name Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8]" />
        <input
          type="text"
          placeholder="Search room types..."
          value={roomName}
          onChange={(e) => handleRoomNameChange(e.target.value)}
          className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-8 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
        />
        {roomName && (
          <button
            onClick={clearRoomName}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA8B8] hover:text-[#667085]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Cancellation Policy Dropdown */}
      <Select value={cancellation} onValueChange={handleCancellationChange}>
        <SelectTrigger className="h-9 w-[180px] border-[#E5E7EB] bg-white text-sm">
          <SelectValue placeholder="Cancellation Policy" />
        </SelectTrigger>
        <SelectContent>
          {CANCELLATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Meal Plan Dropdown */}
      <Select value={mealPlan} onValueChange={handleMealPlanChange}>
        <SelectTrigger className="h-9 w-[160px] border-[#E5E7EB] bg-white text-sm">
          <SelectValue placeholder="Meal Plan" />
        </SelectTrigger>
        <SelectContent>
          {MEAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Price Range */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-[#667085]">Price:</span>
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => handleMinPriceChange(e.target.value)}
          className="h-9 w-20 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
        />
        <span className="text-sm text-[#667085]">-</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => handleMaxPriceChange(e.target.value)}
          className="h-9 w-20 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
        />
      </div>
    </div>
  )
}
