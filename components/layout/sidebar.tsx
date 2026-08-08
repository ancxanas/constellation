"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn, initials } from "@/lib/utils"
import { navItems } from "@/lib/nav"
import { signOutAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type SidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        return (
          <Button
            key={item.href}
            render={<Link href={item.href} />}
            nativeButton={false}
            variant={active ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              active && "bg-secondary/60 font-medium"
            )}
          >
            <item.icon className="size-4 text-muted-foreground" />
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <aside className="fixed top-0 left-0 z-40 hidden h-svh w-64 flex-col border-r glass lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Sparkles className="size-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Constellation</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-4 py-4">
        <SidebarNav />
      </ScrollArea>
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? ""}
              />
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">
                {user.name || "User"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOutAction()}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
