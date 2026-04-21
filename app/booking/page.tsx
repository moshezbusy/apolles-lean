"use client"

import { useState } from "react"
import { TopNav } from "@/components/top-nav"
import { Star, Calendar, Users, Info, Shield, Clock, AlertCircle, CreditCard, PawPrint, Building } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock selected booking data
const MOCK_BOOKING = {
  hotel: {
    name: "Secrets Tulum Resort & Beach Club",
    starRating: 5,
    address: "Calle Itzimina esq. Av Kukulkan, mz 001, lote 007, reg 014, Mexico Tulum",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
  },
  room: {
    name: "Junior Suite (Tropical View, Double Beds)",
    description: "2 Double Beds, Non-Smoking, Private balcony with tropical garden views",
    mealPlan: "All Inclusive",
    cancellation: "Non-Refundable",
  },
  dates: {
    checkIn: "Apr 15, 2026",
    checkOut: "Apr 18, 2026",
    nights: 3,
  },
  guests: {
    adults: 2,
    children: 0,
    rooms: 1,
  },
  pricing: {
    roomRate: 336.03,
    nights: 3,
    subtotal: 1008.09,
    taxes: 161.29,
    total: 1169.38,
    currency: "USD",
  },
}

interface GuestInfo {
  title: string
  firstName: string
  lastName: string
}

export default function BookingPage() {
  const adultsCount = MOCK_BOOKING.guests.adults
  const [guests, setGuests] = useState<GuestInfo[]>(
    Array.from({ length: adultsCount }, () => ({ title: "", firstName: "", lastName: "" }))
  )
  const [specialRequests, setSpecialRequests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateGuest = (index: number, field: keyof GuestInfo, value: string) => {
    setGuests(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // Navigate to booking summary
      window.location.href = "/booking/summary"
    }, 1000)
  }

  const isFormValid = guests.every(g => g.title && g.firstName.trim() && g.lastName.trim())

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827]">Complete Your Booking</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Enter guest details to proceed with your reservation
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Guest Details Form */}
          <div className="flex-1">
            {/* Guest Details Card */}
            <div className="rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Guest Details</h2>
                <p className="mt-0.5 text-sm text-[#667085]">Lead guest information</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Guest Rows */}
                  {guests.map((guest, index) => (
                    <div key={index} className={index > 0 ? "border-t border-[#E5E7EB] pt-6" : ""}>
                      <h3 className="mb-4 text-sm font-medium text-[#111827]">
                        Adult {index + 1}
                      </h3>
                      <div className="flex gap-4">
                        {/* Title */}
                        <div className="w-28 shrink-0">
                          <label className="mb-1.5 block text-xs font-medium text-[#667085]">
                            Title <span className="text-[#E5484D]">*</span>
                          </label>
                          <Select 
                            value={guest.title} 
                            onValueChange={(value) => updateGuest(index, "title", value)}
                          >
                            <SelectTrigger className="h-10 w-full border-[#E5E7EB] bg-white text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mr">Mr</SelectItem>
                              <SelectItem value="mrs">Mrs</SelectItem>
                              <SelectItem value="ms">Ms</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* First Name */}
                        <div className="flex-1">
                          <label className="mb-1.5 block text-xs font-medium text-[#667085]">
                            First Name <span className="text-[#E5484D]">*</span>
                          </label>
                          <input
                            type="text"
                            value={guest.firstName}
                            onChange={(e) => updateGuest(index, "firstName", e.target.value)}
                            placeholder="Enter first name"
                            className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
                          />
                        </div>

                        {/* Last Name */}
                        <div className="flex-1">
                          <label className="mb-1.5 block text-xs font-medium text-[#667085]">
                            Last Name <span className="text-[#E5484D]">*</span>
                          </label>
                          <input
                            type="text"
                            value={guest.lastName}
                            onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                            placeholder="Enter last name"
                            className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Special Requests */}
                  <div className="border-t border-[#E5E7EB] pt-6">
                    <label className="mb-1.5 block text-sm font-medium text-[#111827]">
                      Special Requests <span className="text-[#667085] font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Enter any special requests or preferences (e.g., high floor, quiet room, dietary requirements)"
                      rows={4}
                      className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] resize-none"
                    />
                    <p className="mt-1.5 text-xs text-[#667085]">
                      Special requests are subject to availability and cannot be guaranteed.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Cancellation Policy Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#667085]" />
                  <h2 className="text-base font-semibold text-[#111827]">Cancellation Policy</h2>
                </div>
              </div>

              <div className="p-6">
                {/* Cancellation Schedule Table */}
                <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        <th className="border-b border-[#E5E7EB] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                          From
                        </th>
                        <th className="border-b border-[#E5E7EB] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                          Until
                        </th>
                        <th className="border-b border-[#E5E7EB] px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#667085]">
                          Fee
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-b border-[#E5E7EB] px-4 py-3 text-sm text-[#111827]">
                          Mar 22, 2026
                        </td>
                        <td className="border-b border-[#E5E7EB] px-4 py-3 text-sm text-[#111827]">
                          Mar 22, 2026
                        </td>
                        <td className="border-b border-[#E5E7EB] px-4 py-3 text-right text-sm font-medium text-[#12B76A]">
                          Free
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-[#111827]">
                          Mar 23, 2026
                        </td>
                        <td className="px-4 py-3 text-sm text-[#111827]">
                          Aug 6, 2026
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-[#E5484D]">
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Policy Notes */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#E5484D]" />
                    <p className="text-sm text-[#667085]">
                      If you do not arrive for your reservation, the full booking amount will be charged.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#F5B546]" />
                    <p className="text-sm text-[#667085]">
                      Checking out before your scheduled departure date may result in a charge equal to the cancellation fee.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Norms Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Hotel Norms & Policies</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Check-in Instructions */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                      <Building className="size-4 text-[#667085]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">Check-in Instructions</p>
                      <ul className="mt-1 space-y-1.5 text-sm text-[#667085]">
                        <li>Government-issued photo identification and a credit card, debit card, or cash deposit may be required at check-in for incidental charges</li>
                        <li>Minimum check-in age is 18 years</li>
                        <li>Front desk staff will greet guests on arrival at the property</li>
                      </ul>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                      <CreditCard className="size-4 text-[#667085]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">Payment & Fees</p>
                      <ul className="mt-1 space-y-1.5 text-sm text-[#667085]">
                        <li>Cards accepted: Visa, Mastercard, American Express, Debit cards</li>
                        <li>Cashless transactions are available</li>
                        <li>Extra-person charges may apply and vary depending on property policy</li>
                      </ul>
                    </div>
                  </div>

                  {/* Pet Policy */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                      <PawPrint className="size-4 text-[#667085]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">Pet Policy</p>
                      <ul className="mt-1 space-y-1.5 text-sm text-[#667085]">
                        <li>Pet fee: USD 65 per pet, per day</li>
                        <li>Only dogs are allowed, maximum weight 22 lb (10 kg)</li>
                        <li>Maximum 1 pet per room, pets cannot be left unattended</li>
                        <li>Service animals are exempt from fees</li>
                      </ul>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                      <Info className="size-4 text-[#667085]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">Property Information</p>
                      <ul className="mt-1 space-y-1.5 text-sm text-[#667085]">
                        <li>Adults-only property - guests under 18 years old are not permitted</li>
                        <li>Pool access available from 8:00 AM to 6:00 PM</li>
                        <li>Beach shuttle service available from 9:30 AM - 4:00 PM</li>
                        <li>This property welcomes guests of all sexual orientations and gender identities (LGBTQ+ friendly)</li>
                        <li>Reservations are required for massage services - contact property prior to arrival</li>
                        <li>Safety features include fire extinguisher</li>
                      </ul>
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div className="mt-4 rounded-lg bg-[#FFFBEB] p-4">
                    <p className="text-sm text-[#92400E]">
                      <strong>Note:</strong> This property comprises the main hotel building and a separate beachfront section (Casa Zamna room types). The separate beachfront section is located 4.7 miles (7.7 km) from the main building and the parking area.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Summary (Sticky) */}
          <div className="w-[380px] shrink-0">
            <div className="sticky top-20">
              {/* Hotel & Room Summary Card */}
              <div className="rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Your Selection</h2>
                </div>

                <div className="p-5">
                  {/* Hotel Image */}
                  <div className="relative h-32 w-full overflow-hidden rounded-lg">
                    <img
                      src={MOCK_BOOKING.hotel.imageUrl}
                      alt={MOCK_BOOKING.hotel.name}
                      className="size-full object-cover"
                    />
                  </div>

                  {/* Hotel Info */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#111827]">
                        {MOCK_BOOKING.hotel.name}
                      </h3>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: MOCK_BOOKING.hotel.starRating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-[#D4A853] text-[#D4A853]" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">{MOCK_BOOKING.hotel.address}</p>
                  </div>

                  {/* Room Info */}
                  <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                    <p className="text-sm font-medium text-[#111827]">{MOCK_BOOKING.room.name}</p>
                    <p className="mt-1 text-xs text-[#667085]">{MOCK_BOOKING.room.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#667085]">
                        {MOCK_BOOKING.room.mealPlan}
                      </span>
                      <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-xs text-[#E5484D]">
                        {MOCK_BOOKING.room.cancellation}
                      </span>
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                    <div className="flex items-center gap-2 text-sm text-[#111827]">
                      <Calendar className="size-4 text-[#667085]" />
                      <span>
                        {MOCK_BOOKING.dates.checkIn} - {MOCK_BOOKING.dates.checkOut}
                      </span>
                    </div>
                    <p className="ml-6 text-xs text-[#667085]">
                      {MOCK_BOOKING.dates.nights} night{MOCK_BOOKING.dates.nights !== 1 ? "s" : ""}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-sm text-[#111827]">
                      <Users className="size-4 text-[#667085]" />
                      <span>
                        {MOCK_BOOKING.guests.adults} Adult{MOCK_BOOKING.guests.adults !== 1 ? "s" : ""}
                        {MOCK_BOOKING.guests.children > 0 &&
                          `, ${MOCK_BOOKING.guests.children} Child${MOCK_BOOKING.guests.children !== 1 ? "ren" : ""}`}
                        {" "}&middot; {MOCK_BOOKING.guests.rooms} Room
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Card */}
              <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Price Summary</h2>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    {/* Room Rate */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#667085]">
                        Room ({MOCK_BOOKING.pricing.nights} night{MOCK_BOOKING.pricing.nights !== 1 ? "s" : ""} x {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.roomRate.toFixed(2)})
                      </span>
                      <span className="text-[#111827]">
                        {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Taxes */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#667085]">Taxes & Fees</span>
                      <span className="text-[#111827]">
                        {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.taxes.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                    <span className="text-base font-semibold text-[#111827]">Total</span>
                    <span className="text-xl font-bold text-[#111827]">
                      {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6B7280] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#4B5563] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Continue to Summary"}
                  </button>

                  <p className="mt-3 text-center text-xs text-[#667085]">
                    You will review all details before final confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
