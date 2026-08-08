"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { createTaskAction } from "@/actions/task-actions"
import { taskSchema, type TaskValues } from "@/lib/zod-schemas"
import type { MemberDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AssigneeSelect,
  DueDatePicker,
  PrioritySelect,
  StatusSelect,
} from "@/components/tasks/task-fields"

export function TaskForm({
  boardId,
  columnId,
  members,
  onSuccess,
}: {
  boardId: string
  columnId: string
  members: MemberDTO[]
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      assigneeId: null,
      columnId,
    },
  })

  async function onSubmit(values: TaskValues) {
    const result = await createTaskAction(boardId, values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Task created")
    queryClient.invalidateQueries({ queryKey: ["boards", boardId] })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          {...register("title")}
          placeholder="What needs to be done?"
          autoFocus
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          {...register("description")}
          placeholder="Add more detail…"
          className="min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <StatusSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <PrioritySelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Due date</Label>
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DueDatePicker
                value={field.value ?? null}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Assignee</Label>
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <AssigneeSelect
                value={field.value ?? null}
                members={members}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create task"}
        </Button>
      </DialogFooter>
    </form>
  )
}
