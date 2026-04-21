"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { Star, Calendar, Users, Check, ArrowLeft, AlertCircle, Building, CreditCard, PawPrint, Info } from "lucide-react"

// Mock booking data (would come from previous step in real app)
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
    details: [
      { title: "Mr", firstName: "John", lastName: "Smith" },
      { title: "Mrs", firstName: "Jane", lastName: "Smith" },
    ],
  },
  specialRequests: "High floor room preferred, quiet location if possible.",
  pricing: {
    roomRate: 336.03,
    nights: 3,
    subtotal: 1008.09,
    taxes: 161.29,
    total: 1169.38,
    currency: "USD",
  },
}

export default function BookingSummaryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeHotelNorms, setAgreeHotelNorms] = useState(false)

  const handleConfirmBooking = () => {
    setIsSubmitting(true)
    // Simulate API call - create reservation and redirect to confirmation
    setTimeout(() => {
      setIsSubmitting(false)
      // Navigate to confirmation page
      router.push("/booking/confirmation")
    }, 1500)
  }

  const handleBack = () => {
    router.push("/booking")
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#667085] transition-colors hover:bg-[#F7F8FB]"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#111827]">Review Your Booking</h1>
              <p className="mt-1 text-sm text-[#667085]">
                Please verify all details before confirming your reservation
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Booking Details */}
          <div className="flex-1">
            {/* Hotel & Room Summary Card */}
            <div className="rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Hotel & Room Details</h2>
              </div>

              <div className="p-6">
                <div className="flex gap-5">
                  {/* Hotel Image */}
                  <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={MOCK_BOOKING.hotel.imageUrl}
                      alt={MOCK_BOOKING.hotel.name}
                      className="size-full object-cover"
                    />
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#111827]">
                        {MOCK_BOOKING.hotel.name}
                      </h3>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: MOCK_BOOKING.hotel.starRating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-[#D4A853] text-[#D4A853]" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-[#667085]">{MOCK_BOOKING.hotel.address}</p>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-[#111827]">{MOCK_BOOKING.room.name}</p>
                      <p className="mt-0.5 text-sm text-[#667085]">{MOCK_BOOKING.room.description}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-[#667085]">
                        {MOCK_BOOKING.room.mealPlan}
                      </span>
                      <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-xs font-medium text-[#E5484D]">
                        {MOCK_BOOKING.room.cancellation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="mt-5 flex gap-8 border-t border-[#E5E7EB] pt-5">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Check-in</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">{MOCK_BOOKING.dates.checkIn}</p>
                      <p className="text-xs text-[#667085]">From 3:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Check-out</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">{MOCK_BOOKING.dates.checkOut}</p>
                      <p className="text-xs text-[#667085]">By 12:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Guests</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">
                        {MOCK_BOOKING.guests.adults} Adult{MOCK_BOOKING.guests.adults !== 1 ? "s" : ""}
                        {MOCK_BOOKING.guests.children > 0 && `, ${MOCK_BOOKING.guests.children} Child${MOCK_BOOKING.guests.children !== 1 ? "ren" : ""}`}
                      </p>
                      <p className="text-xs text-[#667085]">{MOCK_BOOKING.guests.rooms} Room, {MOCK_BOOKING.dates.nights} Nights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Guest Details</h2>
                <button
                  onClick={handleBack}
                  className="text-sm font-medium text-[#7C5CFF] hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {MOCK_BOOKING.guests.details.map((guest, index) => (
                    <div key={index} className={index > 0 ? "border-t border-[#E5E7EB] pt-4" : ""}>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                        Adult {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#111827]">
                        {guest.title}. {guest.firstName} {guest.lastName}
                      </p>
                    </div>
                  ))}
                </div>

                {MOCK_BOOKING.specialRequests && (
                  <div className="mt-5 border-t border-[#E5E7EB] pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                      Special Requests
                    </p>
                    <p className="mt-1 text-sm text-[#111827]">{MOCK_BOOKING.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Policy Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Cancellation Policy</h2>
              </div>

              <div className="p-6">
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

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#FEF3F2] p-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#E5484D]" />
                  <p className="text-sm text-[#B91C1C]">
                    This rate is non-refundable. If you cancel or do not show, the full booking amount will be charged.
                  </p>
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

            {/* Terms Agreement Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Terms & Agreements</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Apolles Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="size-5 rounded border-2 border-[#E5E7EB] bg-white transition-colors peer-checked:border-[#7C5CFF] peer-checked:bg-[#7C5CFF]" />
                    <Check className="absolute left-0.5 top-0.5 size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm text-[#667085]">
                    I agree to Apolles{" "}
                    <a href="/terms" className="font-medium text-[#7C5CFF] hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="font-medium text-[#7C5CFF] hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                {/* Hotel Norms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeHotelNorms}
                      onChange={(e) => setAgreeHotelNorms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="size-5 rounded border-2 border-[#E5E7EB] bg-white transition-colors peer-checked:border-[#7C5CFF] peer-checked:bg-[#7C5CFF]" />
                    <Check className="absolute left-0.5 top-0.5 size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm text-[#667085]">
                    I have read and agree to the hotel norms and policies listed above
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Price Summary (Sticky) */}
          <div className="w-[380px] shrink-0">
            <div className="sticky top-20">
              {/* Price Summary Card */}
              <div className="rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Price Summary</h2>
                </div>

                <div className="p-5">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#667085]">
                        Room ({MOCK_BOOKING.dates.nights} nights x {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.roomRate.toFixed(2)})
                      </span>
                      <span className="font-medium text-[#111827]">
                        {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#667085]">Taxes & Fees</span>
                      <span className="font-medium text-[#111827]">
                        {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.taxes.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-[#111827]">Total Amount</span>
                      <span className="text-xl font-bold text-[#111827]">
                        {MOCK_BOOKING.pricing.currency} {MOCK_BOOKING.pricing.total.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">
                      All taxes included
                    </p>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-5">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting || !agreeTerms || !agreeHotelNorms}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B0D12] py-3 text-sm font-medium text-white transition-colors hover:bg-[#151922] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                  {(!agreeTerms || !agreeHotelNorms) && (
                    <p className="mt-3 text-center text-xs text-[#E5484D]">
                      Please accept the terms and hotel norms to proceed
                    </p>
                  )}
                </div>
              </div>

              {/* Back Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleBack}
                  className="text-sm font-medium text-[#7C5CFF] hover:underline"
                >
                  Back to Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
