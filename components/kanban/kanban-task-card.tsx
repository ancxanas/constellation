"use client"

import { MessageSquare } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { TaskDTO } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskDueDate } from "@/components/tasks/task-due-date"
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge"

export function KanbanTaskCard({
  task,
  onClick,
  disabled = false,
}: {
  task: TaskDTO
  onClick: () => void
  disabled?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task:${task.id}`,
    data: { type: "task" },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={[
        "group cursor-pointer touch-none rounded-lg border border-foreground/10 bg-card p-3",
        "shadow-sm transition-shadow hover:border-foreground/20 hover:shadow-md",
        isDragging ? "z-10 opacity-40" : "",
      ].join(" ")}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${tag.color}26`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TaskDueDate dueDate={task.dueDate ? new Date(task.dueDate) : null} />
            {task.commentsCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="size-3" />
                {task.commentsCount}
              </span>
            )}
          </div>
          {task.assignee && (
            <Avatar className="size-5">
              <AvatarImage
                src={task.assignee.image ?? undefined}
                alt={task.assignee.name ?? ""}
              />
              <AvatarFallback className="text-[8px]">
                {(task.assignee.name || task.assignee.email || "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div>
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>
    </div>
  )
}
