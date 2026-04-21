"use client"

import { useRouter } from "next/navigation"
import { Users, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface RoomCardData {
  id: string
  name: string
  description?: string
  occupancy: number
  isNonRefundable: boolean
  mealPlan: string
  highlights?: string[]
  price: number
  currency: string
}

interface RoomCardProps {
  room: RoomCardData
  onBookRoom?: () => void
  onAddToQuote?: () => void
}

export function RoomCard({ room, onBookRoom, onAddToQuote }: RoomCardProps) {
  const router = useRouter()

  const handleBookRoom = () => {
    onBookRoom?.()
    router.push("/booking")
  }

  return (
    <div className="flex overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      {/* Room Details - Left side */}
      <div className="flex-1 p-4">
        {/* Room Name */}
        <h4 className="text-sm font-semibold text-[#111827]">{room.name}</h4>

        {/* Room Description */}
        {room.description && (
          <p className="mt-1 text-sm text-[#667085] line-clamp-2">{room.description}</p>
        )}

        {/* Room Meta Row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {/* Occupancy */}
          <span className="flex items-center gap-1.5 text-[#667085]">
            <Users className="size-4" />
            <span>x{room.occupancy}</span>
          </span>

          {/* Divider */}
          <span className="text-[#E5E7EB]">|</span>

          {/* Cancellation Status */}
          <span
            className={cn(
              "font-medium",
              room.isNonRefundable ? "text-[#E5484D]" : "text-[#12B76A]"
            )}
          >
            {room.isNonRefundable ? "Non Refundable" : "Free Cancellation"}
          </span>

          {/* Divider */}
          <span className="text-[#E5E7EB]">|</span>

          {/* Meal Plan */}
          <span className="flex items-center gap-1.5 text-[#111827]">
            <Utensils className="size-4 text-[#667085]" />
            {room.mealPlan}
          </span>
        </div>

        {/* Highlights */}
        {room.highlights && room.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {room.highlights.map((highlight, index) => (
              <span
                key={index}
                className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#667085]"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price & Actions - Right side */}
      <div className="flex w-44 shrink-0 flex-col items-end justify-center border-l border-[#E5E7EB] bg-[#F7F8FB] px-4 py-4">
        {/* Price */}
        <span className="text-lg font-bold text-[#111827]">
          {room.currency} {room.price.toFixed(2)}
        </span>

        {/* Book Room Button */}
        <Button
          onClick={handleBookRoom}
          className="mt-3 h-9 w-full bg-[#0B0D12] text-sm text-white hover:bg-[#151922]"
        >
          Book Room
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-1.5"
          >
            <path
              d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        {/* Add to Quote */}
        <Button
          onClick={onAddToQuote}
          variant="outline"
          className="mt-2 h-8 w-full border-[#7C5CFF] text-xs text-[#7C5CFF] hover:bg-[#7C5CFF]/5"
        >
          Add to Quote
        </Button>
      </div>
    </div>
  )
}
