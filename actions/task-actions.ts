"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { getBoardRole } from "@/lib/permissions"
import {
  commentSchema,
  tagSchema,
  taskSchema,
  type TaskValues,
} from "@/lib/zod-schemas"
import type { ActionResponse } from "@/lib/types"

async function taskBoardId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { boardId: true },
  })
  return task?.boardId ?? null
}

export async function createTaskAction(
  boardId: string,
  values: TaskValues
): Promise<ActionResponse> {
  const user = await requireUser()
  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = taskSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task" }
  }

  const { title, description, status, priority, dueDate, assigneeId, columnId } =
    parsed.data

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
    select: { id: true },
  })
  if (!column) return { error: "Invalid column" }

  const maxOrder = await prisma.task.aggregate({
    where: { columnId },
    _max: { order: true },
  })

  await prisma.task.create({
    data: {
      title,
      description: description?.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      columnId,
      boardId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  revalidatePath(`/boards/${boardId}`)
  return {}
}

export async function updateTaskAction(
  taskId: string,
  values: TaskValues
): Promise<ActionResponse> {
  const user = await requireUser()
  const boardId = await taskBoardId(taskId)
  if (!boardId) return { error: "Task not found" }

  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = taskSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task" }
  }

  const { title, description, status, priority, dueDate, assigneeId, columnId } =
    parsed.data

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
    select: { id: true },
  })
  if (!column) return { error: "Invalid column" }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description?.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      columnId,
    },
  })

  revalidatePath(`/boards/${boardId}`)
  return {}
}

export async function deleteTaskAction(taskId: string): Promise<ActionResponse> {
  const user = await requireUser()
  const boardId = await taskBoardId(taskId)
  if (!boardId) return { error: "Task not found" }

  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/boards/${boardId}`)
  return {}
}

export async function reorderTasksAction(input: {
  boardId: string
  updates: { taskId: string; columnId: string; order: number }[]
}): Promise<ActionResponse> {
  const user = await requireUser()
  const role = await getBoardRole(user.id, input.boardId)
  if (!role) return { error: "You are not a member of this board" }

  if (input.updates.length > 0) {
    await prisma.$transaction(
      input.updates.map((update) =>
        prisma.task.update({
          where: { id: update.taskId },
          data: { columnId: update.columnId, order: update.order },
        })
      )
    )
  }

  revalidatePath(`/boards/${input.boardId}`)
  return {}
}

export async function addCommentAction(
  taskId: string,
  content: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const boardId = await taskBoardId(taskId)
  if (!boardId) return { error: "Task not found" }

  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = commentSchema.safeParse({ content })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" }
  }

  await prisma.comment.create({
    data: { taskId, authorId: user.id, content: parsed.data.content },
  })

  revalidatePath(`/boards/${boardId}`)
  return {}
}

export async function deleteCommentAction(
  commentId: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, task: { select: { boardId: true } } },
  })
  if (!comment) return { error: "Comment not found" }

  const role = await getBoardRole(user.id, comment.task.boardId)
  const isAuthor = comment.authorId === user.id
  if (!isAuthor && role !== "OWNER" && role !== "ADMIN") {
    return { error: "You can't delete this comment" }
  }

  await prisma.comment.delete({ where: { id: commentId } })
  revalidatePath(`/boards/${comment.task.boardId}`)
  return {}
}

export async function addTagAction(
  taskId: string,
  name: string,
  color: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const boardId = await taskBoardId(taskId)
  if (!boardId) return { error: "Task not found" }

  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = tagSchema.safeParse({ name, color })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tag" }
  }

  await prisma.tag.create({
    data: { taskId, name: parsed.data.name, color: parsed.data.color },
  })

  revalidatePath(`/boards/${boardId}`)
  return {}
}

export async function removeTagAction(tagId: string): Promise<ActionResponse> {
  const user = await requireUser()
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { task: { select: { boardId: true } } },
  })
  if (!tag) return { error: "Tag not found" }

  const role = await getBoardRole(user.id, tag.task.boardId)
  if (!role) return { error: "You are not a member of this board" }

  await prisma.tag.delete({ where: { id: tagId } })
  revalidatePath(`/boards/${tag.task.boardId}`)
  return {}
}
