"use client"

import { useState } from "react"
import { Star, MapPin, Heart, Images, Calendar, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface HotelSummaryProps {
  name: string
  starRating: number
  address: string
  imageUrl: string
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onViewGallery?: () => void
  onViewOnMap?: () => void
}

export function HotelSummary({
  name,
  starRating,
  address,
  imageUrl,
  checkIn = "Apr 15, 2026",
  checkOut = "Apr 18, 2026",
  adults = 2,
  children = 0,
  isFavorite = false,
  onToggleFavorite,
  onViewGallery,
  onViewOnMap,
}: HotelSummaryProps) {
  const [favorite, setFavorite] = useState(isFavorite)

  const handleFavoriteToggle = () => {
    setFavorite(!favorite)
    onToggleFavorite?.()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <div className="flex">
        {/* Hotel Image */}
        <div className="relative h-32 w-56 shrink-0">
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover"
          />
          {/* Favorite button */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#667085] transition-colors hover:text-red-500"
          >
            <Heart
              className={cn("size-4", favorite && "fill-red-500 text-red-500")}
            />
          </button>
          {/* Gallery button */}
          <button
            onClick={onViewGallery}
            className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <Images className="size-4" />
          </button>
        </div>

        {/* Hotel Info */}
        <div className="flex flex-1 flex-col justify-center px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#111827]">{name}</h2>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: starRating }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-[#D4A853] text-[#D4A853]"
                />
              ))}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-[#667085]">
            <MapPin className="size-4" />
            <span className="line-clamp-1">{address}</span>
          </div>

          {/* View on Map Link */}
          <button
            onClick={onViewOnMap}
            className="mt-2 flex items-center gap-1 self-start text-sm font-medium text-[#7C5CFF] hover:underline"
          >
            View on map
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Booking Info Box */}
        <div className="flex shrink-0 flex-col justify-center border-l border-[#E5E7EB] px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-[#111827]">
            <Calendar className="size-4 text-[#667085]" />
            <span>{checkIn} - {checkOut}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#111827]">
            <Users className="size-4 text-[#667085]" />
            <span>
              {adults} Adult{adults !== 1 ? "s" : ""}
              {children > 0 && `, ${children} Child${children !== 1 ? "ren" : ""}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
