"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star, Users, Heart, Images, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface RoomOption {
  id: string
  name: string
  occupancy: number
  isNonRefundable: boolean
  mealPlan: string
  price: number
  currency: string
  moreRoomsCount?: number
}

export interface HotelCardProps {
  id: string
  name: string
  starRating: number
  address: string
  imageUrl: string
  isFavorite?: boolean
  room: RoomOption
  onToggleFavorite?: () => void
  onViewGallery?: () => void
  onBookRoom?: () => void
  onAddToQuote?: () => void
  onViewMoreRooms?: () => void
}

export function HotelCard({
  name,
  starRating,
  address,
  imageUrl,
  isFavorite = false,
  room,
  onToggleFavorite,
  onViewGallery,
  onBookRoom,
  onAddToQuote,
  onViewMoreRooms,
}: HotelCardProps) {
  const router = useRouter()
  const [favorite, setFavorite] = useState(isFavorite)

  const handleBookRoom = () => {
    onBookRoom?.()
    router.push("/booking")
  }

  const handleViewMoreRooms = () => {
    onViewMoreRooms?.()
    router.push("/search-results/hotel-rooms")
  }

  const handleFavoriteToggle = () => {
    setFavorite(!favorite)
    onToggleFavorite?.()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      {/* Hotel Header Section */}
      <div className="flex">
        {/* Image */}
        <div className="relative h-36 w-48 shrink-0">
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover"
          />
          {/* Favorite button */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-[#667085] transition-colors hover:text-red-500"
          >
            <Heart className={cn("size-4", favorite && "fill-red-500 text-red-500")} />
          </button>
          {/* Gallery button */}
          <button
            onClick={onViewGallery}
            className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <Images className="size-4" />
          </button>
        </div>

        {/* Hotel Info */}
        <div className="flex flex-1 flex-col justify-center px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#111827]">{name}</h3>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: starRating }).map((_, i) => (
                <Star key={i} className="size-4 fill-[#D4A853] text-[#D4A853]" />
              ))}
            </div>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-[#667085]">{address}</p>
        </div>
      </div>

      {/* Room Section */}
      <div className="flex border-t border-[#E5E7EB] bg-[#F3F4F6]">
        {/* Room Details - Left side */}
        <div className="flex-1 px-4 py-3">
          {/* Room Name */}
          <h4 className="text-sm font-semibold text-[#111827]">
            {room.name}
          </h4>

          {/* Room Meta Row - All in one line */}
          <div className="mt-1.5 flex items-center gap-2 text-sm text-[#667085]">
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              x{room.occupancy}
            </span>
            <span className="text-[#D1D9E2]">|</span>
            <span className={cn(
              room.isNonRefundable 
                ? "text-[#E5484D]" 
                : "text-[#12B76A]"
            )}>
              {room.isNonRefundable ? "Non Refundable" : "Free Cancellation"}
            </span>
            <span className="text-[#D1D9E2]">|</span>
            <span className="text-[#111827]">{room.mealPlan}</span>
          </div>

          {/* View More Rooms */}
          {room.moreRoomsCount && room.moreRoomsCount > 0 && (
            <button
              onClick={handleViewMoreRooms}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-[#7C5CFF] hover:underline"
            >
              View {room.moreRoomsCount} more rooms
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>

        {/* Price & Actions - Right side */}
        <div className="flex w-44 shrink-0 flex-col items-center justify-center border-l border-[#E5E7EB] px-4 py-3">
          {/* Price */}
          <span className="text-lg font-bold text-[#111827]">
            {room.currency} {room.price.toFixed(2)}
          </span>

          {/* Book Room Button */}
          <button
            onClick={handleBookRoom}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B0D12] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#151922]"
          >
            Book Room
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Add to Quote Button */}
          <button
            onClick={onAddToQuote}
            className="mt-2 w-full rounded-lg border border-[#7C5CFF] px-4 py-2 text-sm font-medium text-[#7C5CFF] transition-colors hover:bg-[#7C5CFF]/5"
          >
            Add to Quote
          </button>
        </div>
      </div>
    </div>
  )
}
