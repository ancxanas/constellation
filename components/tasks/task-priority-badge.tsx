import type { TaskPriority } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "border-slate-700/50 bg-slate-200/70 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  MEDIUM:
    "border-blue-700/50 bg-blue-200/60 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "border-amber-700/50 bg-amber-200/60 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  URGENT:
    "border-red-700/50 bg-red-200/60 text-red-800 dark:bg-red-900/40 dark:text-red-300 dark:shadow-[0_0_12px_-3px_rgba(239,68,68,0.3)]",
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        priorityStyles[priority],
        "text-[10px] font-medium"
      )}
    >
      {priority.replace("_", " ")}
    </Badge>
  )
}
