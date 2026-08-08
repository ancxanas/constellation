import { redirect } from "next/navigation"
import { Mail, UserRound } from "lucide-react"

import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = session.user

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account details and preferences.
        </p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="font-medium">{user.name || "No name set"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
