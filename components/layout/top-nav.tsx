"use client"

import { useState } from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export function TopNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="text-lg font-bold tracking-tight">Constellation</span>
            </div>
            <nav
              className={cn("flex-1")}
              onClick={() => setOpen(false)}
            >
              <SidebarNav />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <span className="text-sm font-medium text-muted-foreground lg:hidden">
        Constellation
      </span>
    </header>
  )
}
