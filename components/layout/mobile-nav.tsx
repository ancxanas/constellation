"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Columns3, Settings, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { signOutAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SidebarUser } from "@/components/layout/sidebar"

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/boards", label: "Boards", icon: Columns3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileNav({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 text-xs",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          )
        })}

        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="flex flex-col items-center gap-1 px-4 py-1 text-xs text-muted-foreground"
              />
            }
          >
            <Avatar className="size-5">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback className="text-[8px]">
                {(user.name || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Account
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4">
            <SheetTitle className="sr-only">Account</SheetTitle>
            <div className="mb-2 flex items-center gap-3 px-2 pt-2">
              <Avatar className="size-10">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                <AvatarFallback>
                  {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.name || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="mt-2 w-full justify-start"
                  />
                }
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-full">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="size-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="size-4" /> Dark
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="mt-2 w-full justify-start text-destructive hover:text-destructive"
              onClick={() => signOutAction()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
