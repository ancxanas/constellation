"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { canManageBoard } from "@/lib/permissions"
import { boardSchema, type BoardValues } from "@/lib/zod-schemas"
import type { ActionResponse } from "@/lib/types"

export async function createBoardAction(
  values: BoardValues
): Promise<ActionResponse> {
  const user = await requireUser()
  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid board" }
  }

  const { title, description } = parsed.data
  const board = await prisma.board.create({
    data: {
      title,
      description: description?.trim() || null,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
      columns: {
        create: [
          { title: "To Do", order: 0 },
          { title: "In Progress", order: 1 },
          { title: "Done", order: 2 },
        ],
      },
    },
  })

  revalidatePath("/boards")
  return { id: board.id }
}

export async function updateBoardAction(
  boardId: string,
  values: BoardValues
): Promise<ActionResponse> {
  const user = await requireUser()
  const canManage = await canManageBoard(user.id, boardId)
  if (!canManage) return { error: "You don't have permission to edit this board" }

  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid board" }
  }

  const { title, description } = parsed.data
  await prisma.board.update({
    where: { id: boardId },
    data: { title, description: description?.trim() || null },
  })

  revalidatePath(`/boards/${boardId}`)
  revalidatePath("/boards")
  return {}
}

export async function deleteBoardAction(boardId: string): Promise<ActionResponse> {
  const user = await requireUser()
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  })
  if (!board) return { error: "Board not found" }
  if (board.ownerId !== user.id) {
    return { error: "Only the owner can delete this board" }
  }

  await prisma.board.delete({ where: { id: boardId } })
  revalidatePath("/boards")
  return {}
}

export async function addColumnAction(
  boardId: string,
  title: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const canManage = await canManageBoard(user.id, boardId)
  if (!canManage) return { error: "You don't have permission to add columns" }

  const maxOrder = await prisma.column.aggregate({
    where: { boardId },
    _max: { order: true },
  })
  const order = (maxOrder._max.order ?? -1) + 1
  const column = await prisma.column.create({
    data: { boardId, title: title.trim() || "New column", order },
  })

  revalidatePath(`/boards/${boardId}`)
  return { id: column.id }
}

export async function renameColumnAction(
  columnId: string,
  title: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  })
  if (!column) return { error: "Column not found" }

  const canManage = await canManageBoard(user.id, column.boardId)
  if (!canManage) return { error: "You don't have permission to edit columns" }

  await prisma.column.update({
    where: { id: columnId },
    data: { title: title.trim() || "Untitled" },
  })

  revalidatePath(`/boards/${column.boardId}`)
  return {}
}

export async function deleteColumnAction(columnId: string): Promise<ActionResponse> {
  const user = await requireUser()
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  })
  if (!column) return { error: "Column not found" }

  const canManage = await canManageBoard(user.id, column.boardId)
  if (!canManage) return { error: "You don't have permission to delete columns" }

  await prisma.column.delete({ where: { id: columnId } })
  revalidatePath(`/boards/${column.boardId}`)
  return {}
}

export async function reorderColumnsAction(input: {
  boardId: string
  updates: { columnId: string; order: number }[]
}): Promise<ActionResponse> {
  const user = await requireUser()
  const canManage = await canManageBoard(user.id, input.boardId)
  if (!canManage) return { error: "You don't have permission to reorder columns" }

  if (input.updates.length > 0) {
    await prisma.$transaction(
      input.updates.map((update) =>
        prisma.column.update({
          where: { id: update.columnId },
          data: { order: update.order },
        })
      )
    )
  }

  revalidatePath(`/boards/${input.boardId}`)
  return {}
}
