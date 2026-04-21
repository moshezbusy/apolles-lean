"use client"

import { useState, useMemo } from "react"
import { TopNav } from "@/components/top-nav"
import { CompactSearchBar } from "@/components/compact-search-bar"
import { HotelSummary } from "@/components/hotel-summary"
import { RoomFilters } from "@/components/room-filters"
import { RoomCard, type RoomCardData } from "@/components/room-card"
import { ArrowUpDown, SearchX } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock hotel data
const MOCK_HOTEL = {
  id: "1",
  name: "Secrets Tulum Resort & Beach Club",
  starRating: 5,
  address: "Calle Itzimina esq. Av Kukulkan, mz 001, lote 007, reg 014, Mexico Tulum",
  imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
  isFavorite: false,
}

// Mock room data
const MOCK_ROOMS: RoomCardData[] = [
  {
    id: "r1",
    name: "Junior Suite (Tropical View, Double Beds)",
    description: "2 Double Beds, Non-Smoking, Private balcony with tropical garden views",
    occupancy: 2,
    isNonRefundable: true,
    mealPlan: "All Inclusive",
    highlights: ["Free WiFi", "Mini Bar", "Room Service"],
    price: 336.03,
    currency: "USD",
  },
  {
    id: "r2",
    name: "Preferred Club Junior Suite Ocean View",
    description: "1 King Bed, Ocean front views, Preferred Club benefits included",
    occupancy: 2,
    isNonRefundable: false,
    mealPlan: "All Inclusive",
    highlights: ["Ocean View", "Preferred Club", "Butler Service"],
    price: 485.00,
    currency: "USD",
  },
  {
    id: "r3",
    name: "Standard Room Garden View",
    description: "1 Queen Bed, Garden views, Complimentary breakfast",
    occupancy: 2,
    isNonRefundable: false,
    mealPlan: "Breakfast",
    highlights: ["Free WiFi", "Garden View"],
    price: 220.00,
    currency: "USD",
  },
  {
    id: "r4",
    name: "Deluxe Suite Pool Access",
    description: "1 King Bed, Direct pool access, Extended living area",
    occupancy: 3,
    isNonRefundable: true,
    mealPlan: "Half Board",
    highlights: ["Pool Access", "Living Area", "Mini Bar"],
    price: 595.00,
    currency: "USD",
  },
  {
    id: "r5",
    name: "Premium Ocean Front Suite",
    description: "2 Queen Beds, Panoramic ocean views, Private terrace",
    occupancy: 4,
    isNonRefundable: false,
    mealPlan: "Full Board",
    highlights: ["Ocean Front", "Private Terrace", "Premium Amenities"],
    price: 780.00,
    currency: "USD",
  },
  {
    id: "r6",
    name: "Economy Room",
    description: "1 Double Bed, Compact room, Room only rate",
    occupancy: 2,
    isNonRefundable: true,
    mealPlan: "Room Only",
    highlights: ["Free WiFi"],
    price: 145.00,
    currency: "USD",
  },
]

type SortOption = "price-low" | "price-high"

interface Filters {
  roomName: string
  cancellation: string
  mealPlan: string
  priceRange: [number, number]
}

export default function HotelRoomsPage() {
  const [sortBy, setSortBy] = useState<SortOption>("price-low")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    roomName: "",
    cancellation: "all",
    mealPlan: "all",
    priceRange: [0, 10000],
  })

  // Filter and sort rooms
  const filteredRooms = useMemo(() => {
    let rooms = [...MOCK_ROOMS]

    // Filter by room name
    if (filters.roomName) {
      rooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(filters.roomName.toLowerCase())
      )
    }

    // Filter by cancellation policy
    if (filters.cancellation === "free") {
      rooms = rooms.filter((room) => !room.isNonRefundable)
    } else if (filters.cancellation === "non-refundable") {
      rooms = rooms.filter((room) => room.isNonRefundable)
    }

    // Filter by meal plan
    if (filters.mealPlan !== "all") {
      const mealPlanMap: Record<string, string[]> = {
        "room-only": ["Room Only"],
        "breakfast": ["Breakfast"],
        "half-board": ["Half Board"],
        "full-board": ["Full Board"],
        "all-inclusive": ["All Inclusive"],
      }
      const targetMealPlans = mealPlanMap[filters.mealPlan] || []
      rooms = rooms.filter((room) =>
        targetMealPlans.some((mp) =>
          room.mealPlan.toLowerCase().includes(mp.toLowerCase())
        )
      )
    }

    // Filter by price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      rooms = rooms.filter((room) => room.price >= min && room.price <= max)
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        rooms.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        rooms.sort((a, b) => b.price - a.price)
        break
    }

    return rooms
  }, [filters, sortBy])

  const handleSearch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      {/* Compact Search Bar */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-[1600px] px-8 py-3">
          <CompactSearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-8 py-6">
        {/* Hotel Summary */}
        <div className="mb-6">
          <HotelSummary
            name={MOCK_HOTEL.name}
            starRating={MOCK_HOTEL.starRating}
            address={MOCK_HOTEL.address}
            imageUrl={MOCK_HOTEL.imageUrl}
            isFavorite={MOCK_HOTEL.isFavorite}
            onToggleFavorite={() => console.log("Toggle favorite")}
            onViewGallery={() => console.log("View gallery")}
            onViewOnMap={() => console.log("View on map")}
          />
        </div>

        {/* Room Filters - Top Bar */}
        <div className="mb-4">
          <RoomFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Room Results Area */}
        <div>
          {/* Results Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""} available
              </h2>
              <p className="text-xs text-[#667085]">
                Apr 15 - Apr 18, 2026 (3 nights)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-3.5 text-[#667085]" />
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-8 w-[160px] border-[#E5E7EB] bg-white text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-lg border border-[#E5E7EB] bg-white"
                  />
                ))}
              </div>
            ) : filteredRooms.length > 0 ? (
              /* Room Cards */
              <div className="space-y-3">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBookRoom={() => console.log("Book room:", room.id)}
                    onAddToQuote={() => console.log("Add to quote:", room.id)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-lg border border-[#E5E7EB] bg-white py-16">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F3F4F6]">
                  <SearchX className="size-7 text-[#667085]" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  No rooms match your filters
                </h3>
                <p className="mt-1.5 max-w-sm text-center text-sm text-[#667085]">
                  Try adjusting your filter criteria to see more available room options.
                </p>
                <button
                  onClick={() =>
                    setFilters({ roomName: "", cancellation: "all", mealPlan: "all", priceRange: [0, 10000] })
                  }
                  className="mt-4 text-sm font-medium text-[#7C5CFF] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}
