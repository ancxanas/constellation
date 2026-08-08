import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTaskComments } from "@/lib/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await params

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      board: {
        select: {
          ownerId: true,
          members: { select: { userId: true } },
        },
      },
    },
  })
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isMember =
    task.board.ownerId === session.user.id ||
    task.board.members.some((member) => member.userId === session.user.id)
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const comments = await getTaskComments(session.user.id, taskId)
  return NextResponse.json({ comments })
}
