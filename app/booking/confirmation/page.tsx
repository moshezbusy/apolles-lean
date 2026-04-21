"use client"

import { useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { 
  Star, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Download, 
  FileText, 
  Search, 
  Printer,
  Copy,
  Clock,
  Building,
  CreditCard,
  PawPrint,
  Info,
  AlertCircle
} from "lucide-react"

// Mock confirmed booking data
const CONFIRMED_BOOKING = {
  confirmationNumber: "APL-2026-XK7F9M",
  bookingDate: "Mar 23, 2026 at 2:45 PM",
  status: "Confirmed",
  supplierRef: "HBD-78452163",
  voucherStatus: "Ready",
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
    checkInTime: "3:00 PM",
    checkOut: "Apr 18, 2026",
    checkOutTime: "12:00 PM",
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
  pricing: {
    roomRate: 336.03,
    nights: 3,
    subtotal: 1008.09,
    taxes: 161.29,
    total: 1169.38,
    currency: "USD",
  },
}

export default function BookingConfirmationPage() {
  const router = useRouter()

  const handleCopyConfirmation = () => {
    navigator.clipboard.writeText(CONFIRMED_BOOKING.confirmationNumber)
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-8 py-8">
        {/* Success Header */}
        <div className="mb-8 rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#12B76A]">
              <CheckCircle2 className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-[#065F46]">Booking Confirmed</h1>
              <p className="mt-1 text-sm text-[#047857]">
                Your reservation has been successfully placed. A confirmation email has been sent to the registered email address.
              </p>
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <p className="text-xs text-[#047857]">Confirmation Number</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-[#065F46]">{CONFIRMED_BOOKING.confirmationNumber}</span>
                    <button 
                      onClick={handleCopyConfirmation}
                      className="rounded p-1 text-[#047857] transition-colors hover:bg-[#D1FAE5]"
                      title="Copy confirmation number"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="h-10 w-px bg-[#A7F3D0]" />
                <div>
                  <p className="text-xs text-[#047857]">Status</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#12B76A] px-2.5 py-1 text-xs font-medium text-white">
                    <span className="size-1.5 rounded-full bg-white" />
                    {CONFIRMED_BOOKING.status}
                  </span>
                </div>
                <div className="h-10 w-px bg-[#A7F3D0]" />
                <div>
                  <p className="text-xs text-[#047857]">Booked On</p>
                  <p className="mt-1 text-sm font-medium text-[#065F46]">{CONFIRMED_BOOKING.bookingDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Booking Details */}
          <div className="flex-1">
            {/* Hotel & Room Summary Card */}
            <div className="rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Reservation Details</h2>
              </div>

              <div className="p-6">
                <div className="flex gap-5">
                  {/* Hotel Image */}
                  <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={CONFIRMED_BOOKING.hotel.imageUrl}
                      alt={CONFIRMED_BOOKING.hotel.name}
                      className="size-full object-cover"
                    />
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#111827]">
                        {CONFIRMED_BOOKING.hotel.name}
                      </h3>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: CONFIRMED_BOOKING.hotel.starRating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-[#D4A853] text-[#D4A853]" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-[#667085]">{CONFIRMED_BOOKING.hotel.address}</p>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.room.name}</p>
                      <p className="mt-0.5 text-sm text-[#667085]">{CONFIRMED_BOOKING.room.description}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-[#667085]">
                        {CONFIRMED_BOOKING.room.mealPlan}
                      </span>
                      <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-xs font-medium text-[#E5484D]">
                        {CONFIRMED_BOOKING.room.cancellation}
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
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.dates.checkIn}</p>
                      <p className="text-xs text-[#667085]">From {CONFIRMED_BOOKING.dates.checkInTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Check-out</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.dates.checkOut}</p>
                      <p className="text-xs text-[#667085]">By {CONFIRMED_BOOKING.dates.checkOutTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Duration</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.dates.nights} Nights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 size-4 text-[#667085]" />
                    <div>
                      <p className="text-xs text-[#667085]">Guests</p>
                      <p className="mt-0.5 text-sm font-medium text-[#111827]">
                        {CONFIRMED_BOOKING.guests.adults} Adult{CONFIRMED_BOOKING.guests.adults !== 1 ? "s" : ""}
                        {CONFIRMED_BOOKING.guests.children > 0 && `, ${CONFIRMED_BOOKING.guests.children} Child${CONFIRMED_BOOKING.guests.children !== 1 ? "ren" : ""}`}
                      </p>
                      <p className="text-xs text-[#667085]">{CONFIRMED_BOOKING.guests.rooms} Room</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details Card */}
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="text-base font-semibold text-[#111827]">Guest Information</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {CONFIRMED_BOOKING.guests.details.map((guest, index) => (
                    <div key={index} className="rounded-lg bg-[#F9FAFB] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                        Guest {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#111827]">
                        {guest.title}. {guest.firstName} {guest.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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

          {/* Right Column - Price Summary & Actions */}
          <div className="w-[380px] shrink-0">
            <div className="sticky top-20">
              {/* Booking Reference Card */}
              <div className="rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Booking Reference</h2>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#667085]">Confirmation No.</span>
                      <span className="text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.confirmationNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#667085]">Supplier Ref.</span>
                      <span className="text-sm font-medium text-[#111827]">{CONFIRMED_BOOKING.supplierRef}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#667085]">Voucher Status</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-xs font-medium text-[#12B76A]">
                        <span className="size-1.5 rounded-full bg-[#12B76A]" />
                        {CONFIRMED_BOOKING.voucherStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Summary Card */}
              <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Price Summary</h2>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#667085]">
                        Room ({CONFIRMED_BOOKING.pricing.nights} nights x {CONFIRMED_BOOKING.pricing.currency} {CONFIRMED_BOOKING.pricing.roomRate.toFixed(2)})
                      </span>
                      <span className="text-sm text-[#111827]">
                        {CONFIRMED_BOOKING.pricing.currency} {CONFIRMED_BOOKING.pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#667085]">Taxes & Fees</span>
                      <span className="text-sm text-[#111827]">
                        {CONFIRMED_BOOKING.pricing.currency} {CONFIRMED_BOOKING.pricing.taxes.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                    <span className="text-base font-semibold text-[#111827]">Total Paid</span>
                    <span className="text-lg font-bold text-[#111827]">
                      {CONFIRMED_BOOKING.pricing.currency} {CONFIRMED_BOOKING.pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="text-base font-semibold text-[#111827]">Next Steps</h2>
                </div>

                <div className="p-5 space-y-3">
                  {/* Primary Action - Download Voucher */}
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B0D12] py-3 text-sm font-medium text-white transition-colors hover:bg-[#151922]">
                    <Download className="size-4" />
                    Download Voucher
                  </button>

                  {/* Secondary Actions */}
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F7F8FB]">
                    <Printer className="size-4" />
                    Print Confirmation
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => router.push("/reservations")}
                      className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F7F8FB]"
                    >
                      <FileText className="size-4" />
                      Reservations
                    </button>
                    <button 
                      onClick={() => router.push("/home")}
                      className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F7F8FB]"
                    >
                      <Search className="size-4" />
                      New Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
