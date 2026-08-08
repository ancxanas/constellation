import {
  Columns3,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react"
import type { Route } from "next"

export type NavItem = {
  href: Route
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/boards", label: "Boards", shortLabel: "Boards", icon: Columns3 },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
  },
]
