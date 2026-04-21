"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Users, Search, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch?: (params: SearchParams) => void
}

interface RoomConfig {
  adults: number
  childAges: number[]
}

interface SearchParams {
  destination: string
  checkIn: Date | undefined
  checkOut: Date | undefined
  rooms: RoomConfig[]
}

const AGE_OPTIONS = Array.from({ length: 18 }, (_, i) => i)

export function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter()
  const [destination, setDestination] = useState("")
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [rooms, setRooms] = useState<RoomConfig[]>([{ adults: 2, childAges: [] }])
  const [travelersOpen, setTravelersOpen] = useState(false)
  const [activeAgeSelector, setActiveAgeSelector] = useState<{ roomIndex: number; childIndex: number } | null>(null)

  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0)
  const totalChildren = rooms.reduce((sum, room) => sum + room.childAges.length, 0)
  const totalGuests = totalAdults + totalChildren
  const travelersLabel = `${totalGuests} guest${totalGuests !== 1 ? "s" : ""} · ${rooms.length} room${rooms.length !== 1 ? "s" : ""}`

  const updateRoom = (roomIndex: number, updates: Partial<RoomConfig>) => {
    setRooms(prev => prev.map((room, i) => 
      i === roomIndex ? { ...room, ...updates } : room
    ))
  }

  const removeChildByIndex = (roomIndex: number, childIndex: number) => {
    const room = rooms[roomIndex]
    const newChildAges = room.childAges.filter((_, i) => i !== childIndex)
    updateRoom(roomIndex, { childAges: newChildAges })
    setActiveAgeSelector(null)
  }

  const addRoom = () => {
    setRooms(prev => [...prev, { adults: 2, childAges: [] }])
  }

  const removeRoom = () => {
    if (rooms.length > 1) {
      setRooms(prev => prev.slice(0, -1))
    }
  }

  const handleSearch = () => {
    onSearch?.({
      destination,
      checkIn,
      checkOut,
      rooms,
    })
    // Navigate to search results
    router.push("/search-results")
  }

  const formatAge = (age: number) => {
    if (age === -1) return "Select age"
    if (age === 0) return "< 1 year"
    return `${age} year${age !== 1 ? "s" : ""}`
  }

  return (
    <div className="flex items-stretch gap-0 rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      {/* Destination */}
      <div className="relative flex min-w-0 flex-[2] items-center border-r border-[#E5E7EB] px-4">
        <MapPin className="mr-3 size-5 shrink-0 text-[#667085]" />
        <input
          type="text"
          placeholder="City, area, or hotel name"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="h-14 w-full min-w-0 bg-transparent text-[15px] text-[#111827] placeholder:text-[#9CA8B8] focus:outline-none"
        />
      </div>

      {/* Check-in */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex min-w-[140px] items-center gap-2 border-r border-[#E5E7EB] px-4 transition-colors hover:bg-[#F7F8FB]">
            <CalendarIcon className="size-4 shrink-0 text-[#667085]" />
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
                Check-in
              </p>
              <p className={cn(
                "text-sm",
                checkIn ? "text-[#111827]" : "text-[#9CA8B8]"
              )}>
                {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
              </p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={checkIn}
            onSelect={setCheckIn}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Check-out */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex min-w-[140px] items-center gap-2 border-r border-[#E5E7EB] px-4 transition-colors hover:bg-[#F7F8FB]">
            <CalendarIcon className="size-4 shrink-0 text-[#667085]" />
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
                Check-out
              </p>
              <p className={cn(
                "text-sm",
                checkOut ? "text-[#111827]" : "text-[#9CA8B8]"
              )}>
                {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
              </p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={checkOut}
            onSelect={setCheckOut}
            disabled={(date) => date < (checkIn || new Date())}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Travelers / Rooms */}
      <Popover open={travelersOpen} onOpenChange={setTravelersOpen}>
        <PopoverTrigger asChild>
          <button className="flex min-w-[160px] items-center gap-2 border-r border-[#E5E7EB] px-4 transition-colors hover:bg-[#F7F8FB]">
            <Users className="size-4 shrink-0 text-[#667085]" />
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
                Travelers
              </p>
              <p className="text-sm text-[#111827]">
                {travelersLabel}
              </p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="max-h-[400px] overflow-y-auto">
            {rooms.map((room, roomIndex) => (
              <div key={roomIndex} className="border-b border-[#E5E7EB] p-4 last:border-b-0">
                {rooms.length > 1 && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Room {roomIndex + 1}
                  </p>
                )}
                
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Adults</p>
                    <p className="text-xs text-[#667085]">Ages 18+</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateRoom(roomIndex, { adults: Math.max(1, room.adults - 1) })}
                      disabled={room.adults <= 1}
                      className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#667085] transition-colors hover:border-[#7C5CFF] hover:text-[#7C5CFF] disabled:opacity-40 disabled:hover:border-[#E5E7EB] disabled:hover:text-[#667085]"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-[#111827]">{room.adults}</span>
                    <button
                      onClick={() => updateRoom(roomIndex, { adults: room.adults + 1 })}
                      className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#667085] transition-colors hover:border-[#7C5CFF] hover:text-[#7C5CFF]"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="mt-4">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Children</p>
                    <p className="text-xs text-[#667085]">Ages 0-17</p>
                  </div>

                  {/* Children Area */}
                  <div className="mt-2">
                    {room.childAges.length === 0 ? (
                      // Empty state: "Add a child" button that opens age popover
                      <Popover 
                        open={activeAgeSelector?.roomIndex === roomIndex && activeAgeSelector?.childIndex === -1}
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveAgeSelector({ roomIndex, childIndex: -1 })
                          } else {
                            setActiveAgeSelector(null)
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            className="flex items-center gap-1.5 rounded-full border border-dashed border-[#7C5CFF] bg-[#F6F4FF] px-3 py-1.5 text-xs font-medium text-[#7C5CFF] transition-colors hover:bg-[#EBE9FF]"
                          >
                            <Plus className="size-3" />
                            Add a child
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-36 p-0" 
                          align="start" 
                          side="top"
                          sideOffset={4}
                        >
                          <div className="max-h-48 overflow-y-auto py-1">
                            {AGE_OPTIONS.map((ageOption) => (
                              <button
                                key={ageOption}
                                onClick={() => {
                                  updateRoom(roomIndex, { childAges: [ageOption] })
                                  setActiveAgeSelector(null)
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-[#111827] hover:bg-[#F7F8FB]"
                              >
                                {ageOption === 0 ? "< 1 year" : `${ageOption} year${ageOption !== 1 ? "s" : ""}`}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      // Child chips with "+" button to add more
                      <div className="flex flex-wrap items-center gap-2">
                        {room.childAges.map((age, childIndex) => (
                          <div 
                            key={childIndex}
                            className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F7F8FB] px-2.5 py-1 text-xs font-medium text-[#111827]"
                          >
                            <span>{formatAge(age)}</span>
                            <button
                              onClick={() => removeChildByIndex(roomIndex, childIndex)}
                              className="ml-0.5 rounded-full p-0.5 text-[#667085] hover:bg-[#E5E7EB] hover:text-[#111827]"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add another child button */}
                        <Popover 
                          open={activeAgeSelector?.roomIndex === roomIndex && activeAgeSelector?.childIndex === room.childAges.length}
                          onOpenChange={(open) => {
                            if (open) {
                              setActiveAgeSelector({ roomIndex, childIndex: room.childAges.length })
                            } else {
                              setActiveAgeSelector(null)
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="flex size-6 items-center justify-center rounded-full border border-dashed border-[#7C5CFF] text-[#7C5CFF] transition-colors hover:bg-[#F6F4FF]"
                            >
                              <Plus className="size-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-36 p-0" 
                            align="start" 
                            side="top"
                            sideOffset={4}
                          >
                            <div className="max-h-48 overflow-y-auto py-1">
                              {AGE_OPTIONS.map((ageOption) => (
                                <button
                                  key={ageOption}
                                  onClick={() => {
                                    updateRoom(roomIndex, { childAges: [...room.childAges, ageOption] })
                                    setActiveAgeSelector(null)
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-sm text-[#111827] hover:bg-[#F7F8FB]"
                                >
                                  {ageOption === 0 ? "< 1 year" : `${ageOption} year${ageOption !== 1 ? "s" : ""}`}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rooms Control */}
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">Rooms</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={removeRoom}
                  disabled={rooms.length <= 1}
                  className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#667085] transition-colors hover:border-[#7C5CFF] hover:text-[#7C5CFF] disabled:opacity-40 disabled:hover:border-[#E5E7EB] disabled:hover:text-[#667085]"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm font-medium text-[#111827]">{rooms.length}</span>
                <button
                  onClick={addRoom}
                  className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#667085] transition-colors hover:border-[#7C5CFF] hover:text-[#7C5CFF]"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <Button
              onClick={() => setTravelersOpen(false)}
              className="mt-4 w-full bg-[#0B0D12] text-white hover:bg-[#0D2D4D]"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        className="m-2 h-auto gap-2 rounded-lg bg-[#0B0D12] px-6 text-white hover:bg-[#0D2D4D]"
      >
        <Search className="size-4" />
        Search
      </Button>
    </div>
  )
}
