"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { addTagAction, deleteTaskAction, removeTagAction, updateTaskAction } from "@/actions/task-actions"
import { useBoard } from "@/hooks/use-tasks"
import { useBoardStore } from "@/stores/board-store"
import type { BoardDetailDTO, MemberDTO, TaskPriority, TaskStatus } from "@/lib/types"
import type { TaskValues } from "@/lib/zod-schemas"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const queryClient = useQueryClient()
  const { data } = useBoard(boardId, board)

  const task = selectedTaskId
    ? data.columns.flatMap((column) => column.tasks).find((t) => t.id === selectedTaskId)
    : undefined

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [syncedTaskId, setSyncedTaskId] = useState<string | null>(null)

  if (task && task.id !== syncedTaskId) {
    setSyncedTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description ?? "")
  }

  if (!task) return null
  const currentTask = task

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["boards", boardId] })
  }

  async function updateTask(overrides: Partial<TaskValues>) {
    const nextOverrides = overrides
    if (overrides.status && overrides.status !== currentTask.status) {
      const targetColumn = board.columns.find(
        (column) =>
          statusFromColumnTitle(column.title) === overrides.status
      )
      if (targetColumn) {
        nextOverrides.columnId = targetColumn.id
      }
    }
    const result = await updateTaskAction(currentTask.id, {
      title,
      description: description || "",
      status: currentTask.status,
      priority: currentTask.priority,
      dueDate: currentTask.dueDate,
      assigneeId: currentTask.assigneeId,
      columnId: currentTask.columnId,
      ...nextOverrides,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Task updated")
    invalidate()
  }

  async function deleteTask() {
    const result = await deleteTaskAction(currentTask.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Task deleted")
    setDeleteOpen(false)
    closeTask()
    invalidate()
  }

  async function handleAddTag(name: string, color: string) {
    const result = await addTagAction(currentTask.id, name, color)
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
    <Dialog
      open={!!selectedTaskId}
      onOpenChange={(open) => {
        if (!open) closeTask()
      }}
    >
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3 pr-10">
          <DialogTitle
            render={
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title !== currentTask.title) updateTask({ title })
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
                  if (description !== (currentTask.description ?? "")) {
                    updateTask({ description })
                  }
                }}
                disabled={!canEdit}
                placeholder="Add a more detailed description…"
                className="min-h-28"
              />
            </div>
            <TaskComments
              taskId={currentTask.id}
              boardId={boardId}
              currentUserId={currentUserId}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <StatusSelect
                value={currentTask.status}
                onChange={(value: TaskStatus) => {
                  if (value !== currentTask.status) updateTask({ status: value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <PrioritySelect
                value={currentTask.priority}
                onChange={(value: TaskPriority) => {
                  if (value !== currentTask.priority) updateTask({ priority: value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <AssigneeSelect
                value={currentTask.assigneeId}
                members={members}
                onChange={(value) => {
                  if (value !== currentTask.assigneeId) updateTask({ assigneeId: value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <DueDatePicker
                value={currentTask.dueDate}
                onChange={(value) => {
                  if (value !== currentTask.dueDate) updateTask({ dueDate: value })
                }}
              />
            </div>
            {canEdit && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagsEditor
                  tags={currentTask.tags}
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
      </DialogContent>
    </Dialog>
  )
}
