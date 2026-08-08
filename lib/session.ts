import { auth } from "@/lib/auth"

export async function requireUser(): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}
