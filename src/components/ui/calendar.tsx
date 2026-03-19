"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-[24rem] rounded-xl bg-white p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-3",
        month: "space-y-3 bg-white",
        month_caption: "relative flex h-12 items-center justify-center pt-4",
        caption: "relative flex h-12 items-center justify-center pt-4",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-start justify-between px-3 pt-3",
        nav_button: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "h-10 w-10"),
        button_previous:
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200",
        button_next:
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200",
        nav_button_previous: "shrink-0",
        nav_button_next: "shrink-0",
        month_grid: "w-full border-collapse table-fixed",
        table: "w-full border-collapse table-fixed",
        weekdays: "grid w-full grid-cols-7",
        head_row: "grid w-full grid-cols-7",
        weekday:
          "flex h-8 w-full items-center justify-center text-center text-muted-foreground font-normal text-[0.8rem]",
        head_cell:
          "flex h-8 w-full items-center justify-center text-center text-muted-foreground font-normal text-[0.8rem]",
        week: "mt-2 grid w-full grid-cols-7",
        row: "mt-2 grid w-full grid-cols-7",
        day: "h-8 w-8 p-0 text-center text-sm",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "h-8 w-8 p-0 font-normal"),
        cell: "flex h-10 w-full items-center justify-center p-0 text-center text-sm relative [&:has([aria-selected])]:bg-muted first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-muted text-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
