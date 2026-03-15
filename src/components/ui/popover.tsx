"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "~/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  asChild,
  children,
  ...props
}: PopoverPrimitive.Trigger.Props & {
  asChild?: boolean
}) {
  if (asChild) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        render={children as React.ReactElement}
        {...props}
      />
    )
  }

  return (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
      {children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({
  className,
  sideOffset = 8,
  align = "center",
  side = "bottom",
  children,
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number
  align?: PopoverPrimitive.Positioner.Props["align"]
  side?: PopoverPrimitive.Positioner.Props["side"]
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} side={side} sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          initialFocus={false}
          finalFocus
          className={cn(
            "z-50 min-w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
