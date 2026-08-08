import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { TaskDTO } from "@/lib/types"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get("q")?.trim() ?? ""
  if (!query) {
    return NextResponse.json({ tasks: [] })
  }

  const boards = await prisma.board.findMany({
    where: { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
    select: { id: true },
  })
  const boardIds = boards.map((board) => board.id)

  const tasks = await prisma.task.findMany({
    where: {
      boardId: { in: boardIds },
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, image: true } },
      board: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  })

  const dto: TaskDTO[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    order: 0,
    columnId: task.columnId,
    boardId: task.boardId,
    assigneeId: task.assigneeId,
    assignee: task.assignee,
    tags: [],
    commentsCount: 0,
  }))

  return NextResponse.json({
    tasks: dto,
    boards: tasks.map((task) => ({
      id: task.board.id,
      title: task.board.title,
    })),
  })
}
