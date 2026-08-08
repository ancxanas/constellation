"use server"

import { prisma } from "@/lib/prisma"
import type { Prisma, TaskStatus } from "@prisma/client"
import { requireUser } from "@/lib/session"
import { getBoardRole } from "@/lib/permissions"
import {
  commentSchema,
  tagSchema,
  taskPatchSchema,
  taskSchema,
  type TaskPatchValues,
  type TaskValues,
} from "@/lib/zod-schemas"
import type { ActionResponse } from "@/lib/types"
import { statusFromColumnTitle } from "@/lib/status-columns"

async function taskBoardId(taskId: string): Promise<{
  boardId: string
  columnId: string | null
  status: TaskStatus
} | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { boardId: true, columnId: true, status: true },
  })
  if (!task) return null
  return { boardId: task.boardId, columnId: task.columnId, status: task.status }
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

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    assigneeId,
    columnId,
  } = parsed.data

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

  return {}
}

export async function updateTaskAction(
  taskId: string,
  patch: TaskPatchValues
): Promise<ActionResponse> {
  const user = await requireUser()
  const scope = await taskBoardId(taskId)
  if (!scope) return { error: "Task not found" }
  const { boardId } = scope

  const role = await getBoardRole(user.id, boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = taskPatchSchema.safeParse(patch)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task" }
  }
  const values = parsed.data

  const data: Prisma.TaskUncheckedUpdateInput = {}
  if (values.title !== undefined) data.title = values.title
  if (values.description !== undefined) {
    data.description = values.description?.trim() || null
  }
  if (values.status !== undefined) data.status = values.status
  if (values.priority !== undefined) data.priority = values.priority
  if (values.dueDate !== undefined) {
    data.dueDate = values.dueDate ? new Date(values.dueDate) : null
  }
  if (values.assigneeId !== undefined) {
    data.assigneeId = values.assigneeId || null
  }

  let targetColumnId = values.columnId
  if (values.columnId !== undefined) {
    const column = await prisma.column.findFirst({
      where: { id: values.columnId, boardId },
      select: { id: true },
    })
    if (!column) return { error: "Invalid column" }
  } else if (values.status !== undefined && values.status !== scope.status) {
    const columns = await prisma.column.findMany({
      where: { boardId },
      select: { id: true, title: true },
    })
    const target = columns.find(
      (column) => statusFromColumnTitle(column.title) === values.status
    )
    if (target) targetColumnId = target.id
  }

  if (targetColumnId && targetColumnId !== scope.columnId) {
    data.columnId = targetColumnId
    const maxOrder = await prisma.task.aggregate({
      where: { columnId: targetColumnId },
      _max: { order: true },
    })
    data.order = (maxOrder._max.order ?? -1) + 1
  }

  await prisma.task.update({ where: { id: taskId }, data })

  return {}
}

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const scope = await taskBoardId(taskId)
  if (!scope) return { error: "Task not found" }

  const role = await getBoardRole(user.id, scope.boardId)
  if (!role) return { error: "You are not a member of this board" }

  await prisma.task.delete({ where: { id: taskId } })
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
    const columns = await prisma.column.findMany({
      where: { boardId: input.boardId },
      select: { id: true, title: true },
    })
    const columnStatus = new Map(
      columns.map((column) => [column.id, statusFromColumnTitle(column.title)])
    )
    const tasks = await prisma.task.findMany({
      where: { id: { in: input.updates.map((update) => update.taskId) } },
      select: { id: true, columnId: true },
    })
    const currentColumns = new Map(
      tasks.map((task) => [task.id, task.columnId])
    )

    await prisma.$transaction(
      input.updates.map((update) => {
        const moved = currentColumns.get(update.taskId) !== update.columnId
        const status = moved
          ? (columnStatus.get(update.columnId) ?? undefined)
          : undefined
        return prisma.task.update({
          where: { id: update.taskId },
          data: {
            columnId: update.columnId,
            order: update.order,
            ...(status ? { status } : {}),
          },
        })
      })
    )
  }

  return {}
}

export async function addCommentAction(
  taskId: string,
  content: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const scope = await taskBoardId(taskId)
  if (!scope) return { error: "Task not found" }

  const role = await getBoardRole(user.id, scope.boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = commentSchema.safeParse({ content })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" }
  }

  await prisma.comment.create({
    data: { taskId, authorId: user.id, content: parsed.data.content },
  })

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
  return {}
}

export async function addTagAction(
  taskId: string,
  name: string,
  color: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const scope = await taskBoardId(taskId)
  if (!scope) return { error: "Task not found" }

  const role = await getBoardRole(user.id, scope.boardId)
  if (!role) return { error: "You are not a member of this board" }

  const parsed = tagSchema.safeParse({ name, color })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tag" }
  }

  await prisma.tag.create({
    data: { taskId, name: parsed.data.name, color: parsed.data.color },
  })

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
  return {}
}
