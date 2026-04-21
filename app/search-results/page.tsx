"use client"

import { useState } from "react"
import { TopNav } from "@/components/top-nav"
import { CompactSearchBar } from "@/components/compact-search-bar"
import { ResultsFilters } from "@/components/results-filters"
import { HotelCard, type RoomOption } from "@/components/hotel-card"
import { ArrowUpDown, SearchX } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock hotel data with simplified structure
const MOCK_HOTELS = [
  {
    id: "1",
    name: "Secrets Tulum Resort & Beach Club",
    starRating: 5,
    address: "Calle Itzimina esq. Av Kukulkan, mz 001, lote 007, reg 014, Mexico Tulum",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    isFavorite: false,
    room: {
      id: "r1",
      name: "Junior Suite (Tropical View, Double Beds), 2 Double Beds, NonSmoking",
      occupancy: 2,
      isNonRefundable: true,
      mealPlan: "All-inclusive",
      price: 336.03,
      currency: "USD",
      moreRoomsCount: 157,
    } as RoomOption,
  },
  {
    id: "2",
    name: "Le Bristol Paris",
    starRating: 5,
    address: "112 Rue du Faubourg Saint-Honoré, 8th arr., Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop",
    isFavorite: true,
    room: {
      id: "r2",
      name: "Deluxe Room, King Bed, City View",
      occupancy: 2,
      isNonRefundable: false,
      mealPlan: "Breakfast included",
      price: 485.00,
      currency: "USD",
      moreRoomsCount: 89,
    } as RoomOption,
  },
  {
    id: "3",
    name: "Hôtel Plaza Athénée",
    starRating: 5,
    address: "25 Avenue Montaigne, 8th arr., Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop",
    isFavorite: false,
    room: {
      id: "r3",
      name: "Superior Room, Queen Bed, Courtyard View",
      occupancy: 2,
      isNonRefundable: false,
      mealPlan: "Room only",
      price: 520.00,
      currency: "USD",
      moreRoomsCount: 64,
    } as RoomOption,
  },
  {
    id: "4",
    name: "The Peninsula Paris",
    starRating: 5,
    address: "19 Avenue Kléber, 16th arr., Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
    isFavorite: false,
    room: {
      id: "r4",
      name: "Grand Premier Room, King Bed, Eiffel Tower View",
      occupancy: 2,
      isNonRefundable: true,
      mealPlan: "Half board",
      price: 695.00,
      currency: "USD",
      moreRoomsCount: 42,
    } as RoomOption,
  },
  {
    id: "5",
    name: "Hôtel Lutetia",
    starRating: 5,
    address: "45 Boulevard Raspail, 6th arr., Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
    isFavorite: false,
    room: {
      id: "r5",
      name: "Deluxe Suite, King Bed, Boulevard View",
      occupancy: 3,
      isNonRefundable: true,
      mealPlan: "Breakfast included",
      price: 380.00,
      currency: "USD",
      moreRoomsCount: 78,
    } as RoomOption,
  },
]

type SortOption = "recommended" | "price-low" | "price-high" | "rating"

export default function SearchResultsPage() {
  const [sortBy, setSortBy] = useState<SortOption>("recommended")
  const [isLoading, setIsLoading] = useState(false)
  const [hotels, setHotels] = useState(MOCK_HOTELS)

  const sortedHotels = [...hotels].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.room.price - b.room.price
      case "price-high":
        return b.room.price - a.room.price
      case "rating":
        return b.starRating - a.starRating
      default:
        return 0
    }
  })

  const handleSearch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleToggleFavorite = (hotelId: string) => {
    setHotels(hotels.map(hotel => 
      hotel.id === hotelId 
        ? { ...hotel, isFavorite: !hotel.isFavorite }
        : hotel
    ))
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
        <div className="flex gap-6">
          {/* Filters - Sticky Sidebar */}
          <div className="w-64 shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <ResultsFilters />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-semibold text-[#111827]">
                  {sortedHotels.length} hotels found
                </h1>
                <p className="text-xs text-[#667085]">
                  Paris, France · Apr 15 - Apr 18, 2026
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-3.5 text-[#667085]" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-8 w-[160px] border-[#E5E7EB] bg-white text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Star Rating</SelectItem>
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
                    className="h-32 animate-pulse rounded-lg border border-[#E5E7EB] bg-white"
                  />
                ))}
              </div>
            ) : sortedHotels.length > 0 ? (
              /* Hotel Cards */
              <div className="space-y-3">
                {sortedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    id={hotel.id}
                    name={hotel.name}
                    starRating={hotel.starRating}
                    address={hotel.address}
                    imageUrl={hotel.imageUrl}
                    isFavorite={hotel.isFavorite}
                    room={hotel.room}
                    onToggleFavorite={() => handleToggleFavorite(hotel.id)}
                    onViewGallery={() => console.log("View gallery:", hotel.id)}
                    onBookRoom={() => console.log("Book room:", hotel.id)}
                    onAddToQuote={() => console.log("Add to quote:", hotel.id)}
                    onViewMoreRooms={() => console.log("View more rooms:", hotel.id)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-lg border border-[#E5E7EB] bg-white py-12">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F7F8FB]">
                  <SearchX className="size-6 text-[#667085]" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">No hotels found</h3>
                <p className="mt-1 max-w-sm text-center text-xs text-[#667085]">
                  Try adjusting your search criteria or filters to find available hotels.
                </p>
                <button
                  onClick={() => {}}
                  className="mt-3 text-xs font-medium text-[#7C5CFF] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
