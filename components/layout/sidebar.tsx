"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Sparkles,
  Columns3,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { signOutAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/boards", label: "Boards", icon: Columns3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export type SidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

function initials(name?: string | null, email?: string | null) {
  const source = name || email || "?"
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
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
    <aside className="glass fixed left-0 top-0 z-40 hidden h-svh w-64 flex-col border-r lg:flex">
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
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
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
            <DropdownMenuLabel className="truncate">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
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
