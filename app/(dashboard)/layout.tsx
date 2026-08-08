import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }

  return (
    <div className="min-h-svh">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <TopNav />
        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav user={user} />
    </div>
  )
}
