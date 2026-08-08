import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getBoardDetail } from "@/lib/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { boardId } = await params
  const board = await getBoardDetail(session.user.id, boardId)
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ board })
}
