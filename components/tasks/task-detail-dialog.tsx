"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import {
  addTagAction,
  deleteTaskAction,
  removeTagAction,
  updateTaskAction,
} from "@/actions/task-actions"
import { useBoard } from "@/hooks/use-tasks"
import { useBoardStore } from "@/stores/board-store"
import type {
  BoardDetailDTO,
  ColumnDTO,
  MemberDTO,
  TaskDTO,
  TaskPriority,
  TaskStatus,
} from "@/lib/types"
import type { TaskPatchValues } from "@/lib/zod-schemas"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TaskComments } from "@/components/tasks/task-comments"
import { statusFromColumnTitle } from "@/lib/status-columns"
import {
  AssigneeSelect,
  DueDatePicker,
  PrioritySelect,
  StatusSelect,
  TagsEditor,
} from "@/components/tasks/task-fields"

export function TaskDetailDialog({
  boardId,
  board,
  members,
  currentUserId,
  canEdit,
}: {
  boardId: string
  board: BoardDetailDTO
  members: MemberDTO[]
  currentUserId: string
  canEdit: boolean
}) {
  const selectedTaskId = useBoardStore((state) => state.selectedTaskId)
  const closeTask = useBoardStore((state) => state.closeTask)
  const { data } = useBoard(boardId, board)

  const task = selectedTaskId
    ? data.columns
        .flatMap((column) => column.tasks)
        .find((t) => t.id === selectedTaskId)
    : undefined

  return (
    <Dialog
      open={!!selectedTaskId}
      onOpenChange={(open) => {
        if (!open) closeTask()
      }}
    >
      {task && (
        <DialogContent
          key={task.id}
          className="bg-card/95 backdrop-blur-xl sm:max-w-2xl"
        >
          <TaskDetailContent
            task={task}
            columns={data.columns}
            members={members}
            currentUserId={currentUserId}
            canEdit={canEdit}
            onDeleted={closeTask}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}

function TaskDetailContent({
  task,
  columns,
  members,
  currentUserId,
  canEdit,
  onDeleted,
}: {
  task: TaskDTO
  columns: ColumnDTO[]
  members: MemberDTO[]
  currentUserId: string
  canEdit: boolean
  onDeleted: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [deleteOpen, setDeleteOpen] = useState(false)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["boards", task.boardId] })
  }

  function applyTaskPatch(patch: TaskPatchValues) {
    queryClient.setQueryData<BoardDetailDTO>(
      ["boards", task.boardId],
      (old) => {
        if (!old) return old
        const moved = patch.status && patch.status !== task.status
        const targetColumn = moved
          ? columns.find(
              (column) => statusFromColumnTitle(column.title) === patch.status
            )
          : undefined
        if (targetColumn) {
          const source = old.columns.find((column) =>
            column.tasks.some((t) => t.id === task.id)
          )
          if (!source) return old
          const updated: TaskDTO = {
            ...task,
            ...patch,
            status: patch.status as TaskStatus,
            columnId: targetColumn.id,
            order: Math.max(-1, ...targetColumn.tasks.map((t) => t.order)) + 1,
          }
          return {
            ...old,
            columns: old.columns.map((column) => {
              if (column.id === source.id) {
                return {
                  ...column,
                  tasks: column.tasks.filter((t) => t.id !== task.id),
                }
              }
              if (column.id === targetColumn.id) {
                return { ...column, tasks: [...column.tasks, updated] }
              }
              return column
            }),
          }
        }
        return {
          ...old,
          columns: old.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((t) => {
              if (t.id !== task.id) return t
              const assignee =
                patch.assigneeId !== undefined
                  ? patch.assigneeId
                    ? (members.find((m) => m.user.id === patch.assigneeId)
                        ?.user ?? null)
                    : null
                  : t.assignee
              return { ...t, ...patch, assignee } as TaskDTO
            }),
          })),
        }
      }
    )
  }

  async function updateTask(patch: TaskPatchValues) {
    const result = await updateTaskAction(task.id, patch)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Task updated")
    applyTaskPatch(patch)
    invalidate()
  }

  async function deleteTask() {
    const result = await deleteTaskAction(task.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Task deleted")
    setDeleteOpen(false)
    queryClient.setQueryData<BoardDetailDTO>(["boards", task.boardId], (old) =>
      old
        ? {
            ...old,
            columns: old.columns.map((column) => ({
              ...column,
              tasks: column.tasks.filter((t) => t.id !== task.id),
            })),
          }
        : old
    )
    onDeleted()
    invalidate()
  }

  async function handleAddTag(name: string, color: string) {
    const result = await addTagAction(task.id, name, color)
    if (result.error) {
      toast.error(result.error)
      return
    }
    invalidate()
  }

  async function handleRemoveTag(tagId: string) {
    const result = await removeTagAction(tagId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    invalidate()
  }

  return (
    <>
      <DialogHeader className="space-y-3 pr-10">
        <DialogTitle
          render={
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title !== task.title) updateTask({ title })
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur()
              }}
              disabled={!canEdit}
              className="border-transparent px-0 font-heading text-sm font-medium shadow-none focus-visible:border-input focus-visible:bg-card"
            />
          }
        />
      </DialogHeader>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-detail-description">Description</Label>
            <Textarea
              id="task-detail-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description ?? "")) {
                  updateTask({ description })
                }
              }}
              disabled={!canEdit}
              placeholder="Add a more detailed description…"
              className="min-h-28"
            />
          </div>
          <TaskComments
            taskId={task.id}
            boardId={task.boardId}
            currentUserId={currentUserId}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <StatusSelect
              value={task.status}
              onChange={(value: TaskStatus) => {
                if (value !== task.status) updateTask({ status: value })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelect
              value={task.priority}
              onChange={(value: TaskPriority) => {
                if (value !== task.priority) updateTask({ priority: value })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <AssigneeSelect
              value={task.assigneeId}
              members={members}
              assignee={task.assignee}
              onChange={(value) => {
                if (value !== task.assigneeId) updateTask({ assigneeId: value })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <DueDatePicker
              value={task.dueDate}
              onChange={(value) => {
                if (value !== task.dueDate) updateTask({ dueDate: value })
              }}
            />
          </div>
          {canEdit && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagsEditor
                tags={task.tags}
                onAdd={handleAddTag}
                onRemove={handleRemoveTag}
              />
            </div>
          )}
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete task
              </Button>
              <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete this task?"
                description="This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={deleteTask}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}
