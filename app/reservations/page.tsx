"use client"

import { useState } from "react"
import { TopNav } from "@/components/top-nav"
import { 
  Search, 
  Calendar, 
  ArrowUpDown, 
  FileText, 
  Download,
  MoreHorizontal,
  X,
  Filter,
  ChevronDown,
  Building,
  User,
  MapPin,
  SearchX
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Mock reservation data
const MOCK_RESERVATIONS = [
  {
    id: "APL-2026-78542",
    hotelName: "Secrets Tulum Resort & Beach Club",
    guestName: "John Anderson",
    destination: "Tulum, Mexico",
    checkIn: "2026-04-15",
    checkOut: "2026-04-18",
    status: "confirmed",
    cancellationStatus: null,
    supplier: "Hotelbeds",
    totalPrice: 1008.09,
    currency: "USD",
    bookedOn: "2026-03-22",
    roomType: "Junior Suite (Tropical View)",
  },
  {
    id: "APL-2026-78541",
    hotelName: "Le Bristol Paris",
    guestName: "Emma Williams",
    destination: "Paris, France",
    checkIn: "2026-04-20",
    checkOut: "2026-04-25",
    status: "confirmed",
    cancellationStatus: null,
    supplier: "Expedia",
    totalPrice: 2425.00,
    currency: "USD",
    bookedOn: "2026-03-21",
    roomType: "Deluxe Room, King Bed",
  },
  {
    id: "APL-2026-78540",
    hotelName: "The Peninsula Paris",
    guestName: "Michael Chen",
    destination: "Paris, France",
    checkIn: "2026-04-10",
    checkOut: "2026-04-12",
    status: "pending",
    cancellationStatus: null,
    supplier: "Booking.com",
    totalPrice: 1390.00,
    currency: "USD",
    bookedOn: "2026-03-20",
    roomType: "Grand Premier Room",
  },
  {
    id: "APL-2026-78539",
    hotelName: "Hôtel Plaza Athénée",
    guestName: "Sarah Johnson",
    destination: "Paris, France",
    checkIn: "2026-03-28",
    checkOut: "2026-03-30",
    status: "cancelled",
    cancellationStatus: "refunded",
    supplier: "Hotelbeds",
    totalPrice: 1040.00,
    currency: "USD",
    bookedOn: "2026-03-15",
    roomType: "Superior Room, Queen Bed",
  },
  {
    id: "APL-2026-78538",
    hotelName: "Four Seasons Resort Bali",
    guestName: "David Kim",
    destination: "Bali, Indonesia",
    checkIn: "2026-05-01",
    checkOut: "2026-05-07",
    status: "confirmed",
    cancellationStatus: null,
    supplier: "Direct",
    totalPrice: 3150.00,
    currency: "USD",
    bookedOn: "2026-03-18",
    roomType: "Pool Villa",
  },
  {
    id: "APL-2026-78537",
    hotelName: "Mandarin Oriental Bangkok",
    guestName: "Lisa Park",
    destination: "Bangkok, Thailand",
    checkIn: "2026-04-05",
    checkOut: "2026-04-08",
    status: "voucher_issued",
    cancellationStatus: null,
    supplier: "Agoda",
    totalPrice: 890.00,
    currency: "USD",
    bookedOn: "2026-03-17",
    roomType: "Deluxe River View",
  },
  {
    id: "APL-2026-78536",
    hotelName: "The Ritz London",
    guestName: "James Wilson",
    destination: "London, UK",
    checkIn: "2026-03-25",
    checkOut: "2026-03-28",
    status: "failed",
    cancellationStatus: null,
    supplier: "Hotelbeds",
    totalPrice: 1875.00,
    currency: "USD",
    bookedOn: "2026-03-16",
    roomType: "Executive Suite",
  },
  {
    id: "APL-2026-78535",
    hotelName: "Aman Tokyo",
    guestName: "Robert Taylor",
    destination: "Tokyo, Japan",
    checkIn: "2026-04-12",
    checkOut: "2026-04-16",
    status: "confirmed",
    cancellationStatus: null,
    supplier: "Direct",
    totalPrice: 2800.00,
    currency: "USD",
    bookedOn: "2026-03-14",
    roomType: "Premier Room",
  },
]

type SortOption = "newest" | "oldest" | "check-in" | "price-high" | "price-low"
type StatusFilter = "all" | "confirmed" | "pending" | "cancelled" | "failed" | "voucher_issued"
type SupplierFilter = "all" | "Hotelbeds" | "Expedia" | "Booking.com" | "Direct" | "Agoda"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-[#ECFDF3] text-[#12B76A]" },
  pending: { label: "Pending", className: "bg-[#FFFBEB] text-[#F5B546]" },
  cancelled: { label: "Cancelled", className: "bg-[#FEF3F2] text-[#E5484D]" },
  failed: { label: "Failed", className: "bg-[#FEF3F2] text-[#E5484D]" },
  voucher_issued: { label: "Voucher Issued", className: "bg-[#EEF4FF] text-[#7C5CFF]" },
}

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Filter and sort reservations
  const filteredReservations = MOCK_RESERVATIONS
    .filter((res) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          res.id.toLowerCase().includes(query) ||
          res.hotelName.toLowerCase().includes(query) ||
          res.guestName.toLowerCase().includes(query) ||
          res.destination.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (statusFilter !== "all" && res.status !== statusFilter) return false
      
      // Supplier filter
      if (supplierFilter !== "all" && res.supplier !== supplierFilter) return false
      
      // Date range filter
      if (dateFrom && new Date(res.checkIn) < new Date(dateFrom)) return false
      if (dateTo && new Date(res.checkOut) > new Date(dateTo)) return false
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.bookedOn).getTime() - new Date(a.bookedOn).getTime()
        case "oldest":
          return new Date(a.bookedOn).getTime() - new Date(b.bookedOn).getTime()
        case "check-in":
          return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        case "price-high":
          return b.totalPrice - a.totalPrice
        case "price-low":
          return a.totalPrice - b.totalPrice
        default:
          return 0
      }
    })

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSupplierFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || supplierFilter !== "all" || dateFrom || dateTo

  // Summary metrics
  const totalReservations = MOCK_RESERVATIONS.length
  const confirmedCount = MOCK_RESERVATIONS.filter(r => r.status === "confirmed").length
  const pendingCount = MOCK_RESERVATIONS.filter(r => r.status === "pending").length
  const upcomingCheckIns = MOCK_RESERVATIONS.filter(r => 
    r.status === "confirmed" && new Date(r.checkIn) > new Date()
  ).length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <TopNav />

      <main className="mx-auto max-w-[1600px] px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#111827]">Reservations</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Search, filter, and manage recent bookings
          </p>
        </div>

        {/* Summary Metrics - This Month */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-[#667085]">This Month{"'"}s Statistics</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Total Reservations</p>
              <p className="mt-1 text-2xl font-semibold text-[#111827]">{totalReservations}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Confirmed</p>
              <p className="mt-1 text-2xl font-semibold text-[#12B76A]">{confirmedCount}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-[#F5B546]">{pendingCount}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Upcoming Check-ins</p>
              <p className="mt-1 text-2xl font-semibold text-[#7C5CFF]">{upcomingCheckIns}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search Input */}
            <div className="flex flex-col gap-1 flex-1 min-w-[280px]">
              <label className="text-xs text-[#667085]">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by booking ref, hotel, guest name, or destination..."
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA8B8] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA8B8] hover:text-[#667085]"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#667085]">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-10 w-[150px] border-[#E5E7EB] bg-white text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="voucher_issued">Voucher Issued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#667085]">Supplier</label>
              <Select value={supplierFilter} onValueChange={(v) => setSupplierFilter(v as SupplierFilter)}>
                <SelectTrigger className="h-10 w-[150px] border-[#E5E7EB] bg-white text-sm">
                  <SelectValue placeholder="Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="Hotelbeds">Hotelbeds</SelectItem>
                  <SelectItem value="Expedia">Expedia</SelectItem>
                  <SelectItem value="Booking.com">Booking.com</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Agoda">Agoda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#667085]">Check-in From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8] pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-[150px] rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-sm text-[#111827] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
                />
              </div>
            </div>

            {/* Check-out Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#667085]">Check-out Until</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA8B8] pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-[150px] rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-sm text-[#111827] focus:border-[#7C5CFF] focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="flex flex-col gap-1 ml-auto">
              <label className="text-xs text-[#667085]">Sort By</label>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-4 text-[#667085]" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-10 w-[170px] border-[#E5E7EB] bg-white text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="check-in">Upcoming Check-in</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm font-medium text-[#7C5CFF] hover:underline"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-[#667085]">
            Showing <span className="font-medium text-[#111827]">{filteredReservations.length}</span> reservation{filteredReservations.length !== 1 ? "s" : ""}
            {hasActiveFilters && " matching your filters"}
          </p>
        </div>

        {/* Reservations Table */}
        {filteredReservations.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Booking Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Hotel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation, index) => {
                  const statusConfig = STATUS_CONFIG[reservation.status]
                  return (
                    <tr 
                      key={reservation.id} 
                      className={`border-b border-[#E5E7EB] transition-colors hover:bg-[#F9FAFB] ${
                        index === filteredReservations.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#7C5CFF]">
                          {reservation.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[#111827] line-clamp-1">
                            {reservation.hotelName}
                          </p>
                          <p className="text-xs text-[#667085] line-clamp-1">
                            {reservation.roomType}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {reservation.guestName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#667085]">
                          {reservation.destination}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {formatDate(reservation.checkIn)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {formatDate(reservation.checkOut)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#667085]">
                          {reservation.supplier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-[#111827]">
                          {reservation.currency} {reservation.totalPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => window.location.href = `/reservations/${reservation.id}`}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#7C5CFF] transition-colors hover:bg-[#7C5CFF]/10"
                          >
                            View
                          </button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="rounded-lg p-1.5 text-[#667085] transition-colors hover:bg-[#F3F4F6]">
                                <MoreHorizontal className="size-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1.5" align="end">
                              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#111827] hover:bg-[#F7F8FB]">
                                <Download className="size-4 text-[#667085]" />
                                Voucher
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#111827] hover:bg-[#F7F8FB]">
                                <FileText className="size-4 text-[#667085]" />
                                Requote
                              </button>
                              {reservation.status !== "cancelled" && (
                                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#E5484D] hover:bg-red-50">
                                  <X className="size-4" />
                                  Cancel
                                </button>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#E5E7EB] bg-white py-16">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F7F8FB]">
              <SearchX className="size-7 text-[#667085]" />
            </div>
            <h3 className="text-base font-semibold text-[#111827]">No reservations found</h3>
            <p className="mt-1.5 max-w-md text-center text-sm text-[#667085]">
              No reservations match your current search criteria or filters. Try adjusting your search or clearing filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-[#7C5CFF] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
