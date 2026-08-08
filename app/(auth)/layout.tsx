import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"

import { auth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user) redirect("/")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="flex items-center gap-2.5">
        <Sparkles className="size-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">Constellation</span>
      </div>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Organize your orbit.</p>
    </div>
  )
}
