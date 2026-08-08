import { prisma } from "@/lib/prisma"
import type { BoardDetailDTO, BoardSummaryDTO, CommentDTO } from "@/lib/types"

export async function getUserBoards(
  userId: string,
  take?: number
): Promise<BoardSummaryDTO[]> {
  const boards = await prisma.board.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: {
      _count: { select: { tasks: true, members: true } },
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    ...(take ? { take } : {}),
  })

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
    tasksCount: board._count.tasks,
    membersCount: board._count.members,
    owner: board.owner,
  }))
}

export async function getBoardDetail(
  userId: string,
  boardId: string
): Promise<BoardDetailDTO | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      columns: {
        include: {
          tasks: {
            include: {
              tags: true,
              assignee: {
                select: { id: true, name: true, email: true, image: true },
              },
              _count: { select: { comments: true } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!board) return null

  const isMember =
    board.ownerId === userId ||
    board.members.some((member) => member.userId === userId)
  if (!isMember) return null

  return {
    id: board.id,
    title: board.title,
    description: board.description,
    ownerId: board.ownerId,
    owner: board.owner,
    members: board.members.map((member) => ({
      id: member.id,
      role: member.role,
      user: member.user,
    })),
    columns: board.columns.map((column) => ({
      id: column.id,
      title: column.title,
      order: column.order,
      boardId: column.boardId,
      tasks: column.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        order: task.order,
        columnId: task.columnId,
        boardId: task.boardId,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        tags: task.tags,
        commentsCount: task._count.comments,
      })),
    })),
  }
}

export async function getTaskComments(taskId: string): Promise<CommentDTO[]> {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    author: comment.author,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }))
}
