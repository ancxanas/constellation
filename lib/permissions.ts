import type { BoardRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export async function getBoardRole(
  userId: string,
  boardId: string
): Promise<BoardRole | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  })
  if (!board) return null
  if (board.ownerId === userId) return "OWNER"

  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  })
  return member?.role ?? null
}

export async function canManageBoard(userId: string, boardId: string) {
  const role = await getBoardRole(userId, boardId)
  return role === "OWNER" || role === "ADMIN"
}
