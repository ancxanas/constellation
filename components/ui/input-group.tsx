import type * as React from "react"

import { cn } from "@/lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex w-full items-center rounded-md border border-input bg-transparent text-base shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex items-center justify-center px-3 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon }
