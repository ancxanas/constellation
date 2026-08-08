import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getUserBoards } from "@/lib/queries"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const boards = await getUserBoards(session.user.id)
  return NextResponse.json({ boards })
}
