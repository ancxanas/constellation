"use client"

import { useBoardStore } from "@/stores/board-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "@/components/tasks/task-form"
import type { MemberDTO } from "@/lib/types"

export function NewTaskDialog({
  boardId,
  members,
}: {
  boardId: string
  members: MemberDTO[]
}) {
  const columnId = useBoardStore((state) => state.newTaskColumnId)
  const closeNewTask = useBoardStore((state) => state.closeNewTask)

  return (
    <Dialog
      open={!!columnId}
      onOpenChange={(open) => {
        if (!open) closeNewTask()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        {columnId && (
          <TaskForm
            key={columnId}
            boardId={boardId}
            columnId={columnId}
            members={members}
            onSuccess={closeNewTask}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
