"use client"

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { ColumnDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { KanbanTaskCard } from "@/components/kanban/kanban-task-card"

export function KanbanColumn({
  column,
  canEdit,
  disabled = false,
  onAddTask,
  onOpenTask,
  onRename,
  onDelete,
}: {
  column: ColumnDTO
  canEdit: boolean
  disabled?: boolean
  onAddTask: (columnId: string) => void
  onOpenTask: (taskId: string) => void
  onRename: (columnId: string, title: string) => void
  onDelete: (columnId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column:${column.id}`,
    data: { type: "column" },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={[
        "flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-foreground/10 bg-muted/40 p-3",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {column.title}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => onRename(column.id, column.title)}
              >
                <Pencil className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => onDelete(column.id)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {column.tasks.map((task) => (
          <KanbanTaskCard
            key={task.id}
            task={task}
            disabled={disabled}
            onClick={() => onOpenTask(task.id)}
          />
        ))}
      </div>

      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="size-4" />
          Add task
        </Button>
      )}
    </div>
  )
}
