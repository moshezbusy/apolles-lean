"use client"

import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  DollarSign
} from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: React.ReactNode
}

function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#667085]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              changeType === "positive" ? "text-[#12B76A]" : 
              changeType === "negative" ? "text-[#E5484D]" : 
              "text-[#667085]"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#F7F8FB]">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardStats() {
  const stats = [
    {
      label: "Searches today",
      value: 47,
      change: "+12% vs yesterday",
      changeType: "positive" as const,
      icon: <Search className="size-5 text-[#7C5CFF]" />,
    },
    {
      label: "Quotes created",
      value: 12,
      change: "3 pending response",
      changeType: "neutral" as const,
      icon: <FileText className="size-5 text-[#7C5CFF]" />,
    },
    {
      label: "Pending quotes",
      value: 8,
      change: "2 expiring soon",
      changeType: "negative" as const,
      icon: <Clock className="size-5 text-[#D4A843]" />,
    },
    {
      label: "Confirmed bookings",
      value: 23,
      change: "+5 this week",
      changeType: "positive" as const,
      icon: <CheckCircle className="size-5 text-[#12B76A]" />,
    },
    {
      label: "Upcoming check-ins",
      value: 6,
      change: "Next 7 days",
      changeType: "neutral" as const,
      icon: <Calendar className="size-5 text-[#7C5CFF]" />,
    },
    {
      label: "Supplier responses",
      value: 4,
      change: "Awaiting reply",
      changeType: "neutral" as const,
      icon: <MessageSquare className="size-5 text-[#667085]" />,
    },
    {
      label: "Revenue this month",
      value: "$48.2K",
      change: "+18% vs last month",
      changeType: "positive" as const,
      icon: <DollarSign className="size-5 text-[#12B76A]" />,
    },
    {
      label: "Avg. booking value",
      value: "$2,095",
      change: "+$120 vs avg",
      changeType: "positive" as const,
      icon: <TrendingUp className="size-5 text-[#7C5CFF]" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
